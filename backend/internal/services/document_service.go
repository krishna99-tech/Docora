package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/pdf"
	"docora/backend/internal/repositories"
	"docora/backend/internal/storage"
)

var (
	ErrUnauthorizedDocumentAccess = errors.New("unauthorized access to document")
	ErrCannotFinalize             = errors.New("document is already finalized or cannot be finalized")
	ErrCannotCancel               = errors.New("document cannot be cancelled in its current state")
)

type DocumentService struct {
	docRepo      *repositories.DocumentRepository
	customerRepo *repositories.CustomerRepository
	businessRepo *repositories.BusinessRepository
	templateRepo *repositories.TemplateRepository
	auditRepo    *repositories.AuditRepository
	storage      storage.Storage
	pdfRenderer  pdf.Renderer
}

func NewDocumentService(
	docRepo *repositories.DocumentRepository,
	customerRepo *repositories.CustomerRepository,
	businessRepo *repositories.BusinessRepository,
	templateRepo *repositories.TemplateRepository,
	auditRepo *repositories.AuditRepository,
	storage storage.Storage,
	pdfRenderer pdf.Renderer,
) *DocumentService {
	return &DocumentService{
		docRepo:      docRepo,
		customerRepo: customerRepo,
		businessRepo: businessRepo,
		templateRepo: templateRepo,
		auditRepo:    auditRepo,
		storage:      storage,
		pdfRenderer:  pdfRenderer,
	}
}

// CalculateDocumentTotals computes integer minor totals authoritatively
func CalculateDocumentTotals(items []models.ItemInput, amountPaidMinor int64) ([]models.DocumentItem, int64, int64, int64, int64, int64) {
	var subtotalMinor int64 = 0
	var totalDiscountMinor int64 = 0
	var totalTaxMinor int64 = 0

	calcItems := make([]models.DocumentItem, len(items))

	for i, in := range items {
		// Gross line value: quantity * unitPriceMinor
		gross := int64(math.Round(float64(in.UnitPriceMinor) * in.Quantity))
		discount := in.DiscountMinor
		if discount > gross {
			discount = gross
		}

		taxable := gross - discount
		var tax int64 = 0
		if in.TaxRate > 0 {
			tax = int64(math.Round(float64(taxable) * in.TaxRate))
		}
		lineTotal := taxable + tax

		subtotalMinor += gross
		totalDiscountMinor += discount
		totalTaxMinor += tax

		calcItems[i] = models.DocumentItem{
			Description:    in.Description,
			Quantity:       in.Quantity,
			UnitPriceMinor: in.UnitPriceMinor,
			DiscountMinor:  discount,
			TaxRate:        in.TaxRate,
			TaxMinor:       tax,
			LineTotalMinor: lineTotal,
			SortOrder:      i,
		}
	}

	totalMinor := subtotalMinor - totalDiscountMinor + totalTaxMinor
	if totalMinor < 0 {
		totalMinor = 0
	}

	balanceMinor := totalMinor - amountPaidMinor
	if balanceMinor < 0 {
		balanceMinor = 0
	}

	return calcItems, subtotalMinor, totalDiscountMinor, totalTaxMinor, totalMinor, balanceMinor
}

func (s *DocumentService) CreateReceipt(ctx context.Context, userID uuid.UUID, req models.CreateReceiptRequest) (*models.Document, error) {
	calcItems, subtotal, discount, tax, total, balance := CalculateDocumentTotals(req.Items, req.AmountPaidMinor)

	currency := req.Currency
	if currency == "" {
		biz, _ := s.businessRepo.GetByUserID(ctx, userID)
		if biz != nil && biz.Currency != "" {
			currency = biz.Currency
		} else {
			currency = "USD"
		}
	}

	title := req.Title
	if title == "" {
		title = "Payment Receipt"
	}

	issueDate := time.Now().UTC()
	if req.IssueDate != nil && !req.IssueDate.IsZero() {
		issueDate = *req.IssueDate
	}

	doc := &models.Document{
		ID:                uuid.New(),
		UserID:            userID,
		CustomerID:        req.CustomerID,
		DocumentNumber:    req.DocumentNumber,
		DocumentType:      models.TypeReceipt,
		Title:             title,
		Status:            models.StatusDraft,
		Currency:          currency,
		SubtotalMinor:     subtotal,
		DiscountMinor:     discount,
		TaxMinor:          tax,
		TotalMinor:        total,
		AmountPaidMinor:   req.AmountPaidMinor,
		BalanceMinor:      balance,
		IssueDate:         issueDate,
		PaymentMethod:     req.PaymentMethod,
		PaymentReference:  req.PaymentReference,
		Notes:             req.Notes,
		Terms:             req.Terms,
		TemplateVersionID: req.TemplateVersionID,
		Items:             calcItems,
	}

	if err := s.docRepo.Create(ctx, doc); err != nil {
		return nil, err
	}

	return s.docRepo.GetByID(ctx, userID, doc.ID)
}

