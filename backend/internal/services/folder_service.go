package services

import (
	"context"
	"time"

	"docora/backend/internal/models"
	"docora/backend/internal/repositories"

	"github.com/google/uuid"
)

type FolderService struct {
	folderRepo *repositories.FolderRepository
}

func NewFolderService(folderRepo *repositories.FolderRepository) *FolderService {
	return &FolderService{folderRepo: folderRepo}
}

func (s *FolderService) ListFolders(ctx context.Context, workspaceID uuid.UUID) ([]models.DocumentFolder, error) {
	return s.folderRepo.ListFolders(ctx, workspaceID)
}

func (s *FolderService) CreateFolder(ctx context.Context, workspaceID uuid.UUID, req models.CreateFolderRequest) (*models.DocumentFolder, error) {
	color := req.Color
	if color == "" {
		color = "#666666"
	}
	f := &models.DocumentFolder{
		ID:            uuid.New(),
		WorkspaceID:   workspaceID,
		ParentID:      req.ParentID,
		Name:          req.Name,
		Color:         color,
		DocumentCount: 0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	if err := s.folderRepo.CreateFolder(ctx, f); err != nil {
		return nil, err
	}
	return f, nil
}

func (s *FolderService) UpdateFolder(ctx context.Context, workspaceID, folderID uuid.UUID, req models.UpdateFolderRequest) error {
	f := &models.DocumentFolder{
		ID:          folderID,
		WorkspaceID: workspaceID,
		ParentID:    req.ParentID,
		Name:        req.Name,
		Color:       req.Color,
	}
	return s.folderRepo.UpdateFolder(ctx, f)
}

func (s *FolderService) DeleteFolder(ctx context.Context, workspaceID, folderID uuid.UUID) error {
	return s.folderRepo.DeleteFolder(ctx, folderID, workspaceID)
}

func (s *FolderService) MoveDocuments(ctx context.Context, workspaceID uuid.UUID, req models.MoveDocumentsRequest) error {
	return s.folderRepo.MoveDocuments(ctx, workspaceID, req.DocumentIDs, req.FolderID)
}

func (s *FolderService) TagDocuments(ctx context.Context, workspaceID uuid.UUID, req models.TagDocumentsRequest) error {
	return s.folderRepo.TagDocuments(ctx, workspaceID, req.DocumentIDs, req.Tags)
}

func (s *FolderService) ArchiveDocuments(ctx context.Context, workspaceID uuid.UUID, req models.ArchiveDocumentsRequest) error {
	return s.folderRepo.ArchiveDocuments(ctx, workspaceID, req.DocumentIDs, req.Archive)
}

func (s *FolderService) ApplyCompliance(ctx context.Context, workspaceID uuid.UUID, req models.ComplianceSettingsRequest) error {
	return s.folderRepo.ApplyCompliance(ctx, workspaceID, req.ComplianceStandard, req.RetentionDays)
}
