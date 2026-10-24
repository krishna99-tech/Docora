package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var (
	ErrJobNotFound = errors.New("processing job not found")
)

type JobRepository struct {
	db *DB
}

func NewJobRepository(db *DB) *JobRepository {
	return &JobRepository{db: db}
}

func (r *JobRepository) CreateJob(ctx context.Context, job *models.ProcessingJob) error {
	query := `
		INSERT INTO processing_jobs (
			id, workspace_id, user_id, job_type, status, input_storage_keys,
			output_storage_key, output_filename, output_file_size, options,
			error_message, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	now := time.Now().UTC()
	job.CreatedAt = now
	job.UpdatedAt = now
	inputKeysJSON, _ := json.Marshal(job.InputStorageKeys)

	_, err := r.db.Pool.Exec(ctx, query,
		job.ID, job.WorkspaceID, job.UserID, job.JobType, job.Status, inputKeysJSON,
		job.OutputStorageKey, job.OutputFilename, job.OutputFileSize, job.Options,
		job.ErrorMessage, job.CreatedAt, job.UpdatedAt,
	)
	return err
}

func (r *JobRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ProcessingJob, error) {
	query := `
		SELECT 
			id, workspace_id, user_id, job_type, status, input_storage_keys,
			output_storage_key, output_filename, output_file_size, options,
			error_message, created_at, updated_at, completed_at
		FROM processing_jobs
		WHERE id = $1
	`
	var job models.ProcessingJob
	var inputKeysRaw []byte

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&job.ID, &job.WorkspaceID, &job.UserID, &job.JobType, &job.Status, &inputKeysRaw,
		&job.OutputStorageKey, &job.OutputFilename, &job.OutputFileSize, &job.Options,
		&job.ErrorMessage, &job.CreatedAt, &job.UpdatedAt, &job.CompletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrJobNotFound
		}
		return nil, err
	}

	_ = json.Unmarshal(inputKeysRaw, &job.InputStorageKeys)
	return &job, nil
}

func (r *JobRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status, outputKey, outputFilename string, outputSize int64, errorMsg string) error {
	now := time.Now().UTC()
	var completedAt *time.Time
	if status == models.JobStatusCompleted || status == models.JobStatusFailed {
		completedAt = &now
	}

	query := `
		UPDATE processing_jobs
		SET status = $1, output_storage_key = $2, output_filename = $3, output_file_size = $4,
		    error_message = $5, updated_at = $6, completed_at = $7
		WHERE id = $8
	`
	_, err := r.db.Pool.Exec(ctx, query, status, outputKey, outputFilename, outputSize, errorMsg, now, completedAt, id)
	return err
}

func (r *JobRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]models.ProcessingJob, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query := `
		SELECT 
			id, workspace_id, user_id, job_type, status, input_storage_keys,
			output_storage_key, output_filename, output_file_size, options,
			error_message, created_at, updated_at, completed_at
		FROM processing_jobs
		WHERE workspace_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []models.ProcessingJob
	for rows.Next() {
		var j models.ProcessingJob
		var inputKeysRaw []byte
		if err := rows.Scan(
			&j.ID, &j.WorkspaceID, &j.UserID, &j.JobType, &j.Status, &inputKeysRaw,
			&j.OutputStorageKey, &j.OutputFilename, &j.OutputFileSize, &j.Options,
			&j.ErrorMessage, &j.CreatedAt, &j.UpdatedAt, &j.CompletedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(inputKeysRaw, &j.InputStorageKeys)
		jobs = append(jobs, j)
	}
	return jobs, nil
}