func (s *DocumentService) CreateInvoice(ctx context.Context, userID uuid.UUID, req models.CreateInvoiceRequest) (*models.Document, error) {
	calcItems, subtotal, discount, tax, total, balance := CalculateDocumentTotals(req.Items, req.AmountPaidMinor)

	currency := req.Currency
	if currency == "" {
		biz, _ := s.businessRepo.GetByUserID(ctx, userID)
		if biz != nil && biz.Currency != "" {
			currency = biz.Currency
		} else {
			currency = "USD"
		}
	}

	title := req.Title
	if title == "" {
		title = "Commercial Invoice"
	}

	issueDate := time.Now().UTC()
	if req.IssueDate != nil && !req.IssueDate.IsZero() {
		issueDate = *req.IssueDate
	}

	doc := &models.Document{
		ID:                uuid.New(),
		UserID:            userID,
		CustomerID:        req.CustomerID,
		DocumentNumber:    req.DocumentNumber,
		DocumentType:      models.TypeInvoice,
		Title:             title,
		Status:            models.StatusDraft,
		Currency:          currency,
		SubtotalMinor:     subtotal,
		DiscountMinor:     discount,
		TaxMinor:          tax,
		TotalMinor:        total,
		AmountPaidMinor:   req.AmountPaidMinor,
		BalanceMinor:      balance,
		IssueDate:         issueDate,
		DueDate:           req.DueDate,
		PaymentMethod:     req.PaymentMethod,
		PaymentReference:  req.PaymentReference,
		Notes:             req.Notes,
		Terms:             req.Terms,
		TemplateVersionID: req.TemplateVersionID,
		Items:             calcItems,
	}

	if err := s.docRepo.Create(ctx, doc); err != nil {
		return nil, err
	}

	return s.docRepo.GetByID(ctx, userID, doc.ID)
}

func (s *DocumentService) CreateGeneralPDF(ctx context.Context, userID uuid.UUID, req models.CreateGeneralPDFRequest) (*models.Document, error) {
	metaMap := map[string]interface{}{
		"pageSize":           req.PageSize,
		"orientation":        req.Orientation,
		"margin":             req.Margin,
		"includeHeader":      req.IncludeHeader,
		"includeFooter":      req.IncludeFooter,
		"includePageNumbers": req.IncludePageNumbers,
		"sections":           req.Sections,
		"subtitle":           req.Subtitle,
	}
	metaBytes, _ := json.Marshal(metaMap)

	doc := &models.Document{
		ID:                uuid.New(),
		UserID:            userID,
		CustomerID:        req.CustomerID,
		DocumentType:      models.TypeGeneral,
		Title:             req.Title,
		Status:            models.StatusDraft,
		Currency:          "USD",
		IssueDate:         time.Now().UTC(),
		Notes:             req.Notes,
		TemplateVersionID: req.TemplateVersionID,
		Metadata:          metaBytes,
	}

	if err := s.docRepo.Create(ctx, doc); err != nil {
		return nil, err
	}

	return s.docRepo.GetByID(ctx, userID, doc.ID)
}

func (s *DocumentService) GetByID(ctx context.Context, userID, docID uuid.UUID) (*models.Document, error) {
	return s.docRepo.GetByID(ctx, userID, docID)
}

