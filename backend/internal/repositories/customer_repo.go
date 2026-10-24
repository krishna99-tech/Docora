package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var ErrCustomerNotFound = errors.New("customer not found")

type CustomerRepository struct {
	db *DB
}

func NewCustomerRepository(db *DB) *CustomerRepository {
	return &CustomerRepository{db: db}
}

func (r *CustomerRepository) Create(ctx context.Context, customer *models.Customer) error {
	query := `
		INSERT INTO customers (id, user_id, name, email, phone, address, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	if customer.ID == uuid.Nil {
		customer.ID = uuid.New()
	}
	now := time.Now().UTC()
	customer.CreatedAt = now
	customer.UpdatedAt = now

	_, err := r.db.Pool.Exec(ctx, query,
		customer.ID,
		customer.UserID,
		customer.Name,
		customer.Email,
		customer.Phone,
		customer.Address,
		customer.CreatedAt,
		customer.UpdatedAt,
	)
	return err
}

func (r *CustomerRepository) GetByID(ctx context.Context, userID, id uuid.UUID) (*models.Customer, error) {
	query := `
		SELECT id, user_id, name, email, phone, address, created_at, updated_at
		FROM customers
		WHERE id = $1 AND user_id = $2
	`
	var c models.Customer
	err := r.db.Pool.QueryRow(ctx, query, id, userID).Scan(
		&c.ID,
		&c.UserID,
		&c.Name,
		&c.Email,
		&c.Phone,
		&c.Address,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCustomerNotFound
		}
		return nil, err
	}
	return &c, nil
}

func (r *CustomerRepository) List(ctx context.Context, userID uuid.UUID, search string, page, pageSize int) ([]models.Customer, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var countQuery, listQuery string
	var args []any
	args = append(args, userID)

	if search != "" {
		countQuery = `SELECT COUNT(*) FROM customers WHERE user_id = $1 AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`
		listQuery = `
			SELECT id, user_id, name, email, phone, address, created_at, updated_at
			FROM customers
			WHERE user_id = $1 AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
			ORDER BY name ASC
			LIMIT $3 OFFSET $4
		`
		pattern := "%" + search + "%"
		args = append(args, pattern)
	} else {
		countQuery = `SELECT COUNT(*) FROM customers WHERE user_id = $1`
		listQuery = `
			SELECT id, user_id, name, email, phone, address, created_at, updated_at
			FROM customers
			WHERE user_id = $1
			ORDER BY name ASC
			LIMIT $2 OFFSET $3
		`
	}

	var total int64
	err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	var rows pgx.Rows
	if search != "" {
		rows, err = r.db.Pool.Query(ctx, listQuery, userID, "%"+search+"%", pageSize, offset)
	} else {
		rows, err = r.db.Pool.Query(ctx, listQuery, userID, pageSize, offset)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	customers := make([]models.Customer, 0)
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(
			&c.ID,
			&c.UserID,
			&c.Name,
			&c.Email,
			&c.Phone,
			&c.Address,
			&c.CreatedAt,
			&c.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		customers = append(customers, c)
	}

	return customers, total, nil
}

func (r *CustomerRepository) Update(ctx context.Context, customer *models.Customer) error {
	query := `
		UPDATE customers
		SET name = $1, email = $2, phone = $3, address = $4, updated_at = NOW()
		WHERE id = $5 AND user_id = $6
	`
	res, err := r.db.Pool.Exec(ctx, query,
		customer.Name,
		customer.Email,
		customer.Phone,
		customer.Address,
		customer.ID,
		customer.UserID,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrCustomerNotFound
	}
	return nil
}

func (r *CustomerRepository) Delete(ctx context.Context, userID, id uuid.UUID) error {
	// Check if customer is referenced in any finalized documents
	var docCount int
	checkQuery := `SELECT COUNT(*) FROM documents WHERE customer_id = $1 AND user_id = $2 AND status != 'draft'`
	_ = r.db.Pool.QueryRow(ctx, checkQuery, id, userID).Scan(&docCount)
	if docCount > 0 {
		return fmt.Errorf("cannot delete customer with %d associated finalized document(s)", docCount)
	}

	query := `DELETE FROM customers WHERE id = $1 AND user_id = $2`
	res, err := r.db.Pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrCustomerNotFound
	}
	return nil
}
