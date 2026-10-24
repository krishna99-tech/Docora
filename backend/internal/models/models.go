package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	TypeReceipt   = "receipt"
	TypeInvoice   = "invoice"
	TypeQuotation = "quotation"
	TypeEstimate  = "estimate"
	TypeStatement = "statement"
	TypeGeneral   = "general"

	StatusDraft         = "draft"
	StatusFinalized     = "finalized"
	StatusIssued        = "issued"
	StatusPartiallyPaid = "partially_paid"
	StatusPaid          = "paid"
	StatusOverdue       = "overdue"
	StatusCancelled     = "cancelled"
)

// User represents a system user
type User struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// RefreshToken stores hashed refresh tokens for session revocation
type RefreshToken struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"userId"`
	TokenHash string     `json:"-"`
	ExpiresAt time.Time  `json:"expiresAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

// BusinessProfile stores the user's business metadata for document headers
type BusinessProfile struct {
	ID                    uuid.UUID `json:"id"`
	UserID                uuid.UUID `json:"userId"`
	BusinessName          string    `json:"businessName"`
	Address               string    `json:"address"`
	Phone                 string    `json:"phone"`
	Email                 string    `json:"email"`
	TaxRegistrationNumber string    `json:"taxRegistrationNumber"`
	LogoStorageKey        string    `json:"logoStorageKey"`
	Currency              string    `json:"currency"`
	DateFormat            string    `json:"dateFormat"`
	NumberFormat          string    `json:"numberFormat"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// Customer stores recipient information
type Customer struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Template represents a document layout template
type Template struct {
	ID              uuid.UUID       `json:"id"`
	UserID          *uuid.UUID      `json:"userId,omitempty"`
	Name            string          `json:"name"`
	DocumentType    string          `json:"documentType"`
	Description     string          `json:"description"`
	TemplateContent json.RawMessage `json:"templateContent"`
	Version         int             `json:"version"`
	IsDefault       bool            `json:"isDefault"`
	IsActive        bool            `json:"isActive"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}

// DocumentItem represents a line item in a receipt or invoice
type DocumentItem struct {
	ID             uuid.UUID `json:"id"`
	DocumentID     uuid.UUID `json:"documentId"`
	Description    string    `json:"description"`
	Quantity       float64   `json:"quantity"`
	UnitPriceMinor int64     `json:"unitPriceMinor"` // stored in cents/minor units
	DiscountMinor  int64     `json:"discountMinor"`
	TaxRate        float64   `json:"taxRate"`        // e.g. 0.05 for 5%
	TaxMinor       int64     `json:"taxMinor"`
	LineTotalMinor int64     `json:"lineTotalMinor"`
	SortOrder      int       `json:"sortOrder"`
}

// Document represents an invoice, receipt, quotation, estimate, statement, or general document
type Document struct {
	ID                uuid.UUID       `json:"id"`
	UserID            uuid.UUID       `json:"userId"`
	WorkspaceID       *uuid.UUID      `json:"workspaceId,omitempty"`
	CustomerID        *uuid.UUID      `json:"customerId,omitempty"`
	Customer          *Customer       `json:"customer,omitempty"`
	DocumentNumber    string          `json:"documentNumber"`
	DocumentType      string          `json:"documentType"` // 'receipt', 'invoice', 'quotation', 'estimate', 'statement', 'general'
	Title             string          `json:"title"`
	Status            string          `json:"status"` // 'draft', 'finalized', etc.
	Currency          string          `json:"currency"`
	SubtotalMinor     int64           `json:"subtotalMinor"`
	DiscountMinor     int64           `json:"discountMinor"`
	TaxMinor          int64           `json:"taxMinor"`
	TotalMinor        int64           `json:"totalMinor"`
	AmountPaidMinor   int64           `json:"amountPaidMinor"`
	BalanceMinor      int64           `json:"balanceMinor"`
	IssueDate         time.Time       `json:"issueDate"`
	DueDate           *time.Time      `json:"dueDate,omitempty"`
	PaymentMethod     string          `json:"paymentMethod"`
	PaymentReference  string          `json:"paymentReference"`
	Notes             string          `json:"notes"`
	Terms             string          `json:"terms"`
	TemplateVersionID *uuid.UUID      `json:"templateVersionId,omitempty"`
	Template          *Template       `json:"template,omitempty"`
	StorageKey        string          `json:"storageKey"`
	Filename          string          `json:"filename"`
	MimeType          string          `json:"mimeType"`
	FileSize          int64           `json:"fileSize"`
	SHA256            string          `json:"sha256"`
	Metadata          json.RawMessage `json:"metadata"` // For general PDF layout/sections or type-specific metadata
	Items             []DocumentItem  `json:"items,omitempty"`
	IsArchived        bool            `json:"isArchived"`
	IsFavorite        bool            `json:"isFavorite"`
	DeletedAt         *time.Time      `json:"deletedAt,omitempty"`
	Tags              []string        `json:"tags,omitempty"`
	Category          string          `json:"category,omitempty"`
	CreatedAt         time.Time       `json:"createdAt"`
	UpdatedAt         time.Time       `json:"updatedAt"`
	FinalizedAt       *time.Time      `json:"finalizedAt,omitempty"`
}

