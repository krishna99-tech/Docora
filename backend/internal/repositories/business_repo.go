package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

type BusinessRepository struct {
	db *DB
}

func NewBusinessRepository(db *DB) *BusinessRepository {
	return &BusinessRepository{db: db}
}

func (r *BusinessRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.BusinessProfile, error) {
	query := `
		SELECT id, user_id, business_name, address, phone, email, tax_registration_number,
		       logo_storage_key, currency, date_format, number_format, created_at, updated_at
		FROM business_profiles
		WHERE user_id = $1
	`
	var profile models.BusinessProfile
	err := r.db.Pool.QueryRow(ctx, query, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.BusinessName,
		&profile.Address,
		&profile.Phone,
		&profile.Email,
		&profile.TaxRegistrationNumber,
		&profile.LogoStorageKey,
		&profile.Currency,
		&profile.DateFormat,
		&profile.NumberFormat,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Auto create empty profile if missing
			now := time.Now().UTC()
			profile = models.BusinessProfile{
				ID:           uuid.New(),
				UserID:       userID,
				Currency:     "USD",
				DateFormat:   "YYYY-MM-DD",
				NumberFormat: "comma_period",
				CreatedAt:    now,
				UpdatedAt:    now,
			}
			insertQuery := `
				INSERT INTO business_profiles (id, user_id, currency, date_format, number_format, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
				RETURNING id, user_id, business_name, address, phone, email, tax_registration_number,
				          logo_storage_key, currency, date_format, number_format, created_at, updated_at
			`
			err = r.db.Pool.QueryRow(ctx, insertQuery, profile.ID, profile.UserID, profile.Currency, profile.DateFormat, profile.NumberFormat, now, now).Scan(
				&profile.ID,
				&profile.UserID,
				&profile.BusinessName,
				&profile.Address,
				&profile.Phone,
				&profile.Email,
				&profile.TaxRegistrationNumber,
				&profile.LogoStorageKey,
				&profile.Currency,
				&profile.DateFormat,
				&profile.NumberFormat,
				&profile.CreatedAt,
				&profile.UpdatedAt,
			)
			if err != nil {
				return nil, err
			}
			return &profile, nil
		}
		return nil, err
	}
	return &profile, nil
}

func (r *BusinessRepository) Update(ctx context.Context, profile *models.BusinessProfile) error {
	query := `
		UPDATE business_profiles
		SET business_name = $1, address = $2, phone = $3, email = $4,
		    tax_registration_number = $5, logo_storage_key = $6, currency = $7,
		    date_format = $8, number_format = $9, updated_at = NOW()
		WHERE user_id = $10
	`
	_, err := r.db.Pool.Exec(ctx, query,
		profile.BusinessName,
		profile.Address,
		profile.Phone,
		profile.Email,
		profile.TaxRegistrationNumber,
		profile.LogoStorageKey,
		profile.Currency,
		profile.DateFormat,
		profile.NumberFormat,
		profile.UserID,
	)
	return err
}
