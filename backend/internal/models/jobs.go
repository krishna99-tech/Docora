package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	JobTypeMerge       = "merge"
	JobTypeSplit       = "split"
	JobTypeCompress    = "compress"
	JobTypeExtract     = "extract"
	JobTypeRotate      = "rotate"
	JobTypeReorder     = "reorder"
	JobTypeDeletePages = "delete_pages"
	JobTypeWatermark   = "watermark"
	JobTypePageNumbers = "page_numbers"
	JobTypeImagesToPDF = "images_to_pdf"

	JobStatusPending    = "pending"
	JobStatusProcessing = "processing"
	JobStatusCompleted  = "completed"
	JobStatusFailed     = "failed"
	JobStatusCancelled  = "cancelled"
)

type ProcessingJob struct {
	ID                uuid.UUID       `json:"id"`
	WorkspaceID       uuid.UUID       `json:"workspaceId"`
	UserID            uuid.UUID       `json:"userId"`
	JobType           string          `json:"jobType"`
	Status            string          `json:"status"`
	InputStorageKeys  []string        `json:"inputStorageKeys"`
	OutputStorageKey  string          `json:"outputStorageKey"`
	OutputFilename    string          `json:"outputFilename"`
	OutputFileSize    int64           `json:"outputFileSize"`
	Options           json.RawMessage `json:"options"`
	ErrorMessage      string          `json:"errorMessage,omitempty"`
	CreatedAt         time.Time       `json:"createdAt"`
	UpdatedAt         time.Time       `json:"updatedAt"`
	CompletedAt       *time.Time      `json:"completedAt,omitempty"`
}

type PDFMetadataInfo struct {
	PageCount   int      `json:"pageCount"`
	PDFVersion  string   `json:"pdfVersion"`
	FileSize    int64    `json:"fileSize"`
	PageSizes   []string `json:"pageSizes,omitempty"`
	Title       string   `json:"title,omitempty"`
	Author      string   `json:"author,omitempty"`
	Subject     string   `json:"subject,omitempty"`
	Keywords    string   `json:"keywords,omitempty"`
	Creator     string   `json:"creator,omitempty"`
	IsEncrypted bool     `json:"isEncrypted"`
}
