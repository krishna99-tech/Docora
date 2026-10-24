package services

import (
	"context"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

type BusinessService struct {
	businessRepo *repositories.BusinessRepository
}

func NewBusinessService(businessRepo *repositories.BusinessRepository) *BusinessService {
	return &BusinessService{businessRepo: businessRepo}
}

func (s *BusinessService) GetProfile(ctx context.Context, userID uuid.UUID) (*models.BusinessProfile, error) {
	return s.businessRepo.GetByUserID(ctx, userID)
}

func (s *BusinessService) UpdateProfile(ctx context.Context, userID uuid.UUID, req models.UpdateBusinessProfileRequest) (*models.BusinessProfile, error) {
	profile, err := s.businessRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	profile.BusinessName = req.BusinessName
	profile.Address = req.Address
	profile.Phone = req.Phone
	profile.Email = req.Email
	profile.TaxRegistrationNumber = req.TaxRegistrationNumber
	if req.Currency != "" {
		profile.Currency = req.Currency
	}
	if req.DateFormat != "" {
		profile.DateFormat = req.DateFormat
	}
	if req.NumberFormat != "" {
		profile.NumberFormat = req.NumberFormat
	}

	if err := s.businessRepo.Update(ctx, profile); err != nil {
		return nil, err
	}

	return profile, nil
}
