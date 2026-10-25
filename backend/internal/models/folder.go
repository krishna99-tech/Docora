package models

import (
	"time"

	"github.com/google/uuid"
)

type DocumentFolder struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	WorkspaceID   uuid.UUID  `json:"workspaceId" db:"workspace_id"`
	ParentID      *uuid.UUID `json:"parentId,omitempty" db:"parent_id"`
	Name          string     `json:"name" db:"name"`
	Color         string     `json:"color" db:"color"`
	DocumentCount int        `json:"documentCount"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time  `json:"updatedAt" db:"updated_at"`
}

type CreateFolderRequest struct {
	Name     string     `json:"name" binding:"required"`
	ParentID *uuid.UUID `json:"parentId,omitempty"`
	Color    string     `json:"color,omitempty"`
}

type UpdateFolderRequest struct {
	Name     string     `json:"name,omitempty"`
	ParentID *uuid.UUID `json:"parentId,omitempty"`
	Color    string     `json:"color,omitempty"`
}

type MoveDocumentsRequest struct {
	DocumentIDs []uuid.UUID `json:"documentIds" binding:"required"`
	FolderID    *uuid.UUID  `json:"folderId"` // nil moves to root
}

type TagDocumentsRequest struct {
	DocumentIDs []uuid.UUID `json:"documentIds" binding:"required"`
	Tags        []string    `json:"tags" binding:"required"`
}

type ArchiveDocumentsRequest struct {
	DocumentIDs []uuid.UUID `json:"documentIds" binding:"required"`
	Archive     bool        `json:"archive"`
}

type ComplianceSettingsRequest struct {
	ComplianceStandard string `json:"complianceStandard"` // standard, pdf_a_1b, pdf_a_2b
	RetentionDays      int    `json:"retentionDays"`
}
