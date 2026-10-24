package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

var (
	ErrCannotRestoreToFinalized = errors.New("cannot restore into a finalized document")
)

type VersionService struct {
	versionRepo *repositories.VersionRepository
	docRepo     *repositories.DocumentRepository
}

func NewVersionService(vr *repositories.VersionRepository, dr *repositories.DocumentRepository) *VersionService {
	return &VersionService{
		versionRepo: vr,
		docRepo:     dr,
	}
}

// SnapshotDocument saves an immutable version snapshot of the current document state
func (s *VersionService) SnapshotDocument(ctx context.Context, userID, docID uuid.UUID, changeSummary string) (*models.DocumentVersion, error) {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	snapshotJSON, err := json.Marshal(doc)
	if err != nil {
		return nil, fmt.Errorf("failed serializing document snapshot: %w", err)
	}

	if changeSummary == "" {
		changeSummary = "Manual revision snapshot"
	}

	version := &models.DocumentVersion{
		ID:            uuid.New(),
		DocumentID:    docID,
		UserID:        userID,
		ChangeSummary: changeSummary,
		SnapshotData:  snapshotJSON,
		StorageKey:    doc.StorageKey,
	}

	if err := s.versionRepo.CreateVersion(ctx, version); err != nil {
		return nil, err
	}

	return version, nil
}

// ListVersions returns all history snapshots for a document
func (s *VersionService) ListVersions(ctx context.Context, userID, docID uuid.UUID) ([]models.DocumentVersion, error) {
	// Verify doc access
	_, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}
	return s.versionRepo.ListByDocumentID(ctx, docID)
}

// RestoreDraft restores document fields from a prior version snapshot
func (s *VersionService) RestoreDraft(ctx context.Context, userID, docID uuid.UUID, versionNumber int) (*models.Document, error) {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	if doc.Status == models.StatusFinalized || doc.Status == models.StatusPaid || doc.Status == models.StatusIssued {
		return nil, ErrCannotRestoreToFinalized
	}

	v, err := s.versionRepo.GetByNumber(ctx, docID, versionNumber)
	if err != nil {
		return nil, err
	}

	var snap models.Document
	if err := json.Unmarshal(v.SnapshotData, &snap); err != nil {
		return nil, fmt.Errorf("failed reading version snapshot data: %w", err)
	}

	// Restore editable attributes onto doc
	doc.Title = snap.Title
	doc.Notes = snap.Notes
	doc.Terms = snap.Terms
	doc.PaymentMethod = snap.PaymentMethod
	doc.PaymentReference = snap.PaymentReference
	doc.DueDate = snap.DueDate
	doc.TemplateVersionID = snap.TemplateVersionID
	doc.Items = snap.Items
	doc.SubtotalMinor = snap.SubtotalMinor
	doc.DiscountMinor = snap.DiscountMinor
	doc.TaxMinor = snap.TaxMinor
	doc.TotalMinor = snap.TotalMinor
	doc.AmountPaidMinor = snap.AmountPaidMinor
	doc.BalanceMinor = snap.BalanceMinor

	if err := s.docRepo.Update(ctx, doc); err != nil {
		return nil, err
	}

	// Create snapshot of the restored state
	_, _ = s.SnapshotDocument(ctx, userID, docID, fmt.Sprintf("Restored from version %d", versionNumber))

	return s.docRepo.GetByID(ctx, userID, docID)
}
