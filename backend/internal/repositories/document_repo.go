package repositories

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var (
	ErrDocumentNotFound = errors.New("document not found")
	ErrDocumentFinalized = errors.New("finalized document cannot be edited or deleted")
)

type DocumentRepository struct {
	db *DB
}

func NewDocumentRepository(db *DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

// NextDocumentNumber generates a concurrency-safe sequential document number per user and type
func (r *DocumentRepository) NextDocumentNumber(ctx context.Context, tx pgx.Tx, userID uuid.UUID, docType string) (string, error) {
	prefix := "DOC"
	switch docType {
	case models.TypeReceipt:
		prefix = "REC"
	case models.TypeInvoice:
		prefix = "INV"
	case models.TypeQuotation:
		prefix = "QUO"
	case models.TypeEstimate:
		prefix = "EST"
	case models.TypeStatement:
		prefix = "STM"
	}

	query := `
		INSERT INTO document_sequences (user_id, document_type, current_val, prefix)
		VALUES ($1, $2, 1, $3)
		ON CONFLICT (user_id, document_type)
		DO UPDATE SET current_val = document_sequences.current_val + 1
		RETURNING current_val
	`

	var currentVal int64
	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, userID, docType, prefix).Scan(&currentVal)
	} else {
		err = r.db.Pool.QueryRow(ctx, query, userID, docType, prefix).Scan(&currentVal)
	}

	if err != nil {
		return "", fmt.Errorf("failed allocating document sequence: %w", err)
	}

	return fmt.Sprintf("%s-%05d", prefix, currentVal), nil
}

