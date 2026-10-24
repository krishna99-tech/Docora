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
	ErrVerificationRecordNotFound = errors.New("verification record not found")
)

type VerificationRepository struct {
	db *DB
}

func NewVerificationRepository(db *DB) *VerificationRepository {
	return &VerificationRepository{db: db}
}

func (r *VerificationRepository) UpsertRecord(ctx context.Context, rec *models.VerificationRecord) error {
	query := `
		INSERT INTO verification_records (id, document_id, verification_token, sha256_hash, qr_payload, is_revoked, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (document_id)
		DO UPDATE SET verification_token = $3, sha256_hash = $4, qr_payload = $5, is_revoked = $6
	`
	rec.CreatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query,
		rec.ID, rec.DocumentID, rec.VerificationToken, rec.SHA256Hash, rec.QRPayload, rec.IsRevoked, rec.CreatedAt,
	)
	return err
}

func (r *VerificationRepository) GetByToken(ctx context.Context, token string) (*models.VerificationRecord, *models.Document, *models.BusinessProfile, error) {
	query := `
		SELECT 
			vr.id, vr.document_id, vr.verification_token, vr.sha256_hash, vr.qr_payload, vr.is_revoked, vr.created_at,
			d.id, d.document_number, d.document_type, d.title, d.status, d.issue_date, d.storage_key, d.file_size,
			bp.business_name
		FROM verification_records vr
		JOIN documents d ON vr.document_id = d.id
		LEFT JOIN business_profiles bp ON d.user_id = bp.user_id
		WHERE vr.verification_token = $1
	`
	var vr models.VerificationRecord
	var doc models.Document
	var bpName *string

	err := r.db.Pool.QueryRow(ctx, query, token).Scan(
		&vr.ID, &vr.DocumentID, &vr.VerificationToken, &vr.SHA256Hash, &vr.QRPayload, &vr.IsRevoked, &vr.CreatedAt,
		&doc.ID, &doc.DocumentNumber, &doc.DocumentType, &doc.Title, &doc.Status, &doc.IssueDate, &doc.StorageKey, &doc.FileSize,
		&bpName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, nil, ErrVerificationRecordNotFound
		}
		return nil, nil, nil, err
	}

	bp := &models.BusinessProfile{}
	if bpName != nil {
		bp.BusinessName = *bpName
	}

	return &vr, &doc, bp, nil
}

func (r *VerificationRepository) GetByDocumentID(ctx context.Context, docID uuid.UUID) (*models.VerificationRecord, error) {
	query := `SELECT id, document_id, verification_token, sha256_hash, qr_payload, is_revoked, created_at FROM verification_records WHERE document_id = $1`
	var vr models.VerificationRecord
	err := r.db.Pool.QueryRow(ctx, query, docID).Scan(
		&vr.ID, &vr.DocumentID, &vr.VerificationToken, &vr.SHA256Hash, &vr.QRPayload, &vr.IsRevoked, &vr.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVerificationRecordNotFound
		}
		return nil, err
	}
	return &vr, nil
}
