package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var (
	ErrWorkflowNotFound  = errors.New("workflow not found")
	ErrExecutionNotFound = errors.New("workflow execution not found")
	ErrApprovalNotFound  = errors.New("workflow approval not found")
	ErrScheduleNotFound  = errors.New("workflow schedule not found")
)

type WorkflowRepository struct {
	db *DB
}

func NewWorkflowRepository(db *DB) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

// -----------------------------------------------------------------------------
// WORKFLOW CRUD
// -----------------------------------------------------------------------------

func (r *WorkflowRepository) CreateWorkflow(ctx context.Context, wf *models.Workflow) error {
	query := `
		INSERT INTO workflows (
			id, workspace_id, user_id, name, description, category, trigger_type, definition, is_active, version, tags, webhook_token, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	now := time.Now().UTC()
	wf.CreatedAt = now
	wf.UpdatedAt = now
	wf.Version = 1
	if wf.Category == "" {
		wf.Category = "General"
	}
	if len(wf.Tags) == 0 {
		wf.Tags = json.RawMessage("[]")
	}
	if wf.WebhookToken == "" {
		wf.WebhookToken = uuid.New().String()
	}

	_, err := r.db.Pool.Exec(ctx, query,
		wf.ID, wf.WorkspaceID, wf.UserID, wf.Name, wf.Description, wf.Category, wf.TriggerType, wf.Definition, wf.IsActive, wf.Version, wf.Tags, wf.WebhookToken, wf.CreatedAt, wf.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// Create initial version record
	_ = r.CreateVersion(ctx, &models.WorkflowVersion{
		ID:            uuid.New(),
		WorkflowID:    wf.ID,
		VersionNumber: 1,
		Name:          wf.Name,
		Description:   wf.Description,
		TriggerType:   wf.TriggerType,
		Definition:    wf.Definition,
		ChangeSummary: "Initial version",
		UserID:        &wf.UserID,
		CreatedAt:     now,
	})

	return nil
}

func (r *WorkflowRepository) GetWorkflowByID(ctx context.Context, id, workspaceID uuid.UUID) (*models.Workflow, error) {
	query := `
		SELECT id, workspace_id, user_id, name, description, category, trigger_type, definition, is_active, version, tags, COALESCE(webhook_token, ''), created_at, updated_at
		FROM workflows
		WHERE id = $1 AND workspace_id = $2
	`
	var wf models.Workflow
	err := r.db.Pool.QueryRow(ctx, query, id, workspaceID).Scan(
		&wf.ID, &wf.WorkspaceID, &wf.UserID, &wf.Name, &wf.Description, &wf.Category, &wf.TriggerType, &wf.Definition, &wf.IsActive, &wf.Version, &wf.Tags, &wf.WebhookToken, &wf.CreatedAt, &wf.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkflowNotFound
		}
		return nil, err
	}
	return &wf, nil
}

func (r *WorkflowRepository) GetWorkflowByWebhookToken(ctx context.Context, token string) (*models.Workflow, error) {
	query := `
		SELECT id, workspace_id, user_id, name, description, category, trigger_type, definition, is_active, version, tags, COALESCE(webhook_token, ''), created_at, updated_at
		FROM workflows
		WHERE webhook_token = $1 AND is_active = true
	`
	var wf models.Workflow
	err := r.db.Pool.QueryRow(ctx, query, token).Scan(
		&wf.ID, &wf.WorkspaceID, &wf.UserID, &wf.Name, &wf.Description, &wf.Category, &wf.TriggerType, &wf.Definition, &wf.IsActive, &wf.Version, &wf.Tags, &wf.WebhookToken, &wf.CreatedAt, &wf.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkflowNotFound
		}
		return nil, err
	}
	return &wf, nil
}

func (r *WorkflowRepository) ListWorkflows(ctx context.Context, workspaceID uuid.UUID, search, category, status string) ([]models.Workflow, error) {
	query := `
		SELECT 
			w.id, w.workspace_id, w.user_id, w.name, w.description, w.category, w.trigger_type, 
			w.definition, w.is_active, w.version, w.tags, COALESCE(w.webhook_token, ''), w.created_at, w.updated_at,
			COUNT(e.id) AS total_executions,
			COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS successful_executions,
			COUNT(CASE WHEN e.status = 'failed' THEN 1 END) AS failed_executions,
			COALESCE(MAX(e.created_at)::text, '') AS last_executed_at
		FROM workflows w
		LEFT JOIN workflow_executions e ON e.workflow_id = w.id
		WHERE w.workspace_id = $1
	`
	args := []interface{}{workspaceID}
	paramIdx := 2

	if search != "" {
		query += fmt.Sprintf(" AND (w.name ILIKE $%d OR w.description ILIKE $%d)", paramIdx, paramIdx)
		args = append(args, "%"+search+"%")
		paramIdx++
	}
	if category != "" && category != "all" {
		query += fmt.Sprintf(" AND w.category = $%d", paramIdx)
		args = append(args, category)
		paramIdx++
	}
	if status == "active" {
		query += " AND w.is_active = true"
	} else if status == "inactive" {
		query += " AND w.is_active = false"
	}

	query += `
		GROUP BY w.id
		ORDER BY w.updated_at DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.Workflow, 0)
	for rows.Next() {
		var wf models.Workflow
		if err := rows.Scan(
			&wf.ID, &wf.WorkspaceID, &wf.UserID, &wf.Name, &wf.Description, &wf.Category, &wf.TriggerType,
			&wf.Definition, &wf.IsActive, &wf.Version, &wf.Tags, &wf.WebhookToken, &wf.CreatedAt, &wf.UpdatedAt,
			&wf.TotalExecutions, &wf.SuccessfulExecutions, &wf.FailedExecutions, &wf.LastExecutedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, wf)
	}
	return list, nil
}

