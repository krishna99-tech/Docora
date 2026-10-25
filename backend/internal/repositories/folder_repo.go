package repositories

import (
	"context"
	"time"

	"docora/backend/internal/models"

	"github.com/google/uuid"
)

type FolderRepository struct {
	db *DB
}

func NewFolderRepository(db *DB) *FolderRepository {
	return &FolderRepository{db: db}
}

func (r *FolderRepository) ListFolders(ctx context.Context, workspaceID uuid.UUID) ([]models.DocumentFolder, error) {
	query := `
		SELECT 
			f.id,
			f.workspace_id,
			f.parent_id,
			f.name,
			COALESCE(f.color, '#666666') as color,
			f.created_at,
			f.updated_at,
			COALESCE(COUNT(d.id), 0) as documentcount
		FROM document_folders f
		LEFT JOIN documents d ON d.folder_id = f.id
		WHERE f.workspace_id = $1
		GROUP BY f.id
		ORDER BY f.name ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return []models.DocumentFolder{}, nil
	}
	defer rows.Close()

	folders := []models.DocumentFolder{}
	for rows.Next() {
		var f models.DocumentFolder
		if err := rows.Scan(
			&f.ID,
			&f.WorkspaceID,
			&f.ParentID,
			&f.Name,
			&f.Color,
			&f.CreatedAt,
			&f.UpdatedAt,
			&f.DocumentCount,
		); err == nil {
			folders = append(folders, f)
		}
	}
	return folders, nil
}

func (r *FolderRepository) CreateFolder(ctx context.Context, f *models.DocumentFolder) error {
	query := `
		INSERT INTO document_folders (id, workspace_id, parent_id, name, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Pool.Exec(ctx, query, f.ID, f.WorkspaceID, f.ParentID, f.Name, f.Color, f.CreatedAt, f.UpdatedAt)
	return err
}

func (r *FolderRepository) UpdateFolder(ctx context.Context, f *models.DocumentFolder) error {
	query := `
		UPDATE document_folders
		SET name = $3, color = $4, parent_id = $5, updated_at = NOW()
		WHERE id = $1 AND workspace_id = $2
	`
	_, err := r.db.Pool.Exec(ctx, query, f.ID, f.WorkspaceID, f.Name, f.Color, f.ParentID)
	return err
}

func (r *FolderRepository) DeleteFolder(ctx context.Context, folderID, workspaceID uuid.UUID) error {
	// Move documents in this folder to root (folder_id = NULL)
	_, _ = r.db.Pool.Exec(ctx, `UPDATE documents SET folder_id = NULL WHERE folder_id = $1 AND workspace_id = $2`, folderID, workspaceID)
	query := `DELETE FROM document_folders WHERE id = $1 AND workspace_id = $2`
	_, err := r.db.Pool.Exec(ctx, query, folderID, workspaceID)
	return err
}

func (r *FolderRepository) MoveDocuments(ctx context.Context, workspaceID uuid.UUID, docIDs []uuid.UUID, folderID *uuid.UUID) error {
	if len(docIDs) == 0 {
		return nil
	}
	query := `
		UPDATE documents
		SET folder_id = $3, updated_at = NOW()
		WHERE workspace_id = $1 AND id = ANY($2)
	`
	_, err := r.db.Pool.Exec(ctx, query, workspaceID, docIDs, folderID)
	return err
}

func (r *FolderRepository) TagDocuments(ctx context.Context, workspaceID uuid.UUID, docIDs []uuid.UUID, tags []string) error {
	if len(docIDs) == 0 {
		return nil
	}
	query := `
		UPDATE documents
		SET tags = $3, updated_at = NOW()
		WHERE workspace_id = $1 AND id = ANY($2)
	`
	_, err := r.db.Pool.Exec(ctx, query, workspaceID, docIDs, tags)
	return err
}

func (r *FolderRepository) ArchiveDocuments(ctx context.Context, workspaceID uuid.UUID, docIDs []uuid.UUID, archive bool) error {
	if len(docIDs) == 0 {
		return nil
	}
	var archivedAt *time.Time
	if archive {
		now := time.Now()
		archivedAt = &now
	}
	query := `
		UPDATE documents
		SET is_archived = $3, archived_at = $4, updated_at = NOW()
		WHERE workspace_id = $1 AND id = ANY($2)
	`
	_, err := r.db.Pool.Exec(ctx, query, workspaceID, docIDs, archive, archivedAt)
	return err
}

func (r *FolderRepository) ApplyCompliance(ctx context.Context, workspaceID uuid.UUID, standard string, retentionDays int) error {
	var retentionUntil *time.Time
	if retentionDays > 0 {
		t := time.Now().AddDate(0, 0, retentionDays)
		retentionUntil = &t
	}
	query := `
		UPDATE documents
		SET compliance_standard = $2, retention_until = $3, updated_at = NOW()
		WHERE workspace_id = $1 AND is_archived = FALSE
	`
	_, err := r.db.Pool.Exec(ctx, query, workspaceID, standard, retentionUntil)
	return err
}