// Create stores a document and its items atomically in a transaction
func (r *DocumentRepository) Create(ctx context.Context, doc *models.Document) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	if doc.ID == uuid.Nil {
		doc.ID = uuid.New()
	}
	if doc.DocumentNumber == "" {
		num, err := r.NextDocumentNumber(ctx, tx, doc.UserID, doc.DocumentType)
		if err != nil {
			return err
		}
		doc.DocumentNumber = num
	}
	if doc.Status == "" {
		doc.Status = models.StatusDraft
	}

	now := time.Now().UTC()
	doc.CreatedAt = now
	doc.UpdatedAt = now
	if doc.IssueDate.IsZero() {
		doc.IssueDate = now
	}

	docQuery := `
		INSERT INTO documents (
			id, user_id, customer_id, document_number, document_type, title, status,
			currency, subtotal_minor, discount_minor, tax_minor, total_minor,
			amount_paid_minor, balance_minor, issue_date, due_date, payment_method,
			payment_reference, notes, terms, template_version_id, storage_key,
			filename, mime_type, file_size, sha256, metadata, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17,
			$18, $19, $20, $21, $22,
			$23, $24, $25, $26, $27, $28, $29
		)
	`

	metadataJSON := doc.Metadata
	if len(metadataJSON) == 0 {
		metadataJSON = []byte("{}")
	}

	_, err = tx.Exec(ctx, docQuery,
		doc.ID, doc.UserID, doc.CustomerID, doc.DocumentNumber, doc.DocumentType, doc.Title, doc.Status,
		doc.Currency, doc.SubtotalMinor, doc.DiscountMinor, doc.TaxMinor, doc.TotalMinor,
		doc.AmountPaidMinor, doc.BalanceMinor, doc.IssueDate, doc.DueDate, doc.PaymentMethod,
		doc.PaymentReference, doc.Notes, doc.Terms, doc.TemplateVersionID, doc.StorageKey,
		doc.Filename, doc.MimeType, doc.FileSize, doc.SHA256, metadataJSON, doc.CreatedAt, doc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed inserting document record: %w", err)
	}

	// Insert items
	itemQuery := `
		INSERT INTO document_items (
			id, document_id, description, quantity, unit_price_minor,
			discount_minor, tax_rate, tax_minor, line_total_minor, sort_order
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	for i := range doc.Items {
		item := &doc.Items[i]
		if item.ID == uuid.Nil {
			item.ID = uuid.New()
		}
		item.DocumentID = doc.ID
		item.SortOrder = i

		_, err = tx.Exec(ctx, itemQuery,
			item.ID, item.DocumentID, item.Description, item.Quantity, item.UnitPriceMinor,
			item.DiscountMinor, item.TaxRate, item.TaxMinor, item.LineTotalMinor, item.SortOrder,
		)
		if err != nil {
			return fmt.Errorf("failed inserting document item %d: %w", i, err)
		}
	}

	// Record audit log
	auditQuery := `
		INSERT INTO document_audit_logs (id, document_id, user_id, action, new_status, metadata, created_at)
		VALUES ($1, $2, $3, 'created', $4, $5, $6)
	`
	_, err = tx.Exec(ctx, auditQuery, uuid.New(), doc.ID, doc.UserID, doc.Status, []byte(`{"event":"document_created"}`), now)
	if err != nil {
		return fmt.Errorf("failed inserting audit log: %w", err)
	}

	return tx.Commit(ctx)
}

// Update updates document metadata and replaces items in a transaction (only if draft)
func (r *DocumentRepository) Update(ctx context.Context, doc *models.Document) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// Verify not finalized
	var existingStatus string
	checkQuery := `SELECT status FROM documents WHERE id = $1 AND user_id = $2 FOR UPDATE`
	err = tx.QueryRow(ctx, checkQuery, doc.ID, doc.UserID).Scan(&existingStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrDocumentNotFound
		}
		return err
	}
	if existingStatus == models.StatusFinalized || existingStatus == models.StatusPaid {
		return ErrDocumentFinalized
	}

	now := time.Now().UTC()
	doc.UpdatedAt = now

	metadataJSON := doc.Metadata
	if len(metadataJSON) == 0 {
		metadataJSON = []byte("{}")
	}

	updateQuery := `
		UPDATE documents SET
			customer_id = $1, title = $2, currency = $3,
			subtotal_minor = $4, discount_minor = $5, tax_minor = $6, total_minor = $7,
			amount_paid_minor = $8, balance_minor = $9, issue_date = $10, due_date = $11,
			payment_method = $12, payment_reference = $13, notes = $14, terms = $15,
			template_version_id = $16, metadata = $17, updated_at = $18
		WHERE id = $19 AND user_id = $20
	`
	_, err = tx.Exec(ctx, updateQuery,
		doc.CustomerID, doc.Title, doc.Currency,
		doc.SubtotalMinor, doc.DiscountMinor, doc.TaxMinor, doc.TotalMinor,
		doc.AmountPaidMinor, doc.BalanceMinor, doc.IssueDate, doc.DueDate,
		doc.PaymentMethod, doc.PaymentReference, doc.Notes, doc.Terms,
		doc.TemplateVersionID, metadataJSON, doc.UpdatedAt,
		doc.ID, doc.UserID,
	)
	if err != nil {
		return err
	}

	// Delete and recreate items
	_, err = tx.Exec(ctx, `DELETE FROM document_items WHERE document_id = $1`, doc.ID)
	if err != nil {
		return err
	}

	itemQuery := `
		INSERT INTO document_items (
			id, document_id, description, quantity, unit_price_minor,
			discount_minor, tax_rate, tax_minor, line_total_minor, sort_order
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	for i := range doc.Items {
		item := &doc.Items[i]
		if item.ID == uuid.Nil {
			item.ID = uuid.New()
		}
		item.DocumentID = doc.ID
		item.SortOrder = i

		_, err = tx.Exec(ctx, itemQuery,
			item.ID, item.DocumentID, item.Description, item.Quantity, item.UnitPriceMinor,
			item.DiscountMinor, item.TaxRate, item.TaxMinor, item.LineTotalMinor, item.SortOrder,
		)
		if err != nil {
			return err
		}
	}

	// Audit update
	_, _ = tx.Exec(ctx, `
		INSERT INTO document_audit_logs (id, document_id, user_id, action, new_status, metadata, created_at)
		VALUES ($1, $2, $3, 'updated', $4, $5, $6)
	`, uuid.New(), doc.ID, doc.UserID, existingStatus, []byte(`{"event":"document_updated"}`), now)

	return tx.Commit(ctx)
}

