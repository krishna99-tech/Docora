package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var ErrTemplateNotFound = errors.New("template not found")

type TemplateRepository struct {
	db *DB
}

func NewTemplateRepository(db *DB) *TemplateRepository {
	return &TemplateRepository{db: db}
}

func (r *TemplateRepository) List(ctx context.Context, userID uuid.UUID, docType string) ([]models.Template, error) {
	query := `
		SELECT id, user_id, name, document_type, description, template_content,
		       version, is_default, is_active, created_at, updated_at
		FROM templates
		WHERE (user_id = $1 OR user_id IS NULL) AND is_active = true
	`
	var rows pgx.Rows
	var err error

	if docType != "" {
		query += " AND document_type = $2 ORDER BY is_default DESC, name ASC"
		rows, err = r.db.Pool.Query(ctx, query, userID, docType)
	} else {
		query += " ORDER BY document_type ASC, is_default DESC, name ASC"
		rows, err = r.db.Pool.Query(ctx, query, userID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	templates := make([]models.Template, 0)
	for rows.Next() {
		var t models.Template
		if err := rows.Scan(
			&t.ID,
			&t.UserID,
			&t.Name,
			&t.DocumentType,
			&t.Description,
			&t.TemplateContent,
			&t.Version,
			&t.IsDefault,
			&t.IsActive,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (r *TemplateRepository) GetByID(ctx context.Context, userID, id uuid.UUID) (*models.Template, error) {
	query := `
		SELECT id, user_id, name, document_type, description, template_content,
		       version, is_default, is_active, created_at, updated_at
		FROM templates
		WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
	`
	var t models.Template
	err := r.db.Pool.QueryRow(ctx, query, id, userID).Scan(
		&t.ID,
		&t.UserID,
		&t.Name,
		&t.DocumentType,
		&t.Description,
		&t.TemplateContent,
		&t.Version,
		&t.IsDefault,
		&t.IsActive,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTemplateNotFound
		}
		return nil, err
	}
	return &t, nil
}

func (r *TemplateRepository) Create(ctx context.Context, t *models.Template) error {
	query := `
		INSERT INTO templates (id, user_id, name, document_type, description, template_content, version, is_default, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.Version < 1 {
		t.Version = 1
	}
	now := time.Now().UTC()
	t.CreatedAt = now
	t.UpdatedAt = now

	_, err := r.db.Pool.Exec(ctx, query,
		t.ID,
		t.UserID,
		t.Name,
		t.DocumentType,
		t.Description,
		t.TemplateContent,
		t.Version,
		t.IsDefault,
		t.IsActive,
		t.CreatedAt,
		t.UpdatedAt,
	)
	return err
}

func (r *TemplateRepository) Update(ctx context.Context, t *models.Template) error {
	query := `
		UPDATE templates
		SET name = $1, description = $2, template_content = $3, is_default = $4, is_active = $5, updated_at = NOW()
		WHERE id = $6 AND user_id = $7
	`
	res, err := r.db.Pool.Exec(ctx, query,
		t.Name,
		t.Description,
		t.TemplateContent,
		t.IsDefault,
		t.IsActive,
		t.ID,
		t.UserID,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrTemplateNotFound
	}
	return nil
}

func (r *TemplateRepository) Delete(ctx context.Context, userID, id uuid.UUID) error {
	// Only user-owned templates can be deleted (system templates have user_id NULL)
	query := `DELETE FROM templates WHERE id = $1 AND user_id = $2`
	res, err := r.db.Pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrTemplateNotFound
	}
	return nil
}
