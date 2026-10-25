package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"docora/backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type BillingRepository struct {
	db *DB
}

func NewBillingRepository(db *DB) *BillingRepository {
	return &BillingRepository{db: db}
}

func (r *BillingRepository) GetBillingStatus(ctx context.Context, workspaceID uuid.UUID) (*models.WorkspaceBillingStatus, error) {
	status := &models.WorkspaceBillingStatus{
		WorkspaceID: workspaceID,
	}

	var planStr, cycle, subStatus string
	var periodEnd *time.Time
	var quotaDocs, quotaStorage, quotaMembers, quotaWorkflows int

	query := `
		SELECT 
			COALESCE(plan, 'free'),
			COALESCE(billing_cycle, 'monthly'),
			COALESCE(subscription_status, 'active'),
			current_period_end,
			COALESCE(quota_documents_monthly, 50),
			COALESCE(quota_storage_mb, 100),
			COALESCE(quota_members, 2),
			COALESCE(quota_workflows, 3)
		FROM workspaces
		WHERE id = $1
	`
	err := r.db.Pool.QueryRow(ctx, query, workspaceID).Scan(
		&planStr,
		&cycle,
		&subStatus,
		&periodEnd,
		&quotaDocs,
		&quotaStorage,
		&quotaMembers,
		&quotaWorkflows,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("workspace not found")
		}
		return nil, fmt.Errorf("error reading workspace billing: %w", err)
	}

	status.Plan = models.PlanTier(planStr)
	status.BillingCycle = cycle
	status.SubscriptionStatus = subStatus
	if periodEnd != nil {
		status.CurrentPeriodEnd = *periodEnd
	} else {
		status.CurrentPeriodEnd = time.Now().AddDate(0, 1, 0)
	}
	status.QuotaDocumentsMonthly = quotaDocs
	status.QuotaStorageMB = quotaStorage
	status.QuotaMembers = quotaMembers
	status.QuotaWorkflows = quotaWorkflows

	// Current month document usage
	_ = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM documents
		WHERE workspace_id = $1 AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
	`, workspaceID).Scan(&status.DocumentsUsedThisMonth)

	// Storage used in bytes -> convert to MB
	var totalBytes *int64
	_ = r.db.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(file_size), 0)
		FROM documents
		WHERE workspace_id = $1
	`, workspaceID).Scan(&totalBytes)
	if totalBytes != nil && *totalBytes > 0 {
		status.StorageUsedMB = float64(*totalBytes) / (1024.0 * 1024.0)
	} else {
		status.StorageUsedMB = 0
	}

	// Member count
	_ = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM workspace_members
		WHERE workspace_id = $1
	`, workspaceID).Scan(&status.MembersCount)

	// Workflows count
	_ = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM workflows
		WHERE workspace_id = $1
	`, workspaceID).Scan(&status.WorkflowsCount)

	if status.QuotaDocumentsMonthly == -1 || status.DocumentsUsedThisMonth < status.QuotaDocumentsMonthly {
		status.CanGenerateMoreDocs = true
	} else {
		status.CanGenerateMoreDocs = false
	}

	return status, nil
}

func (r *BillingRepository) UpdatePlan(ctx context.Context, workspaceID uuid.UUID, plan models.PlanTier, cycle string) error {
	var targetPlan *models.PlanDefinition
	for i := range models.AvailablePlans {
		if models.AvailablePlans[i].ID == plan {
			targetPlan = &models.AvailablePlans[i]
			break
		}
	}
	if targetPlan == nil {
		targetPlan = &models.AvailablePlans[0] // fallback free
	}

	periodEnd := time.Now().AddDate(0, 1, 0)
	if cycle == "annual" {
		periodEnd = time.Now().AddDate(1, 0, 0)
	}

	query := `
		UPDATE workspaces
		SET plan = $2,
		    billing_cycle = $3,
		    subscription_status = 'active',
		    current_period_end = $4,
		    quota_documents_monthly = $5,
		    quota_storage_mb = $6,
		    quota_members = $7,
		    quota_workflows = $8,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(
		ctx,
		query,
		workspaceID,
		string(plan),
		cycle,
		periodEnd,
		targetPlan.QuotaDocuments,
		targetPlan.QuotaStorageMB,
		targetPlan.QuotaMembers,
		targetPlan.QuotaWorkflows,
	)
	if err != nil {
		return fmt.Errorf("failed to update workspace plan: %w", err)
	}

	// Create invoice record for upgrade/renewal if paid
	if targetPlan.PriceMonthly > 0 {
		amount := targetPlan.PriceMonthly * 100
		if cycle == "annual" {
			amount = targetPlan.PriceAnnual * 100
		}
		invNum := fmt.Sprintf("INV-%d-%s", time.Now().Unix(), workspaceID.String()[:6])
		_ = r.CreateInvoice(ctx, &models.WorkspaceInvoice{
			ID:            uuid.New(),
			WorkspaceID:   workspaceID,
			InvoiceNumber: invNum,
			Amount:        amount,
			Currency:      "USD",
			Status:        "paid",
			PaidAt:        time.Now(),
			CreatedAt:     time.Now(),
		})
	}

	return nil
}

func (r *BillingRepository) ListInvoices(ctx context.Context, workspaceID uuid.UUID) ([]models.WorkspaceInvoice, error) {
	invoices := []models.WorkspaceInvoice{}
	query := `
		SELECT id, workspace_id, invoice_number, amount, currency, status, paid_at, COALESCE(hosted_invoice_url, ''), created_at
		FROM workspace_invoices
		WHERE workspace_id = $1
		ORDER BY created_at DESC
		LIMIT 25
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return invoices, nil
	}
	defer rows.Close()

	for rows.Next() {
		var inv models.WorkspaceInvoice
		if err := rows.Scan(
			&inv.ID,
			&inv.WorkspaceID,
			&inv.InvoiceNumber,
			&inv.Amount,
			&inv.Currency,
			&inv.Status,
			&inv.PaidAt,
			&inv.HostedInvoiceURL,
			&inv.CreatedAt,
		); err == nil {
			invoices = append(invoices, inv)
		}
	}
	return invoices, nil
}

func (r *BillingRepository) CreateInvoice(ctx context.Context, inv *models.WorkspaceInvoice) error {
	query := `
		INSERT INTO workspace_invoices (id, workspace_id, invoice_number, amount, currency, status, paid_at, hosted_invoice_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.Pool.Exec(
		ctx,
		query,
		inv.ID,
		inv.WorkspaceID,
		inv.InvoiceNumber,
		inv.Amount,
		inv.Currency,
		inv.Status,
		inv.PaidAt,
		inv.HostedInvoiceURL,
		inv.CreatedAt,
	)
	return err
}