func (r *DocumentRepository) GetByID(ctx context.Context, userID, id uuid.UUID) (*models.Document, error) {
	query := `
		SELECT 
			d.id, d.user_id, d.customer_id, d.document_number, d.document_type, d.title, d.status,
			d.currency, d.subtotal_minor, d.discount_minor, d.tax_minor, d.total_minor,
			d.amount_paid_minor, d.balance_minor, d.issue_date, d.due_date, d.payment_method,
			d.payment_reference, d.notes, d.terms, d.template_version_id, d.storage_key,
			d.filename, d.mime_type, d.file_size, d.sha256, d.metadata, d.created_at, d.updated_at, d.finalized_at,
			c.id, c.name, c.email, c.phone, c.address
		FROM documents d
		LEFT JOIN customers c ON d.customer_id = c.id
		WHERE d.id = $1 AND d.user_id = $2
	`

	var doc models.Document
	var custID *uuid.UUID
	var custName, custEmail, custPhone, custAddress *string

	err := r.db.Pool.QueryRow(ctx, query, id, userID).Scan(
		&doc.ID, &doc.UserID, &doc.CustomerID, &doc.DocumentNumber, &doc.DocumentType, &doc.Title, &doc.Status,
		&doc.Currency, &doc.SubtotalMinor, &doc.DiscountMinor, &doc.TaxMinor, &doc.TotalMinor,
		&doc.AmountPaidMinor, &doc.BalanceMinor, &doc.IssueDate, &doc.DueDate, &doc.PaymentMethod,
		&doc.PaymentReference, &doc.Notes, &doc.Terms, &doc.TemplateVersionID, &doc.StorageKey,
		&doc.Filename, &doc.MimeType, &doc.FileSize, &doc.SHA256, &doc.Metadata, &doc.CreatedAt, &doc.UpdatedAt, &doc.FinalizedAt,
		&custID, &custName, &custEmail, &custPhone, &custAddress,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDocumentNotFound
		}
		return nil, err
	}

	if custID != nil {
		doc.Customer = &models.Customer{
			ID:      *custID,
			UserID:  doc.UserID,
			Name:    stringValue(custName),
			Email:   stringValue(custEmail),
			Phone:   stringValue(custPhone),
			Address: stringValue(custAddress),
		}
	}

	// Fetch items
	itemQuery := `
		SELECT id, document_id, description, quantity, unit_price_minor, discount_minor, tax_rate, tax_minor, line_total_minor, sort_order
		FROM document_items
		WHERE document_id = $1
		ORDER BY sort_order ASC
	`
	rows, err := r.db.Pool.Query(ctx, itemQuery, doc.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	doc.Items = make([]models.DocumentItem, 0)
	for rows.Next() {
		var item models.DocumentItem
		if err := rows.Scan(
			&item.ID, &item.DocumentID, &item.Description, &item.Quantity, &item.UnitPriceMinor,
			&item.DiscountMinor, &item.TaxRate, &item.TaxMinor, &item.LineTotalMinor, &item.SortOrder,
		); err != nil {
			return nil, err
		}
		doc.Items = append(doc.Items, item)
	}

	return &doc, nil
}