func (r *WorkflowRepository) UpdateWorkflow(ctx context.Context, wf *models.Workflow, changeSummary string, userID *uuid.UUID) error {
	wf.Version++
	wf.UpdatedAt = time.Now().UTC()

	query := `
		UPDATE workflows
		SET name = $1, description = $2, category = $3, trigger_type = $4, definition = $5, is_active = $6, version = $7, tags = $8, updated_at = $9
		WHERE id = $10 AND workspace_id = $11
	`
	res, err := r.db.Pool.Exec(ctx, query,
		wf.Name, wf.Description, wf.Category, wf.TriggerType, wf.Definition, wf.IsActive, wf.Version, wf.Tags, wf.UpdatedAt, wf.ID, wf.WorkspaceID,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrWorkflowNotFound
	}

	// Archive version snapshot
	_ = r.CreateVersion(ctx, &models.WorkflowVersion{
		ID:            uuid.New(),
		WorkflowID:    wf.ID,
		VersionNumber: wf.Version,
		Name:          wf.Name,
		Description:   wf.Description,
		TriggerType:   wf.TriggerType,
		Definition:    wf.Definition,
		ChangeSummary: changeSummary,
		UserID:        userID,
		CreatedAt:     wf.UpdatedAt,
	})

	return nil
}

func (r *WorkflowRepository) DeleteWorkflow(ctx context.Context, id, workspaceID uuid.UUID) error {
	query := `DELETE FROM workflows WHERE id = $1 AND workspace_id = $2`
	res, err := r.db.Pool.Exec(ctx, query, id, workspaceID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrWorkflowNotFound
	}
	return nil
}

func (r *WorkflowRepository) SetWorkflowActive(ctx context.Context, id, workspaceID uuid.UUID, active bool) error {
	query := `UPDATE workflows SET is_active = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3`
	res, err := r.db.Pool.Exec(ctx, query, active, id, workspaceID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrWorkflowNotFound
	}
	return nil
}

