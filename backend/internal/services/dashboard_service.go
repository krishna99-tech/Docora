package services

import (
	"context"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

type DashboardService struct {
	docRepo *repositories.DocumentRepository
}

func NewDashboardService(docRepo *repositories.DocumentRepository) *DashboardService {
	return &DashboardService{docRepo: docRepo}
}

func (s *DashboardService) GetStats(ctx context.Context, userID uuid.UUID) (*models.DashboardStats, error) {
	return s.docRepo.GetDashboardStats(ctx, userID)
}

func (s *DashboardService) GetRecentDocuments(ctx context.Context, userID uuid.UUID, limit int) ([]models.Document, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}
	filter := models.DocumentListFilter{
		Page:      1,
		PageSize:  limit,
		SortBy:    "created_at",
		SortOrder: "desc",
	}
	docs, _, err := s.docRepo.List(ctx, userID, filter)
	return docs, err
}
