package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

type TemplateService struct {
	templateRepo *repositories.TemplateRepository
}

func NewTemplateService(templateRepo *repositories.TemplateRepository) *TemplateService {
	return &TemplateService{templateRepo: templateRepo}
}

func (s *TemplateService) List(ctx context.Context, userID uuid.UUID, docType string) ([]models.Template, error) {
	return s.templateRepo.List(ctx, userID, docType)
}

func (s *TemplateService) GetByID(ctx context.Context, userID, id uuid.UUID) (*models.Template, error) {
	return s.templateRepo.GetByID(ctx, userID, id)
}

func (s *TemplateService) Create(ctx context.Context, userID uuid.UUID, req models.CreateTemplateRequest) (*models.Template, error) {
	t := &models.Template{
		ID:              uuid.New(),
		UserID:          &userID,
		Name:            req.Name,
		DocumentType:    req.DocumentType,
		Description:     req.Description,
		TemplateContent: req.TemplateContent,
		Version:         1,
		IsDefault:       req.IsDefault,
		IsActive:        true,
	}
	if err := s.templateRepo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TemplateService) Duplicate(ctx context.Context, userID, sourceID uuid.UUID) (*models.Template, error) {
	source, err := s.templateRepo.GetByID(ctx, userID, sourceID)
	if err != nil {
		return nil, err
	}

	clone := &models.Template{
		ID:              uuid.New(),
		UserID:          &userID,
		Name:            fmt.Sprintf("%s (Copy)", source.Name),
		DocumentType:    source.DocumentType,
		Description:     source.Description,
		TemplateContent: source.TemplateContent,
		Version:         1,
		IsDefault:       false,
		IsActive:        true,
	}

	if err := s.templateRepo.Create(ctx, clone); err != nil {
		return nil, err
	}
	return clone, nil
}

func (s *TemplateService) Update(ctx context.Context, userID, id uuid.UUID, req models.CreateTemplateRequest) (*models.Template, error) {
	t, err := s.templateRepo.GetByID(ctx, userID, id)
	if err != nil {
		return nil, err
	}

	t.Name = req.Name
	t.Description = req.Description
	t.TemplateContent = req.TemplateContent
	t.IsDefault = req.IsDefault

	if err := s.templateRepo.Update(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TemplateService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	return s.templateRepo.Delete(ctx, userID, id)
}
