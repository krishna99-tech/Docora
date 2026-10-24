package repositories

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func NewDB(databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database config: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping failed: %w", err)
	}

	db := &DB{Pool: pool}

	// Auto-run migrations if migration files exist
	if err := db.RunMigrations(context.Background()); err != nil {
		log.Printf("Warning: automated migration check reported: %v", err)
	}

	return db, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

func (db *DB) RunMigrations(ctx context.Context) error {
	migrationCandidates := []string{
		"./migrations/000001_init_schema.up.sql",
		"../migrations/000001_init_schema.up.sql",
		"../../migrations/000001_init_schema.up.sql",
		"/app/migrations/000001_init_schema.up.sql",
	}

	var migrationSQL string
	for _, path := range migrationCandidates {
		absPath, _ := filepath.Abs(path)
		data, err := os.ReadFile(absPath)
		if err == nil {
			migrationSQL = string(data)
			break
		}
	}

	if migrationSQL == "" {
		return nil
	}

	// Execute migrations
	_, err := db.Pool.Exec(ctx, migrationSQL)
	if err != nil {
		// If already initialized, ignore already exists errors
		if strings.Contains(err.Error(), "already exists") {
			return nil
		}
		return fmt.Errorf("migration execution error: %w", err)
	}

	log.Println("Database schema migration verified successfully.")
	return nil
}
