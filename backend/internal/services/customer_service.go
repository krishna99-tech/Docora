package services

import (
	"context"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

type CustomerService struct {
	customerRepo *repositories.CustomerRepository
}

func NewCustomerService(customerRepo *repositories.CustomerRepository) *CustomerService {
	return &CustomerService{customerRepo: customerRepo}
}

func (s *CustomerService) Create(ctx context.Context, userID uuid.UUID, req models.UpdateCustomerRequest) (*models.Customer, error) {
	c := &models.Customer{
		ID:      uuid.New(),
		UserID:  userID,
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Address: req.Address,
	}
	if err := s.customerRepo.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *CustomerService) List(ctx context.Context, userID uuid.UUID, search string, page, pageSize int) ([]models.Customer, int64, error) {
	return s.customerRepo.List(ctx, userID, search, page, pageSize)
}

func (s *CustomerService) GetByID(ctx context.Context, userID, id uuid.UUID) (*models.Customer, error) {
	return s.customerRepo.GetByID(ctx, userID, id)
}

func (s *CustomerService) Update(ctx context.Context, userID, id uuid.UUID, req models.UpdateCustomerRequest) (*models.Customer, error) {
	c := &models.Customer{
		ID:      id,
		UserID:  userID,
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Address: req.Address,
	}
	if err := s.customerRepo.Update(ctx, c); err != nil {
		return nil, err
	}
	return s.customerRepo.GetByID(ctx, userID, id)
}

func (s *CustomerService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	return s.customerRepo.Delete(ctx, userID, id)
}