// DocumentAuditLog tracks status changes and user operations
type DocumentAuditLog struct {
	ID             uuid.UUID       `json:"id"`
	DocumentID     uuid.UUID       `json:"documentId"`
	UserID         uuid.UUID       `json:"userId"`
	Action         string          `json:"action"`
	PreviousStatus *string         `json:"previousStatus,omitempty"`
	NewStatus      *string         `json:"newStatus,omitempty"`
	Metadata       json.RawMessage `json:"metadata"`
	CreatedAt      time.Time       `json:"createdAt"`
}

// Request and Response DTOs

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type AuthResponse struct {
	User         *User  `json:"user"`
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
}

type ItemInput struct {
	Description    string  `json:"description" binding:"required"`
	Quantity       float64 `json:"quantity" binding:"required,gt=0"`
	UnitPriceMinor int64   `json:"unitPriceMinor" binding:"gte=0"`
	DiscountMinor  int64   `json:"discountMinor" binding:"gte=0"`
	TaxRate        float64 `json:"taxRate" binding:"gte=0"`
}

type CreateReceiptRequest struct {
	CustomerID        *uuid.UUID  `json:"customerId"`
	DocumentNumber    string      `json:"documentNumber"` // Optional, auto-generated if empty
	Title             string      `json:"title"`
	Currency          string      `json:"currency"`
	IssueDate         *time.Time  `json:"issueDate"`
	PaymentMethod     string      `json:"paymentMethod"`
	PaymentReference  string      `json:"paymentReference"`
	AmountPaidMinor   int64       `json:"amountPaidMinor" binding:"gte=0"`
	Notes             string      `json:"notes"`
	Terms             string      `json:"terms"`
	TemplateVersionID *uuid.UUID  `json:"templateVersionId"`
	Items             []ItemInput `json:"items" binding:"required,min=1"`
}

type CreateInvoiceRequest struct {
	CustomerID        *uuid.UUID  `json:"customerId"`
	DocumentNumber    string      `json:"documentNumber"` // Optional, auto-generated if empty
	Title             string      `json:"title"`
	Currency          string      `json:"currency"`
	IssueDate         *time.Time  `json:"issueDate"`
	DueDate           *time.Time  `json:"dueDate"`
	PaymentMethod     string      `json:"paymentMethod"`
	PaymentReference  string      `json:"paymentReference"`
	AmountPaidMinor   int64       `json:"amountPaidMinor" binding:"gte=0"`
	Notes             string      `json:"notes"`
	Terms             string      `json:"terms"`
	TemplateVersionID *uuid.UUID  `json:"templateVersionId"`
	Items             []ItemInput `json:"items" binding:"required,min=1"`
}

type CreateQuotationRequest struct {
	CustomerID        *uuid.UUID  `json:"customerId"`
	DocumentNumber    string      `json:"documentNumber"` // Optional, auto-generated if empty
	Title             string      `json:"title"`
	Currency          string      `json:"currency"`
	IssueDate         *time.Time  `json:"issueDate"`
	DueDate           *time.Time  `json:"validUntil"` // Validity date for quotation
	Notes             string      `json:"notes"`
	Terms             string      `json:"terms"`
	TemplateVersionID *uuid.UUID  `json:"templateVersionId"`
	Items             []ItemInput `json:"items" binding:"required,min=1"`
}

