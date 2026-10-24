package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ApiKey struct {
	ID          uuid.UUID  `json:"id"`
	WorkspaceID uuid.UUID  `json:"workspaceId"`
	UserID      uuid.UUID  `json:"userId"`
	Name        string     `json:"name"`
	KeyPrefix   string     `json:"keyPrefix"`
	KeyHash     string     `json:"-"`
	RawKey      string     `json:"rawKey,omitempty"` // Only returned once on creation
	Permissions []string   `json:"permissions"`
	LastUsedAt  *time.Time `json:"lastUsedAt,omitempty"`
	RevokedAt   *time.Time `json:"revokedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

type CreateApiKeyRequest struct {
	Name        string   `json:"name" binding:"required,min=2,max=100"`
	Permissions []string `json:"permissions"`
}

type Webhook struct {
	ID          uuid.UUID       `json:"id"`
	WorkspaceID uuid.UUID       `json:"workspaceId"`
	TargetURL   string          `json:"targetUrl"`
	Secret      string          `json:"-"`
	Events      []string        `json:"events"`
	IsActive    bool            `json:"isActive"`
	CreatedAt   time.Time       `json:"createdAt"`
}

type CreateWebhookRequest struct {
	TargetURL string   `json:"targetUrl" binding:"required,url"`
	Events    []string `json:"events" binding:"required,min=1"`
	Secret    string   `json:"secret"`
}

type WebhookDelivery struct {
	ID           uuid.UUID       `json:"id"`
	WebhookID    uuid.UUID       `json:"webhookId"`
	EventType    string          `json:"eventType"`
	Payload      json.RawMessage `json:"payload"`
	StatusCode   int             `json:"statusCode"`
	ResponseBody string          `json:"responseBody"`
	Attempt      int             `json:"attempt"`
	Success      bool            `json:"success"`
	CreatedAt    time.Time       `json:"createdAt"`
}
