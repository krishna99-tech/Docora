package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type DocumentVersion struct {
	ID            uuid.UUID       `json:"id"`
	DocumentID    uuid.UUID       `json:"documentId"`
	VersionNumber int             `json:"versionNumber"`
	UserID        uuid.UUID       `json:"userId"`
	UserName      string          `json:"userName,omitempty"`
	ChangeSummary string          `json:"changeSummary"`
	SnapshotData  json.RawMessage `json:"snapshotData"`
	StorageKey    string          `json:"storageKey"`
	CreatedAt     time.Time       `json:"createdAt"`
}

type CreateVersionSnapshotRequest struct {
	ChangeSummary string `json:"changeSummary" binding:"required"`
}
