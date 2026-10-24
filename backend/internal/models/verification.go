package models

import (
	"time"

	"github.com/google/uuid"
)

type VerificationRecord struct {
	ID                uuid.UUID `json:"id"`
	DocumentID        uuid.UUID `json:"documentId"`
	VerificationToken string    `json:"verificationToken"`
	SHA256Hash        string    `json:"sha256Hash"`
	QRPayload         string    `json:"qrPayload"`
	IsRevoked         bool      `json:"isRevoked"`
	CreatedAt         time.Time `json:"createdAt"`
}

// PublicVerificationInfo displays only approved, non-sensitive information for public verification
type PublicVerificationInfo struct {
	VerificationToken string    `json:"verificationToken"`
	DocumentNumber    string    `json:"documentNumber"`
	DocumentType      string    `json:"documentType"`
	IssueDate         time.Time `json:"issueDate"`
	IssuingBusiness   string    `json:"issuingBusiness"`
	Status            string    `json:"status"` // 'verified', 'cancelled', 'amended', 'revoked'
	SHA256Hash        string    `json:"sha256Hash"`
	VerifiedAt        time.Time `json:"verifiedAt"`
	IntegrityValid    bool      `json:"integrityValid"`
}

type IntegrityCheckResult struct {
	DocumentID        uuid.UUID `json:"documentId"`
	DocumentNumber    string    `json:"documentNumber"`
	ExpectedHash      string    `json:"expectedHash"`
	ActualHash        string    `json:"actualHash"`
	Matches           bool      `json:"matches"`
	FileSizeBytes     int64     `json:"fileSizeBytes"`
	StorageKey        string    `json:"storageKey"`
	CheckedAt         time.Time `json:"checkedAt"`
}
