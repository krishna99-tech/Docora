package models

import (
	"time"

	"github.com/google/uuid"
)

type SharingLink struct {
	ID            uuid.UUID  `json:"id"`
	DocumentID    uuid.UUID  `json:"documentId"`
	WorkspaceID   uuid.UUID  `json:"workspaceId"`
	CreatedBy     uuid.UUID  `json:"createdBy"`
	TokenHash     string     `json:"-"`
	RawToken      string     `json:"rawToken,omitempty"` // Only populated upon link creation
	HasPassword   bool       `json:"hasPassword"`
	PasswordHash  string     `json:"-"`
	ExpiresAt     *time.Time `json:"expiresAt"`
	MaxAccesses   int        `json:"maxAccesses"`
	AccessCount   int        `json:"accessCount"`
	AllowDownload bool       `json:"allowDownload"`
	IsRevoked     bool       `json:"isRevoked"`
	WatermarkText string     `json:"watermarkText"`
	CreatedAt     time.Time  `json:"createdAt"`
	DocumentTitle string     `json:"documentTitle,omitempty"`
	DocumentType  string     `json:"documentType,omitempty"`
}

type CreateSharingLinkRequest struct {
	ExpiresInHours *int   `json:"expiresInHours"` // e.g. 24, 72, 168 (7 days)
	Password       string `json:"password,omitempty"`
	MaxAccesses    int    `json:"maxAccesses,omitempty"`
	AllowDownload  bool   `json:"allowDownload"`
	WatermarkText  string `json:"watermarkText,omitempty"`
}

type PublicSharedDocInfo struct {
	ID            uuid.UUID  `json:"id"`
	Title         string     `json:"title"`
	DocumentNumber string    `json:"documentNumber"`
	DocumentType  string     `json:"documentType"`
	IssueDate     time.Time  `json:"issueDate"`
	AllowDownload bool       `json:"allowDownload"`
	WatermarkText string     `json:"watermarkText"`
	RequiresPassword bool    `json:"requiresPassword"`
	ExpiresAt     *time.Time `json:"expiresAt,omitempty"`
}

type VerifySharePasswordRequest struct {
	Password string `json:"password" binding:"required"`
}