// -----------------------------------------------------------------------------
// WORKFLOW VERSIONS
// -----------------------------------------------------------------------------

func (r *WorkflowRepository) CreateVersion(ctx context.Context, v *models.WorkflowVersion) error {
	query := `
		INSERT INTO workflow_versions (id, workflow_id, version_number, name, description, trigger_type, definition, change_summary, user_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	if v.CreatedAt.IsZero() {
		v.CreatedAt = time.Now().UTC()
	}
	_, err := r.db.Pool.Exec(ctx, query,
		v.ID, v.WorkflowID, v.VersionNumber, v.Name, v.Description, v.TriggerType, v.Definition, v.ChangeSummary, v.UserID, v.CreatedAt,
	)
	return err
}

func (r *WorkflowRepository) ListVersions(ctx context.Context, workflowID uuid.UUID) ([]models.WorkflowVersion, error) {
	query := `
		SELECT id, workflow_id, version_number, name, description, trigger_type, definition, change_summary, user_id, created_at
		FROM workflow_versions
		WHERE workflow_id = $1
		ORDER BY version_number DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, workflowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.WorkflowVersion
	for rows.Next() {
		var v models.WorkflowVersion
		if err := rows.Scan(
			&v.ID, &v.WorkflowID, &v.VersionNumber, &v.Name, &v.Description, &v.TriggerType, &v.Definition, &v.ChangeSummary, &v.UserID, &v.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, v)
	}
	return list, nil
}

func (r *WorkflowRepository) GetVersion(ctx context.Context, workflowID uuid.UUID, versionNumber int) (*models.WorkflowVersion, error) {
	query := `
		SELECT id, workflow_id, version_number, name, description, trigger_type, definition, change_summary, user_id, created_at
		FROM workflow_versions
		WHERE workflow_id = $1 AND version_number = $2
	`
	var v models.WorkflowVersion
	err := r.db.Pool.QueryRow(ctx, query, workflowID, versionNumber).Scan(
		&v.ID, &v.WorkflowID, &v.VersionNumber, &v.Name, &v.Description, &v.TriggerType, &v.Definition, &v.ChangeSummary, &v.UserID, &v.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("version not found")
		}
		return nil, err
	}
	return &v, nil
}

// -----------------------------------------------------------------------------
// EXECUTIONS & STEP EXECUTIONS
// -----------------------------------------------------------------------------

func (r *WorkflowRepository) CreateExecution(ctx context.Context, ex *models.WorkflowExecution) error {
	query := `
		INSERT INTO workflow_executions (
			id, workflow_id, document_id, status, current_step_id, trigger_source,
			version_number, pinned_definition, context_data, logs, error_message, duration_ms,
			records_total, records_processed, records_failed, generated_doc_ids,
			started_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
	`
	now := time.Now().UTC()
	ex.CreatedAt = now
	ex.UpdatedAt = now
	if ex.StartedAt.IsZero() {
		ex.StartedAt = now
	}
	if ex.TriggerSource == "" {
		ex.TriggerSource = models.TriggerManual
	}
	if ex.VersionNumber <= 0 {
		ex.VersionNumber = 1
	}
	if len(ex.PinnedDefinition) == 0 {
		ex.PinnedDefinition = json.RawMessage("{\"nodes\": [], \"edges\": []}")
	}
	if len(ex.GeneratedDocIDs) == 0 {
		ex.GeneratedDocIDs = json.RawMessage("[]")
	}

	_, err := r.db.Pool.Exec(ctx, query,
		ex.ID, ex.WorkflowID, ex.DocumentID, ex.Status, ex.CurrentStepID, ex.TriggerSource,
		ex.VersionNumber, ex.PinnedDefinition, ex.ContextData, ex.Logs, ex.ErrorMessage, ex.DurationMs,
		ex.RecordsTotal, ex.RecordsProcessed, ex.RecordsFailed, ex.GeneratedDocIDs,
		ex.StartedAt, ex.CreatedAt, ex.UpdatedAt,
	)
	return err
}

