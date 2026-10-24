package repositories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/models"
)

type AuditRepository struct {
	db *DB
}

func NewAuditRepository(db *DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Log(ctx context.Context, docID, userID uuid.UUID, action string, prevStatus, newStatus *string, meta any) error {
	metaJSON, _ := json.Marshal(meta)
	if len(metaJSON) == 0 {
		metaJSON = []byte("{}")
	}

	query := `
		INSERT INTO document_audit_logs (id, document_id, user_id, action, previous_status, new_status, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.Pool.Exec(ctx, query, uuid.New(), docID, userID, action, prevStatus, newStatus, metaJSON, time.Now().UTC())
	return err
}

func (r *AuditRepository) ListForDocument(ctx context.Context, docID, userID uuid.UUID) ([]models.DocumentAuditLog, error) {
	query := `
		SELECT id, document_id, user_id, action, previous_status, new_status, metadata, created_at
		FROM document_audit_logs
		WHERE document_id = $1 AND user_id = $2
		ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, docID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := make([]models.DocumentAuditLog, 0)
	for rows.Next() {
		var log models.DocumentAuditLog
		if err := rows.Scan(
			&log.ID,
			&log.DocumentID,
			&log.UserID,
			&log.Action,
			&log.PreviousStatus,
			&log.NewStatus,
			&log.Metadata,
			&log.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}
