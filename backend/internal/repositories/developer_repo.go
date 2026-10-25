package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var (
	ErrApiKeyNotFound  = errors.New("API key not found")
	ErrWebhookNotFound = errors.New("webhook not found")
)

type DeveloperRepository struct {
	db *DB
}

func NewDeveloperRepository(db *DB) *DeveloperRepository {
	return &DeveloperRepository{db: db}
}

// API Keys

func (r *DeveloperRepository) CreateApiKey(ctx context.Context, k *models.ApiKey) error {
	query := `
		INSERT INTO api_keys (id, workspace_id, user_id, name, key_prefix, key_hash, permissions, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	k.CreatedAt = time.Now().UTC()
	permsJSON, _ := json.Marshal(k.Permissions)
	_, err := r.db.Pool.Exec(ctx, query, k.ID, k.WorkspaceID, k.UserID, k.Name, k.KeyPrefix, k.KeyHash, permsJSON, k.CreatedAt)
	return err
}

func (r *DeveloperRepository) GetApiKeyByHash(ctx context.Context, hash string) (*models.ApiKey, error) {
	query := `
		SELECT id, workspace_id, user_id, name, key_prefix, key_hash, permissions, last_used_at, revoked_at, created_at
		FROM api_keys
		WHERE key_hash = $1
	`
	var k models.ApiKey
	var permsRaw []byte
	err := r.db.Pool.QueryRow(ctx, query, hash).Scan(
		&k.ID, &k.WorkspaceID, &k.UserID, &k.Name, &k.KeyPrefix, &k.KeyHash, &permsRaw,
		&k.LastUsedAt, &k.RevokedAt, &k.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrApiKeyNotFound
		}
		return nil, err
	}
	_ = json.Unmarshal(permsRaw, &k.Permissions)
	return &k, nil
}

func (r *DeveloperRepository) ListApiKeys(ctx context.Context, workspaceID uuid.UUID) ([]models.ApiKey, error) {
	query := `
		SELECT id, workspace_id, user_id, name, key_prefix, key_hash, permissions, last_used_at, revoked_at, created_at
		FROM api_keys
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	keys := make([]models.ApiKey, 0)
	for rows.Next() {
		var k models.ApiKey
		var permsRaw []byte
		if err := rows.Scan(
			&k.ID, &k.WorkspaceID, &k.UserID, &k.Name, &k.KeyPrefix, &k.KeyHash, &permsRaw,
			&k.LastUsedAt, &k.RevokedAt, &k.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(permsRaw, &k.Permissions)
		keys = append(keys, k)
	}
	return keys, nil
}

func (r *DeveloperRepository) RevokeApiKey(ctx context.Context, id, workspaceID uuid.UUID) error {
	now := time.Now().UTC()
	query := `UPDATE api_keys SET revoked_at = $1 WHERE id = $2 AND workspace_id = $3`
	tag, err := r.db.Pool.Exec(ctx, query, now, id, workspaceID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrApiKeyNotFound
	}
	return nil
}

func (r *DeveloperRepository) UpdateApiKeyLastUsed(ctx context.Context, id uuid.UUID) error {
	now := time.Now().UTC()
	query := `UPDATE api_keys SET last_used_at = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, now, id)
	return err
}

// Webhooks

func (r *DeveloperRepository) CreateWebhook(ctx context.Context, wh *models.Webhook) error {
	query := `
		INSERT INTO webhooks (id, workspace_id, target_url, secret, events, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	wh.CreatedAt = time.Now().UTC()
	eventsJSON, _ := json.Marshal(wh.Events)
	_, err := r.db.Pool.Exec(ctx, query, wh.ID, wh.WorkspaceID, wh.TargetURL, wh.Secret, eventsJSON, wh.IsActive, wh.CreatedAt)
	return err
}

func (r *DeveloperRepository) ListWebhooks(ctx context.Context, workspaceID uuid.UUID) ([]models.Webhook, error) {
	query := `
		SELECT id, workspace_id, target_url, secret, events, is_active, created_at
		FROM webhooks
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	hooks := make([]models.Webhook, 0)
	for rows.Next() {
		var wh models.Webhook
		var eventsRaw []byte
		if err := rows.Scan(
			&wh.ID, &wh.WorkspaceID, &wh.TargetURL, &wh.Secret, &eventsRaw, &wh.IsActive, &wh.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(eventsRaw, &wh.Events)
		hooks = append(hooks, wh)
	}
	return hooks, nil
}

func (r *DeveloperRepository) GetWebhook(ctx context.Context, id, workspaceID uuid.UUID) (*models.Webhook, error) {
	query := `
		SELECT id, workspace_id, target_url, secret, events, is_active, created_at
		FROM webhooks
		WHERE id = $1 AND workspace_id = $2
	`
	var wh models.Webhook
	var eventsRaw []byte
	err := r.db.Pool.QueryRow(ctx, query, id, workspaceID).Scan(
		&wh.ID, &wh.WorkspaceID, &wh.TargetURL, &wh.Secret, &eventsRaw, &wh.IsActive, &wh.CreatedAt,
	)
	if err != nil {
		return nil, ErrWebhookNotFound
	}
	_ = json.Unmarshal(eventsRaw, &wh.Events)
	return &wh, nil
}

func (r *DeveloperRepository) DeleteWebhook(ctx context.Context, id, workspaceID uuid.UUID) error {
	query := `DELETE FROM webhooks WHERE id = $1 AND workspace_id = $2`
	tag, err := r.db.Pool.Exec(ctx, query, id, workspaceID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrWebhookNotFound
	}
	return nil
}

func (r *DeveloperRepository) CreateDelivery(ctx context.Context, d *models.WebhookDelivery) error {
	query := `
		INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, status_code, response_body, attempt, success, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	d.CreatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query, d.ID, d.WebhookID, d.EventType, d.Payload, d.StatusCode, d.ResponseBody, d.Attempt, d.Success, d.CreatedAt)
	return err
}

func (r *DeveloperRepository) ListDeliveries(ctx context.Context, webhookID uuid.UUID, limit int) ([]models.WebhookDelivery, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	query := `
		SELECT id, webhook_id, event_type, payload, status_code, response_body, attempt, success, created_at
		FROM webhook_deliveries
		WHERE webhook_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.Pool.Query(ctx, query, webhookID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	deliveries := make([]models.WebhookDelivery, 0)
	for rows.Next() {
		var d models.WebhookDelivery
		if err := rows.Scan(&d.ID, &d.WebhookID, &d.EventType, &d.Payload, &d.StatusCode, &d.ResponseBody, &d.Attempt, &d.Success, &d.CreatedAt); err != nil {
			return nil, err
		}
		deliveries = append(deliveries, d)
	}
	return deliveries, nil
}
