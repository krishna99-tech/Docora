package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var (
	ErrSharingLinkNotFound = errors.New("sharing link not found")
	ErrSharingLinkExpired  = errors.New("sharing link has expired")
	ErrSharingLinkRevoked  = errors.New("sharing link has been revoked")
	ErrMaxAccessReached    = errors.New("maximum access limit reached for this sharing link")
)

type SharingRepository struct {
	db *DB
}

func NewSharingRepository(db *DB) *SharingRepository {
	return &SharingRepository{db: db}
}

func (r *SharingRepository) CreateSharingLink(ctx context.Context, link *models.SharingLink) error {
	query := `
		INSERT INTO sharing_links (
			id, document_id, workspace_id, created_by, token_hash, password_hash,
			expires_at, max_accesses, access_count, allow_download, is_revoked, watermark_text, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	link.CreatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query,
		link.ID, link.DocumentID, link.WorkspaceID, link.CreatedBy, link.TokenHash, link.PasswordHash,
		link.ExpiresAt, link.MaxAccesses, link.AccessCount, link.AllowDownload, link.IsRevoked, link.WatermarkText, link.CreatedAt,
	)
	return err
}

func (r *SharingRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*models.SharingLink, error) {
	query := `
		SELECT 
			sl.id, sl.document_id, sl.workspace_id, sl.created_by, sl.token_hash, sl.password_hash,
			sl.expires_at, sl.max_accesses, sl.access_count, sl.allow_download, sl.is_revoked, sl.watermark_text, sl.created_at,
			d.title, d.document_type
		FROM sharing_links sl
		JOIN documents d ON sl.document_id = d.id
		WHERE sl.token_hash = $1
	`
	var l models.SharingLink
	var pwdHash *string
	err := r.db.Pool.QueryRow(ctx, query, tokenHash).Scan(
		&l.ID, &l.DocumentID, &l.WorkspaceID, &l.CreatedBy, &l.TokenHash, &pwdHash,
		&l.ExpiresAt, &l.MaxAccesses, &l.AccessCount, &l.AllowDownload, &l.IsRevoked, &l.WatermarkText, &l.CreatedAt,
		&l.DocumentTitle, &l.DocumentType,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSharingLinkNotFound
		}
		return nil, err
	}
	if pwdHash != nil && *pwdHash != "" {
		l.PasswordHash = *pwdHash
		l.HasPassword = true
	}
	return &l, nil
}

func (r *SharingRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]models.SharingLink, error) {
	query := `
		SELECT 
			sl.id, sl.document_id, sl.workspace_id, sl.created_by, sl.token_hash, sl.password_hash,
			sl.expires_at, sl.max_accesses, sl.access_count, sl.allow_download, sl.is_revoked, sl.watermark_text, sl.created_at,
			d.title, d.document_type
		FROM sharing_links sl
		JOIN documents d ON sl.document_id = d.id
		WHERE sl.workspace_id = $1
		ORDER BY sl.created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	links := make([]models.SharingLink, 0)
	for rows.Next() {
		var l models.SharingLink
		var pwdHash *string
		if err := rows.Scan(
			&l.ID, &l.DocumentID, &l.WorkspaceID, &l.CreatedBy, &l.TokenHash, &pwdHash,
			&l.ExpiresAt, &l.MaxAccesses, &l.AccessCount, &l.AllowDownload, &l.IsRevoked, &l.WatermarkText, &l.CreatedAt,
			&l.DocumentTitle, &l.DocumentType,
		); err != nil {
			return nil, err
		}
		if pwdHash != nil && *pwdHash != "" {
			l.HasPassword = true
		}
		links = append(links, l)
	}
	return links, nil
}

func (r *SharingRepository) IncrementAccessCount(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE sharing_links SET access_count = access_count + 1 WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, id)
	return err
}

func (r *SharingRepository) Revoke(ctx context.Context, id, workspaceID uuid.UUID) error {
	query := `UPDATE sharing_links SET is_revoked = true WHERE id = $1 AND workspace_id = $2`
	tag, err := r.db.Pool.Exec(ctx, query, id, workspaceID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrSharingLinkNotFound
	}
	return nil
}
