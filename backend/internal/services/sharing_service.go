package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

var (
	ErrInvalidSharePassword = errors.New("invalid sharing password")
	ErrPasswordRequired     = errors.New("this document requires a password")
)

type SharingService struct {
	sharingRepo *repositories.SharingRepository
	docRepo     *repositories.DocumentRepository
}

func NewSharingService(sr *repositories.SharingRepository, dr *repositories.DocumentRepository) *SharingService {
	return &SharingService{
		sharingRepo: sr,
		docRepo:     dr,
	}
}

// CreateSharingLink generates a high-entropy share token and hashes it for DB storage
func (s *SharingService) CreateSharingLink(ctx context.Context, userID, workspaceID, docID uuid.UUID, req models.CreateSharingLinkRequest) (*models.SharingLink, error) {
	// Verify doc exists and user has access
	_, err := s.docRepo.GetByID(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return nil, fmt.Errorf("failed generating random share token: %w", err)
	}
	rawToken := hex.EncodeToString(rawBytes)

	tokenHashBytes := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(tokenHashBytes[:])

	var expiresAt *time.Time
	if req.ExpiresInHours != nil && *req.ExpiresInHours > 0 {
		exp := time.Now().UTC().Add(time.Duration(*req.ExpiresInHours) * time.Hour)
		expiresAt = &exp
	}

	var pwdHash *string
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed hashing share password: %w", err)
		}
		strHash := string(hash)
		pwdHash = &strHash
	}

	link := &models.SharingLink{
		ID:            uuid.New(),
		DocumentID:    docID,
		WorkspaceID:   workspaceID,
		CreatedBy:     userID,
		TokenHash:     tokenHash,
		RawToken:      rawToken, // populated once on return for the user to copy
		HasPassword:   pwdHash != nil,
		ExpiresAt:     expiresAt,
		MaxAccesses:   req.MaxAccesses,
		AccessCount:   0,
		AllowDownload: req.AllowDownload,
		IsRevoked:     false,
		WatermarkText: req.WatermarkText,
	}
	if pwdHash != nil {
		link.PasswordHash = *pwdHash
	}

	if err := s.sharingRepo.CreateSharingLink(ctx, link); err != nil {
		return nil, err
	}

	return link, nil
}

// GetPublicShareInfo validates token validity, expiration, revocation, and returns public info
func (s *SharingService) GetPublicShareInfo(ctx context.Context, rawToken string) (*models.PublicSharedDocInfo, error) {
	tokenHashBytes := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(tokenHashBytes[:])

	link, err := s.sharingRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}

	if link.IsRevoked {
		return nil, repositories.ErrSharingLinkRevoked
	}

	if link.ExpiresAt != nil && link.ExpiresAt.Before(time.Now().UTC()) {
		return nil, repositories.ErrSharingLinkExpired
	}

	if link.MaxAccesses > 0 && link.AccessCount >= link.MaxAccesses {
		return nil, repositories.ErrMaxAccessReached
	}

	return &models.PublicSharedDocInfo{
		ID:               link.DocumentID,
		Title:            link.DocumentTitle,
		DocumentType:     link.DocumentType,
		AllowDownload:    link.AllowDownload,
		WatermarkText:    link.WatermarkText,
		RequiresPassword: link.HasPassword,
		ExpiresAt:        link.ExpiresAt,
	}, nil
}

// AccessSharedDocument verifies password if required and increments access counter
func (s *SharingService) AccessSharedDocument(ctx context.Context, rawToken, password string) (*models.SharingLink, error) {
	tokenHashBytes := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(tokenHashBytes[:])

	link, err := s.sharingRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}

	if link.IsRevoked {
		return nil, repositories.ErrSharingLinkRevoked
	}

	if link.ExpiresAt != nil && link.ExpiresAt.Before(time.Now().UTC()) {
		return nil, repositories.ErrSharingLinkExpired
	}

	if link.MaxAccesses > 0 && link.AccessCount >= link.MaxAccesses {
		return nil, repositories.ErrMaxAccessReached
	}

	if link.HasPassword {
		if password == "" {
			return nil, ErrPasswordRequired
		}
		if err := bcrypt.CompareHashAndPassword([]byte(link.PasswordHash), []byte(password)); err != nil {
			return nil, ErrInvalidSharePassword
		}
	}

	_ = s.sharingRepo.IncrementAccessCount(ctx, link.ID)
	return link, nil
}

func (s *SharingService) ListWorkspaceLinks(ctx context.Context, workspaceID uuid.UUID) ([]models.SharingLink, error) {
	return s.sharingRepo.ListByWorkspace(ctx, workspaceID)
}

func (s *SharingService) RevokeLink(ctx context.Context, id, workspaceID uuid.UUID) error {
	return s.sharingRepo.Revoke(ctx, id, workspaceID)
}