func (r *DocumentRepository) List(ctx context.Context, userID uuid.UUID, filter models.DocumentListFilter) ([]models.Document, int64, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	offset := (filter.Page - 1) * filter.PageSize

	whereClauses := []string{"d.user_id = $1"}
	args := []any{userID}
	argIdx := 2

	if filter.Type != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("d.document_type = $%d", argIdx))
		args = append(args, filter.Type)
		argIdx++
	}

	if filter.Status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("d.status = $%d", argIdx))
		args = append(args, filter.Status)
		argIdx++
	}

	if filter.CustomerID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("d.customer_id = $%d", argIdx))
		args = append(args, *filter.CustomerID)
		argIdx++
	}

	if filter.Search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(d.document_number ILIKE $%d OR d.title ILIKE $%d OR c.name ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM documents d
		LEFT JOIN customers c ON d.customer_id = c.id
		WHERE %s
	`, whereSQL)

	var total int64
	err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	sortColumn := "d.created_at"
	switch filter.SortBy {
	case "document_number":
		sortColumn = "d.document_number"
	case "total":
		sortColumn = "d.total_minor"
	case "issue_date":
		sortColumn = "d.issue_date"
	}

	sortDir := "DESC"
	if strings.ToLower(filter.SortOrder) == "asc" {
		sortDir = "ASC"
	}

	listQuery := fmt.Sprintf(`
		SELECT 
			d.id, d.user_id, d.customer_id, d.document_number, d.document_type, d.title, d.status,
			d.currency, d.subtotal_minor, d.discount_minor, d.tax_minor, d.total_minor,
			d.amount_paid_minor, d.balance_minor, d.issue_date, d.due_date, d.payment_method,
			d.payment_reference, d.notes, d.terms, d.template_version_id, d.storage_key,
			d.filename, d.mime_type, d.file_size, d.sha256, d.metadata, d.created_at, d.updated_at, d.finalized_at,
			c.id, c.name, c.email, c.phone, c.address
		FROM documents d
		LEFT JOIN customers c ON d.customer_id = c.id
		WHERE %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereSQL, sortColumn, sortDir, argIdx, argIdx+1)

	queryArgs := append(args, filter.PageSize, offset)
	rows, err := r.db.Pool.Query(ctx, listQuery, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	docs := make([]models.Document, 0)
	for rows.Next() {
		var doc models.Document
		var custID *uuid.UUID
		var custName, custEmail, custPhone, custAddress *string

		if err := rows.Scan(
			&doc.ID, &doc.UserID, &doc.CustomerID, &doc.DocumentNumber, &doc.DocumentType, &doc.Title, &doc.Status,
			&doc.Currency, &doc.SubtotalMinor, &doc.DiscountMinor, &doc.TaxMinor, &doc.TotalMinor,
			&doc.AmountPaidMinor, &doc.BalanceMinor, &doc.IssueDate, &doc.DueDate, &doc.PaymentMethod,
			&doc.PaymentReference, &doc.Notes, &doc.Terms, &doc.TemplateVersionID, &doc.StorageKey,
			&doc.Filename, &doc.MimeType, &doc.FileSize, &doc.SHA256, &doc.Metadata, &doc.CreatedAt, &doc.UpdatedAt, &doc.FinalizedAt,
			&custID, &custName, &custEmail, &custPhone, &custAddress,
		); err != nil {
			return nil, 0, err
		}

		if custID != nil {
			doc.Customer = &models.Customer{
				ID:      *custID,
				UserID:  doc.UserID,
				Name:    stringValue(custName),
				Email:   stringValue(custEmail),
				Phone:   stringValue(custPhone),
				Address: stringValue(custAddress),
			}
		}
		docs = append(docs, doc)
	}

	return docs, total, nil
}

func (r *DocumentRepository) UpdateStatus(ctx context.Context, userID, id uuid.UUID, status string) error {
	var finalizedAt *time.Time
	if status == models.StatusFinalized || status == models.StatusIssued || status == models.StatusPaid {
		now := time.Now().UTC()
		finalizedAt = &now
	}

	query := `
		UPDATE documents
		SET status = $1, finalized_at = COALESCE(finalized_at, $2), updated_at = NOW()
		WHERE id = $3 AND user_id = $4
	`
	res, err := r.db.Pool.Exec(ctx, query, status, finalizedAt, id, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrDocumentNotFound
	}
	return nil
}

func (r *DocumentRepository) UpdateStorage(ctx context.Context, userID, id uuid.UUID, key, filename string, size int64, sha256 string) error {
	query := `
		UPDATE documents
		SET storage_key = $1, filename = $2, file_size = $3, sha256 = $4, updated_at = NOW()
		WHERE id = $5 AND user_id = $6
	`
	_, err := r.db.Pool.Exec(ctx, query, key, filename, size, sha256, id, userID)
	return err
}

func (r *DocumentRepository) DeleteDraft(ctx context.Context, userID, id uuid.UUID) error {
	query := `DELETE FROM documents WHERE id = $1 AND user_id = $2 AND status = 'draft'`
	res, err := r.db.Pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("cannot delete: document not found or is already finalized")
	}
	return nil
}

func (r *DocumentRepository) GetDashboardStats(ctx context.Context, userID uuid.UUID) (*models.DashboardStats, error) {
	query := `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE document_type = 'receipt'),
			COUNT(*) FILTER (WHERE document_type = 'invoice'),
			COUNT(*) FILTER (WHERE document_type = 'general'),
			COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)),
			COALESCE(SUM(amount_paid_minor) FILTER (WHERE document_type = 'receipt'), 0)::bigint,
			COALESCE(SUM(balance_minor) FILTER (WHERE document_type = 'invoice' AND status NOT IN ('draft', 'cancelled', 'paid')), 0)::bigint
		FROM documents
		WHERE user_id = $1
	`
	var stats models.DashboardStats
	err := r.db.Pool.QueryRow(ctx, query, userID).Scan(
		&stats.TotalDocuments,
		&stats.ReceiptsGenerated,
		&stats.InvoicesGenerated,
		&stats.GeneralPDFsGenerated,
		&stats.DocumentsThisMonth,
		&stats.TotalReceiptRevenue,
		&stats.TotalInvoicePending,
	)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