func (r *WorkflowRepository) UpdateExecution(ctx context.Context, ex *models.WorkflowExecution) error {
	query := `
		UPDATE workflow_executions
		SET status = $1, current_step_id = $2, context_data = $3, logs = $4, error_message = $5,
		    duration_ms = $6, records_total = $7, records_processed = $8, records_failed = $9, generated_doc_ids = $10,
		    completed_at = $11, updated_at = $12
		WHERE id = $13
	`
	ex.UpdatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query,
		ex.Status, ex.CurrentStepID, ex.ContextData, ex.Logs, ex.ErrorMessage,
		ex.DurationMs, ex.RecordsTotal, ex.RecordsProcessed, ex.RecordsFailed, ex.GeneratedDocIDs,
		ex.CompletedAt, ex.UpdatedAt, ex.ID,
	)
	return err
}

func (r *WorkflowRepository) GetExecutionByID(ctx context.Context, id uuid.UUID) (*models.WorkflowExecution, error) {
	query := `
		SELECT 
			e.id, e.workflow_id, e.document_id, e.status, e.current_step_id, COALESCE(e.trigger_source, 'manual'),
			COALESCE(e.version_number, 1), COALESCE(e.pinned_definition, '{}'::jsonb),
			e.context_data, e.logs, e.error_message, COALESCE(e.duration_ms, 0),
			COALESCE(e.records_total, 0), COALESCE(e.records_processed, 0), COALESCE(e.records_failed, 0),
			COALESCE(e.generated_doc_ids, '[]'::jsonb), e.started_at, e.completed_at, e.created_at, e.updated_at,
			w.name
		FROM workflow_executions e
		JOIN workflows w ON w.id = e.workflow_id
		WHERE e.id = $1
	`
	var ex models.WorkflowExecution
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&ex.ID, &ex.WorkflowID, &ex.DocumentID, &ex.Status, &ex.CurrentStepID, &ex.TriggerSource,
		&ex.VersionNumber, &ex.PinnedDefinition,
		&ex.ContextData, &ex.Logs, &ex.ErrorMessage, &ex.DurationMs,
		&ex.RecordsTotal, &ex.RecordsProcessed, &ex.RecordsFailed,
		&ex.GeneratedDocIDs, &ex.StartedAt, &ex.CompletedAt, &ex.CreatedAt, &ex.UpdatedAt,
		&ex.WorkflowName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrExecutionNotFound
		}
		return nil, err
	}

	// Fetch step executions
	steps, _ := r.ListStepExecutions(ctx, ex.ID)
	ex.StepExecutions = steps

	return &ex, nil
}