func (s *DocumentService) List(ctx context.Context, userID uuid.UUID, filter models.DocumentListFilter) (*models.PaginatedResponse[models.Document], error) {
	docs, total, err := s.docRepo.List(ctx, userID, filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.PageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &models.PaginatedResponse[models.Document]{
		Data:       docs,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GeneratePreview builds a live PDF in memory without modifying persistent state
func (s *DocumentService) GeneratePreview(ctx context.Context, userID, docID uuid.UUID) ([]byte, error) {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	biz, _ := s.businessRepo.GetByUserID(ctx, userID)
	var tmpl *models.Template
	if doc.TemplateVersionID != nil {
		tmpl, _ = s.templateRepo.GetByID(ctx, userID, *doc.TemplateVersionID)
	}

	var sections []models.GeneralPDFSection
	if len(doc.Metadata) > 0 {
		var meta struct {
			Sections []models.GeneralPDFSection `json:"sections"`
		}
		_ = json.Unmarshal(doc.Metadata, &meta)
		sections = meta.Sections
	}

	renderData := &pdf.RenderData{
		Document:        doc,
		BusinessProfile: biz,
		Customer:        doc.Customer,
		Template:        tmpl,
		PageSize:        "A4",
		Orientation:     "portrait",
		Margin:          "normal",
		Sections:        sections,
	}

	return s.pdfRenderer.Render(ctx, renderData)
}

// Finalize renders final PDF, saves to persistent storage, updates doc status and stores metadata
func (s *DocumentService) Finalize(ctx context.Context, userID, docID uuid.UUID) (*models.Document, error) {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	if doc.Status == models.StatusFinalized || doc.Status == models.StatusIssued || doc.Status == models.StatusPaid {
		return doc, nil // Already finalized
	}

	if doc.Status == models.StatusCancelled {
		return nil, ErrCannotFinalize
	}

	// Render PDF
	pdfBytes, err := s.GeneratePreview(ctx, userID, docID)
	if err != nil {
		return nil, fmt.Errorf("failed rendering PDF: %w", err)
	}

	// Persistent storage key: user_id/type/document_number.pdf
	storageKey := fmt.Sprintf("%s/%s/%s.pdf", userID.String(), doc.DocumentType, doc.DocumentNumber)
	filename := fmt.Sprintf("%s-%s.pdf", doc.DocumentType, doc.DocumentNumber)

	fileInfo, err := s.storage.Save(ctx, storageKey, bytes.NewReader(pdfBytes))
	if err != nil {
		return nil, fmt.Errorf("failed saving PDF to storage: %w", err)
	}

	// New status: receipts become "finalized", invoices become "issued"
	newStatus := models.StatusFinalized
	if doc.DocumentType == models.TypeInvoice {
		if doc.BalanceMinor == 0 && doc.AmountPaidMinor > 0 {
			newStatus = models.StatusPaid
		} else if doc.AmountPaidMinor > 0 {
			newStatus = models.StatusPartiallyPaid
		} else {
			newStatus = models.StatusIssued
		}
	}

	prevStatus := doc.Status
	if err := s.docRepo.UpdateStatus(ctx, userID, docID, newStatus); err != nil {
		return nil, err
	}

	if err := s.docRepo.UpdateStorage(ctx, userID, docID, storageKey, filename, fileInfo.Size, fileInfo.SHA256); err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, docID, userID, "finalized", &prevStatus, &newStatus, map[string]interface{}{
		"storageKey": storageKey,
		"fileSize":   fileInfo.Size,
		"sha256":     fileInfo.SHA256,
	})

	return s.docRepo.GetByID(ctx, userID, docID)
}

// Cancel sets document to cancelled
func (s *DocumentService) Cancel(ctx context.Context, userID, docID uuid.UUID) error {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return err
	}

	if doc.Status == models.StatusCancelled {
		return nil
	}

	prevStatus := doc.Status
	newStatus := models.StatusCancelled
	if err := s.docRepo.UpdateStatus(ctx, userID, docID, newStatus); err != nil {
		return err
	}

	_ = s.auditRepo.Log(ctx, docID, userID, "cancelled", &prevStatus, &newStatus, map[string]string{
		"event": "document_cancelled",
	})
	return nil
}

// DeleteDraft deletes a draft document
func (s *DocumentService) DeleteDraft(ctx context.Context, userID, docID uuid.UUID) error {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return err
	}

	if doc.StorageKey != "" {
		_ = s.storage.Delete(ctx, doc.StorageKey)
	}

	return s.docRepo.DeleteDraft(ctx, userID, docID)
}

// OpenDownloadStream returns reader and metadata for authorized download
func (s *DocumentService) OpenDownloadStream(ctx context.Context, userID, docID uuid.UUID) (io.ReadCloser, string, int64, error) {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, "", 0, err
	}

	if doc.StorageKey == "" {
		// Finalize on the fly if not finalized yet
		doc, err = s.Finalize(ctx, userID, docID)
		if err != nil {
			return nil, "", 0, err
		}
	}

	reader, err := s.storage.Open(ctx, doc.StorageKey)
	if err != nil {
		return nil, "", 0, err
	}

	return reader, doc.Filename, doc.FileSize, nil
}
