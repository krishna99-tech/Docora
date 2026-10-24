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
	ErrVersionNotFound = errors.New("document version not found")
)

type VersionRepository struct {
	db *DB
}

func NewVersionRepository(db *DB) *VersionRepository {
	return &VersionRepository{db: db}
}

func (r *VersionRepository) CreateVersion(ctx context.Context, v *models.DocumentVersion) error {
	// Determine next version number
	var nextVer int
	queryVer := `SELECT COALESCE(MAX(version_number), 0) + 1 FROM document_versions WHERE document_id = $1`
	err := r.db.Pool.QueryRow(ctx, queryVer, v.DocumentID).Scan(&nextVer)
	if err != nil {
		return err
	}
	v.VersionNumber = nextVer

	query := `
		INSERT INTO document_versions (id, document_id, version_number, user_id, change_summary, snapshot_data, storage_key, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	v.CreatedAt = time.Now().UTC()
	_, err = r.db.Pool.Exec(ctx, query, v.ID, v.DocumentID, v.VersionNumber, v.UserID, v.ChangeSummary, v.SnapshotData, v.StorageKey, v.CreatedAt)
	return err
}

func (r *VersionRepository) ListByDocumentID(ctx context.Context, docID uuid.UUID) ([]models.DocumentVersion, error) {
	query := `
		SELECT dv.id, dv.document_id, dv.version_number, dv.user_id, dv.change_summary, dv.snapshot_data, dv.storage_key, dv.created_at, u.name
		FROM document_versions dv
		JOIN users u ON dv.user_id = u.id
		WHERE dv.document_id = $1
		ORDER BY dv.version_number DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, docID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []models.DocumentVersion
	for rows.Next() {
		var v models.DocumentVersion
		if err := rows.Scan(&v.ID, &v.DocumentID, &v.VersionNumber, &v.UserID, &v.ChangeSummary, &v.SnapshotData, &v.StorageKey, &v.CreatedAt, &v.UserName); err != nil {
			return nil, err
		}
		versions = append(versions, v)
	}
	return versions, nil
}

func (r *VersionRepository) GetByNumber(ctx context.Context, docID uuid.UUID, versionNumber int) (*models.DocumentVersion, error) {
	query := `
		SELECT dv.id, dv.document_id, dv.version_number, dv.user_id, dv.change_summary, dv.snapshot_data, dv.storage_key, dv.created_at, u.name
		FROM document_versions dv
		JOIN users u ON dv.user_id = u.id
		WHERE dv.document_id = $1 AND dv.version_number = $2
	`
	var v models.DocumentVersion
	err := r.db.Pool.QueryRow(ctx, query, docID, versionNumber).Scan(
		&v.ID, &v.DocumentID, &v.VersionNumber, &v.UserID, &v.ChangeSummary, &v.SnapshotData, &v.StorageKey, &v.CreatedAt, &v.UserName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVersionNotFound
		}
		return nil, err
	}
	return &v, nil
}