func (r *WorkflowRepository) ListExecutions(ctx context.Context, workspaceID uuid.UUID, workflowID *uuid.UUID, status string, limit, offset int) ([]models.WorkflowExecution, error) {
	query := `
		SELECT 
			e.id, e.workflow_id, e.document_id, e.status, e.current_step_id, COALESCE(e.trigger_source, 'manual'),
			COALESCE(e.version_number, 1), COALESCE(e.pinned_definition, '{}'::jsonb),
			e.context_data, e.logs, e.error_message, COALESCE(e.duration_ms, 0),
			COALESCE(e.records_total, 0), COALESCE(e.records_processed, 0), COALESCE(e.records_failed, 0),
			COALESCE(e.generated_doc_ids, '[]'::jsonb), e.started_at, e.completed_at, e.created_at, e.updated_at,
			w.name
		FROM workflow_executions e
		JOIN workflows w ON w.id = e.workflow_id
		WHERE w.workspace_id = $1
	`
	args := []interface{}{workspaceID}
	paramIdx := 2

	if workflowID != nil {
		query += fmt.Sprintf(" AND e.workflow_id = $%d", paramIdx)
		args = append(args, *workflowID)
		paramIdx++
	}
	if status != "" && status != "all" {
		query += fmt.Sprintf(" AND e.status = $%d", paramIdx)
		args = append(args, status)
		paramIdx++
	}

	if limit <= 0 {
		limit = 50
	}
	query += fmt.Sprintf(" ORDER BY e.created_at DESC LIMIT $%d OFFSET $%d", paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.WorkflowExecution, 0)
	for rows.Next() {
		var ex models.WorkflowExecution
		if err := rows.Scan(
			&ex.ID, &ex.WorkflowID, &ex.DocumentID, &ex.Status, &ex.CurrentStepID, &ex.TriggerSource,
			&ex.VersionNumber, &ex.PinnedDefinition,
			&ex.ContextData, &ex.Logs, &ex.ErrorMessage, &ex.DurationMs,
			&ex.RecordsTotal, &ex.RecordsProcessed, &ex.RecordsFailed,
			&ex.GeneratedDocIDs, &ex.StartedAt, &ex.CompletedAt, &ex.CreatedAt, &ex.UpdatedAt,
			&ex.WorkflowName,
		); err != nil {
			return nil, err
		}
		list = append(list, ex)
	}
	return list, nil
}

