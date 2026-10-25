package services

import (
	"context"
	"fmt"

	"docora/backend/internal/models"
	"docora/backend/internal/repositories"

	"github.com/google/uuid"
)

type BillingService struct {
	billingRepo *repositories.BillingRepository
}

func NewBillingService(billingRepo *repositories.BillingRepository) *BillingService {
	return &BillingService{
		billingRepo: billingRepo,
	}
}

func (s *BillingService) GetBillingStatus(ctx context.Context, workspaceID uuid.UUID) (*models.WorkspaceBillingStatus, error) {
	return s.billingRepo.GetBillingStatus(ctx, workspaceID)
}

func (s *BillingService) GetAvailablePlans() []models.PlanDefinition {
	return models.AvailablePlans
}

func (s *BillingService) ChangePlan(ctx context.Context, workspaceID uuid.UUID, req models.ChangePlanRequest) (*models.WorkspaceBillingStatus, error) {
	err := s.billingRepo.UpdatePlan(ctx, workspaceID, req.Plan, req.BillingCycle)
	if err != nil {
		return nil, err
	}
	return s.billingRepo.GetBillingStatus(ctx, workspaceID)
}

func (s *BillingService) ListInvoices(ctx context.Context, workspaceID uuid.UUID) ([]models.WorkspaceInvoice, error) {
	return s.billingRepo.ListInvoices(ctx, workspaceID)
}

func (s *BillingService) CheckCanGenerateDocument(ctx context.Context, workspaceID uuid.UUID) error {
	status, err := s.billingRepo.GetBillingStatus(ctx, workspaceID)
	if err != nil {
		// Non-fatal if billing record missing, allow generation
		return nil
	}
	if !status.CanGenerateMoreDocs {
		return fmt.Errorf("monthly document generation limit of %d documents reached for your %s plan. Please upgrade your workspace subscription to continue generating documents", status.QuotaDocumentsMonthly, status.Plan)
	}
	return nil
}