type CreateEstimateRequest struct {
	CustomerID        *uuid.UUID  `json:"customerId"`
	DocumentNumber    string      `json:"documentNumber"` // Optional, auto-generated if empty
	Title             string      `json:"title"`
	Currency          string      `json:"currency"`
	IssueDate         *time.Time  `json:"issueDate"`
	DueDate           *time.Time  `json:"estimatedCompletion"`
	Notes             string      `json:"notes"`
	Terms             string      `json:"terms"`
	TemplateVersionID *uuid.UUID  `json:"templateVersionId"`
	Items             []ItemInput `json:"items" binding:"required,min=1"`
}

type UpdateDocumentMetaRequest struct {
	IsArchived *bool    `json:"isArchived,omitempty"`
	IsFavorite *bool    `json:"isFavorite,omitempty"`
	Tags       []string `json:"tags,omitempty"`
	Category   *string  `json:"category,omitempty"`
}

type GeneralPDFSection struct {
	Type    string          `json:"type"` // heading, paragraph, table, key_value, spacer, divider
	Title   string          `json:"title,omitempty"`
	Content string          `json:"content,omitempty"`
	Headers []string        `json:"headers,omitempty"`
	Rows    [][]string      `json:"rows,omitempty"`
	Pairs   []KeyValuePair  `json:"pairs,omitempty"`
}

type KeyValuePair struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type CreateGeneralPDFRequest struct {
	Title             string              `json:"title" binding:"required"`
	Subtitle          string              `json:"subtitle"`
	PageSize          string              `json:"pageSize"` // A4, A5, Letter
	Orientation       string              `json:"orientation"` // portrait, landscape
	Margin            string              `json:"margin"` // normal, compact, wide
	IncludeHeader     bool                `json:"includeHeader"`
	IncludeFooter     bool                `json:"includeFooter"`
	IncludePageNumbers bool               `json:"includePageNumbers"`
	CustomerID        *uuid.UUID          `json:"customerId"`
	TemplateVersionID *uuid.UUID          `json:"templateVersionId"`
	Sections          []GeneralPDFSection `json:"sections" binding:"required,min=1"`
	Notes             string              `json:"notes"`
}

type UpdateCustomerRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}

type UpdateBusinessProfileRequest struct {
	BusinessName          string `json:"businessName" binding:"required"`
	Address               string `json:"address"`
	Phone                 string `json:"phone"`
	Email                 string `json:"email"`
	TaxRegistrationNumber string `json:"taxRegistrationNumber"`
	Currency              string `json:"currency"`
	DateFormat            string `json:"dateFormat"`
	NumberFormat          string `json:"numberFormat"`
}

type CreateTemplateRequest struct {
	Name            string          `json:"name" binding:"required"`
	DocumentType    string          `json:"documentType" binding:"required,oneof=receipt invoice general"`
	Description     string          `json:"description"`
	TemplateContent json.RawMessage `json:"templateContent" binding:"required"`
	IsDefault       bool            `json:"isDefault"`
}

type DashboardStats struct {
	TotalDocuments        int64 `json:"totalDocuments"`
	ReceiptsGenerated     int64 `json:"receiptsGenerated"`
	InvoicesGenerated     int64 `json:"invoicesGenerated"`
	GeneralPDFsGenerated  int64 `json:"generalPdfsGenerated"`
	DocumentsThisMonth    int64 `json:"documentsThisMonth"`
	TotalReceiptRevenue   int64 `json:"totalReceiptRevenueMinor"`
	TotalInvoicePending   int64 `json:"totalInvoicePendingMinor"`
}

type DocumentListFilter struct {
	Type       string     `form:"type"`
	Status     string     `form:"status"`
	Search     string     `form:"search"`
	CustomerID *uuid.UUID `form:"customerId"`
	StartDate  *time.Time `form:"startDate"`
	EndDate    *time.Time `form:"endDate"`
	Page       int        `form:"page,default=1"`
	PageSize   int        `form:"pageSize,default=20"`
	SortBy     string     `form:"sortBy,default=created_at"`
	SortOrder  string     `form:"sortOrder,default=desc"`
}

type PaginatedResponse[T any] struct {
	Data       []T   `json:"data"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalPages int   `json:"totalPages"`
}
