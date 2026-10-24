package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
	"docora/backend/internal/storage"
	"docora/backend/internal/verification"
)

type VerificationService struct {
	verificationRepo *repositories.VerificationRepository
	docRepo          *repositories.DocumentRepository
	businessRepo     *repositories.BusinessRepository
	storage          storage.Storage
	verifier         *verification.Verifier
}

func NewVerificationService(
	vr *repositories.VerificationRepository,
	dr *repositories.DocumentRepository,
	br *repositories.BusinessRepository,
	st storage.Storage,
	v *verification.Verifier,
) *VerificationService {
	return &VerificationService{
		verificationRepo: vr,
		docRepo:          dr,
		businessRepo:     br,
		storage:          st,
		verifier:         v,
	}
}

// EnsureVerificationRecord creates or returns the verification record for a finalized document
func (s *VerificationService) EnsureVerificationRecord(ctx context.Context, doc *models.Document) (*models.VerificationRecord, error) {
	existing, err := s.verificationRepo.GetByDocumentID(ctx, doc.ID)
	if err == nil && existing != nil {
		return existing, nil
	}

	token, err := s.verifier.GenerateVerificationToken()
	if err != nil {
		return nil, fmt.Errorf("failed generating verification token: %w", err)
	}

	_, qrPayload, err := s.verifier.GenerateQRCodePNG(token)
	if err != nil {
		return nil, fmt.Errorf("failed generating QR payload: %w", err)
	}

	record := &models.VerificationRecord{
		ID:                uuid.New(),
		DocumentID:        doc.ID,
		VerificationToken: token,
		SHA256Hash:        doc.SHA256,
		QRPayload:         qrPayload,
		IsRevoked:         false,
	}

	if err := s.verificationRepo.UpsertRecord(ctx, record); err != nil {
		return nil, err
	}
	return record, nil
}

// GetPublicVerification returns safe, approved, non-sensitive metadata for public verification
func (s *VerificationService) GetPublicVerification(ctx context.Context, token string) (*models.PublicVerificationInfo, error) {
	vr, doc, bp, err := s.verificationRepo.GetByToken(ctx, token)
	if err != nil {
		return nil, err
	}

	businessName := "Docora Verified Issuer"
	if bp != nil && bp.BusinessName != "" {
		businessName = bp.BusinessName
	}

	status := "verified"
	if vr.IsRevoked {
		status = "revoked"
	} else if doc.Status == models.StatusCancelled {
		status = "cancelled"
	}

	// Verify byte integrity against stored PDF
	integrityValid := false
	if doc.StorageKey != "" {
		rc, err := s.storage.Open(ctx, doc.StorageKey)
		if err == nil {
			pdfBytes, err := io.ReadAll(rc)
			rc.Close()
			if err == nil {
				integrityValid = s.verifier.VerifyIntegrity(vr.SHA256Hash, pdfBytes)
			}
		}
	}

	return &models.PublicVerificationInfo{
		VerificationToken: vr.VerificationToken,
		DocumentNumber:    doc.DocumentNumber,
		DocumentType:      doc.DocumentType,
		IssueDate:         doc.IssueDate,
		IssuingBusiness:   businessName,
		Status:            status,
		SHA256Hash:        vr.SHA256Hash,
		VerifiedAt:        time.Now().UTC(),
		IntegrityValid:    integrityValid,
	}, nil
}

// CheckDocumentIntegrity calculates and re-verifies the stored PDF byte hash
func (s *VerificationService) CheckDocumentIntegrity(ctx context.Context, userID, docID uuid.UUID) (*models.IntegrityCheckResult, error) {
	doc, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	if doc.StorageKey == "" {
		return nil, errors.New("document has no finalized PDF stored")
	}

	rc, err := s.storage.Open(ctx, doc.StorageKey)
	if err != nil {
		return nil, fmt.Errorf("failed opening stored PDF: %w", err)
	}
	defer rc.Close()

	pdfBytes, err := io.ReadAll(rc)
	if err != nil {
		return nil, fmt.Errorf("failed reading stored PDF: %w", err)
	}

	actualHash := s.verifier.ComputePDFHash(pdfBytes)
	matches := (actualHash == doc.SHA256)

	return &models.IntegrityCheckResult{
		DocumentID:     doc.ID,
		DocumentNumber: doc.DocumentNumber,
		ExpectedHash:   doc.SHA256,
		ActualHash:     actualHash,
		Matches:        matches,
		FileSizeBytes:  int64(len(pdfBytes)),
		StorageKey:     doc.StorageKey,
		CheckedAt:      time.Now().UTC(),
	}, nil
}