func (r *WorkflowRepository) CreateStepExecution(ctx context.Context, step *models.WorkflowStepExecution) error {
	query := `
		INSERT INTO workflow_step_executions (
			id, execution_id, node_id, node_type, node_label, status, input_data, output_data,
			error_message, duration_ms, started_at, step_order, attempt, max_retries, retry_policy
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	if step.StartedAt.IsZero() {
		step.StartedAt = time.Now().UTC()
	}
	if step.Attempt <= 0 {
		step.Attempt = 1
	}
	if step.MaxRetries <= 0 {
		step.MaxRetries = 3
	}
	if len(step.RetryPolicy) == 0 {
		step.RetryPolicy = json.RawMessage("{\"maxAttempts\": 3, \"initialBackoffMs\": 500, \"backoffMultiplier\": 2.0}")
	}

	_, err := r.db.Pool.Exec(ctx, query,
		step.ID, step.ExecutionID, step.NodeID, step.NodeType, step.NodeLabel, step.Status,
		step.InputData, step.OutputData, step.ErrorMessage, step.DurationMs, step.StartedAt, step.StepOrder,
		step.Attempt, step.MaxRetries, step.RetryPolicy,
	)
	return err
}

func (r *WorkflowRepository) UpdateStepExecution(ctx context.Context, step *models.WorkflowStepExecution) error {
	query := `
		UPDATE workflow_step_executions
		SET status = $1, output_data = $2, error_message = $3, duration_ms = $4, completed_at = $5, attempt = $6
		WHERE id = $7
	`
	_, err := r.db.Pool.Exec(ctx, query,
		step.Status, step.OutputData, step.ErrorMessage, step.DurationMs, step.CompletedAt, step.Attempt, step.ID,
	)
	return err
}

func (r *WorkflowRepository) ListStepExecutions(ctx context.Context, executionID uuid.UUID) ([]models.WorkflowStepExecution, error) {
	query := `
		SELECT id, execution_id, node_id, node_type, node_label, status, input_data, output_data,
		       error_message, duration_ms, started_at, completed_at, step_order,
		       COALESCE(attempt, 1), COALESCE(max_retries, 3), COALESCE(retry_policy, '{}'::jsonb)
		FROM workflow_step_executions
		WHERE execution_id = $1
		ORDER BY step_order ASC, started_at ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, executionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.WorkflowStepExecution
	for rows.Next() {
		var s models.WorkflowStepExecution
		if err := rows.Scan(
			&s.ID, &s.ExecutionID, &s.NodeID, &s.NodeType, &s.NodeLabel, &s.Status,
			&s.InputData, &s.OutputData, &s.ErrorMessage, &s.DurationMs, &s.StartedAt, &s.CompletedAt, &s.StepOrder,
			&s.Attempt, &s.MaxRetries, &s.RetryPolicy,
		); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *WorkflowRepository) ListOrphanedExecutions(ctx context.Context) ([]models.WorkflowExecution, error) {
	if r.db == nil || r.db.Pool == nil {
		return nil, nil
	}
	query := `
		SELECT 
			e.id, e.workflow_id, e.document_id, e.status, e.current_step_id, COALESCE(e.trigger_source, 'manual'),
			COALESCE(e.version_number, 1), COALESCE(e.pinned_definition, '{}'::jsonb),
			e.context_data, e.logs, e.error_message, COALESCE(e.duration_ms, 0),
			COALESCE(e.records_total, 0), COALESCE(e.records_processed, 0), COALESCE(e.records_failed, 0),
			COALESCE(e.generated_doc_ids, '[]'::jsonb), e.started_at, e.completed_at, e.created_at, e.updated_at,
			w.name
		FROM workflow_executions e
		JOIN workflows w ON w.id = e.workflow_id
		WHERE e.status = 'running'
		ORDER BY e.created_at ASC
		LIMIT 100
	`
	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.WorkflowExecution
	for rows.Next() {
		var ex models.WorkflowExecution
		if err := rows.Scan(
			&ex.ID, &ex.WorkflowID, &ex.DocumentID, &ex.Status, &ex.CurrentStepID, &ex.TriggerSource,
			&ex.VersionNumber, &ex.PinnedDefinition,
			&ex.ContextData, &ex.Logs, &ex.ErrorMessage, &ex.DurationMs,
			&ex.RecordsTotal, &ex.RecordsProcessed, &ex.RecordsFailed,
			&ex.GeneratedDocIDs, &ex.StartedAt, &ex.CompletedAt, &ex.CreatedAt, &ex.UpdatedAt,
			&ex.WorkflowName,
		); err != nil {
			return nil, err
		}
		list = append(list, ex)
	}
	return list, nil
}

// -----------------------------------------------------------------------------
// APPROVALS
// -----------------------------------------------------------------------------

func (r *WorkflowRepository) CreateApproval(ctx context.Context, app *models.WorkflowApproval) error {
	query := `
		INSERT INTO workflow_approvals (id, execution_id, step_id, status, decision_notes, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	app.CreatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query,
		app.ID, app.ExecutionID, app.StepID, app.Status, app.DecisionNotes, app.CreatedAt,
	)
	return err
}

func (r *WorkflowRepository) ListApprovals(ctx context.Context, workspaceID uuid.UUID, status string) ([]models.WorkflowApproval, error) {
	query := `
		SELECT a.id, a.execution_id, a.step_id, a.approver_id, a.status, a.decision_notes, a.decided_at, a.created_at,
		       w.name, u.name
		FROM workflow_approvals a
		JOIN workflow_executions e ON e.id = a.execution_id
		JOIN workflows w ON w.id = e.workflow_id
		LEFT JOIN users u ON u.id = a.approver_id
		WHERE w.workspace_id = $1
	`
	args := []interface{}{workspaceID}
	if status != "" {
		query += " AND a.status = $2"
		args = append(args, status)
	}
	query += " ORDER BY a.created_at DESC"

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.WorkflowApproval
	for rows.Next() {
		var app models.WorkflowApproval
		var approverName *string
		if err := rows.Scan(
			&app.ID, &app.ExecutionID, &app.StepID, &app.ApproverID, &app.Status, &app.DecisionNotes, &app.DecidedAt, &app.CreatedAt,
			&app.WorkflowName, &approverName,
		); err != nil {
			return nil, err
		}
		if approverName != nil {
			app.ApproverName = *approverName
		}
		list = append(list, app)
	}
	return list, nil
}

func (r *WorkflowRepository) DecideApproval(ctx context.Context, id, approverID uuid.UUID, status, notes string) error {
	query := `
		UPDATE workflow_approvals
		SET approver_id = $1, status = $2, decision_notes = $3, decided_at = $4
		WHERE id = $5 AND status = 'pending'
	`
	now := time.Now().UTC()
	res, err := r.db.Pool.Exec(ctx, query, approverID, status, notes, now, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrApprovalNotFound
	}
	return nil
}

func (r *WorkflowRepository) GetApprovalByID(ctx context.Context, id uuid.UUID) (*models.WorkflowApproval, error) {
	query := `
		SELECT a.id, a.execution_id, a.step_id, a.approver_id, a.status, a.decision_notes, a.decided_at, a.created_at, w.name
		FROM workflow_approvals a
		JOIN workflow_executions e ON e.id = a.execution_id
		JOIN workflows w ON w.id = e.workflow_id
		WHERE a.id = $1
	`
	var app models.WorkflowApproval
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&app.ID, &app.ExecutionID, &app.StepID, &app.ApproverID, &app.Status, &app.DecisionNotes, &app.DecidedAt, &app.CreatedAt, &app.WorkflowName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrApprovalNotFound
		}
		return nil, err
	}
	return &app, nil
}

// -----------------------------------------------------------------------------
// SCHEDULES
// -----------------------------------------------------------------------------

func (r *WorkflowRepository) UpsertSchedule(ctx context.Context, s *models.WorkflowSchedule) error {
	query := `
		INSERT INTO workflow_schedules (
			id, workflow_id, workspace_id, cron_expression, frequency, timezone, is_active, next_run_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (id) DO UPDATE
		SET cron_expression = EXCLUDED.cron_expression,
		    frequency = EXCLUDED.frequency,
		    timezone = EXCLUDED.timezone,
		    is_active = EXCLUDED.is_active,
		    next_run_at = EXCLUDED.next_run_at,
		    updated_at = EXCLUDED.updated_at
	`
	now := time.Now().UTC()
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	s.CreatedAt = now
	s.UpdatedAt = now

	_, err := r.db.Pool.Exec(ctx, query,
		s.ID, s.WorkflowID, s.WorkspaceID, s.CronExpression, s.Frequency, s.Timezone, s.IsActive, s.NextRunAt, s.CreatedAt, s.UpdatedAt,
	)
	return err
}

func (r *WorkflowRepository) GetScheduleByWorkflowID(ctx context.Context, workflowID uuid.UUID) (*models.WorkflowSchedule, error) {
	query := `
		SELECT s.id, s.workflow_id, s.workspace_id, s.cron_expression, s.frequency, s.timezone, s.is_active, s.next_run_at, s.last_run_at, s.created_at, s.updated_at, w.name
		FROM workflow_schedules s
		JOIN workflows w ON w.id = s.workflow_id
		WHERE s.workflow_id = $1
	`
	var s models.WorkflowSchedule
	err := r.db.Pool.QueryRow(ctx, query, workflowID).Scan(
		&s.ID, &s.WorkflowID, &s.WorkspaceID, &s.CronExpression, &s.Frequency, &s.Timezone, &s.IsActive, &s.NextRunAt, &s.LastRunAt, &s.CreatedAt, &s.UpdatedAt, &s.WorkflowName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrScheduleNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *WorkflowRepository) ListDueSchedules(ctx context.Context) ([]models.WorkflowSchedule, error) {
	if r.db == nil || r.db.Pool == nil {
		return nil, nil
	}
	query := `
		SELECT s.id, s.workflow_id, s.workspace_id, s.cron_expression, s.frequency, s.timezone, s.is_active, s.next_run_at, s.last_run_at, s.created_at, s.updated_at, w.name
		FROM workflow_schedules s
		JOIN workflows w ON w.id = s.workflow_id
		WHERE s.is_active = true AND w.is_active = true AND (s.next_run_at IS NULL OR s.next_run_at <= NOW())
	`
	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.WorkflowSchedule
	for rows.Next() {
		var s models.WorkflowSchedule
		if err := rows.Scan(
			&s.ID, &s.WorkflowID, &s.WorkspaceID, &s.CronExpression, &s.Frequency, &s.Timezone, &s.IsActive, &s.NextRunAt, &s.LastRunAt, &s.CreatedAt, &s.UpdatedAt, &s.WorkflowName,
		); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *WorkflowRepository) UpdateScheduleRun(ctx context.Context, id uuid.UUID, lastRun, nextRun time.Time) error {
	query := `
		UPDATE workflow_schedules
		SET last_run_at = $1, next_run_at = $2, updated_at = NOW()
		WHERE id = $3
	`
	_, err := r.db.Pool.Exec(ctx, query, lastRun, nextRun, id)
	return err
}

// -----------------------------------------------------------------------------
// ANALYTICS
// -----------------------------------------------------------------------------

func (r *WorkflowRepository) GetAnalytics(ctx context.Context, workspaceID uuid.UUID) (*models.WorkflowAnalytics, error) {
	analytics := &models.WorkflowAnalytics{
		DailyVolume: []models.DailyExecutionMetric{},
	}

	// Workflows count
	wfQuery := `
		SELECT 
			COUNT(*),
			COUNT(CASE WHEN is_active = true THEN 1 END),
			COUNT(CASE WHEN is_active = false THEN 1 END)
		FROM workflows
		WHERE workspace_id = $1
	`
	_ = r.db.Pool.QueryRow(ctx, wfQuery, workspaceID).Scan(
		&analytics.TotalWorkflows, &analytics.ActiveWorkflows, &analytics.DraftWorkflows,
	)

	// Executions stats
	execQuery := `
		SELECT 
			COUNT(e.id),
			COUNT(CASE WHEN e.status = 'completed' THEN 1 END),
			COUNT(CASE WHEN e.status = 'failed' THEN 1 END),
			COALESCE(AVG(e.duration_ms), 0)::bigint,
			COALESCE(SUM(jsonb_array_length(CASE WHEN jsonb_typeof(e.generated_doc_ids) = 'array' THEN e.generated_doc_ids ELSE '[]'::jsonb END)), 0)
		FROM workflow_executions e
		JOIN workflows w ON w.id = e.workflow_id
		WHERE w.workspace_id = $1
	`
	_ = r.db.Pool.QueryRow(ctx, execQuery, workspaceID).Scan(
		&analytics.TotalExecutions, &analytics.SuccessfulExecutions, &analytics.FailedExecutions, &analytics.AvgDurationMs, &analytics.DocumentsGenerated,
	)

	if analytics.TotalExecutions > 0 {
		analytics.SuccessRate = float64(analytics.SuccessfulExecutions) / float64(analytics.TotalExecutions) * 100.0
	}

	// 14-day daily volume
	dailyQuery := `
		SELECT 
			TO_CHAR(d.day, 'YYYY-MM-DD') AS day_str,
			COUNT(e.id) AS total,
			COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS successful,
			COUNT(CASE WHEN e.status = 'failed' THEN 1 END) AS failed
		FROM (
			SELECT generate_series(NOW() - INTERVAL '13 days', NOW(), INTERVAL '1 day')::date AS day
		) d
		LEFT JOIN workflow_executions e 
			ON e.created_at::date = d.day 
			AND e.workflow_id IN (SELECT id FROM workflows WHERE workspace_id = $1)
		GROUP BY d.day
		ORDER BY d.day ASC
	`
	rows, err := r.db.Pool.Query(ctx, dailyQuery, workspaceID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var m models.DailyExecutionMetric
			if err := rows.Scan(&m.Date, &m.Total, &m.Successful, &m.Failed); err == nil {
				analytics.DailyVolume = append(analytics.DailyVolume, m)
			}
		}
	}

	return analytics, nil
}
