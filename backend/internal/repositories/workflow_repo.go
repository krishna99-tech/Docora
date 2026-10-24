package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"docora/backend/internal/models"
)

var (
	ErrWorkflowNotFound  = errors.New("workflow not found")
	ErrExecutionNotFound = errors.New("workflow execution not found")
	ErrApprovalNotFound  = errors.New("workflow approval not found")
)

type WorkflowRepository struct {
	db *DB
}

func NewWorkflowRepository(db *DB) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

func (r *WorkflowRepository) CreateWorkflow(ctx context.Context, wf *models.Workflow) error {
	query := `
		INSERT INTO workflows (id, workspace_id, user_id, name, description, trigger_type, definition, is_active, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	now := time.Now().UTC()
	wf.CreatedAt = now
	wf.UpdatedAt = now
	wf.Version = 1

	_, err := r.db.Pool.Exec(ctx, query,
		wf.ID, wf.WorkspaceID, wf.UserID, wf.Name, wf.Description, wf.TriggerType, wf.Definition, wf.IsActive, wf.Version, wf.CreatedAt, wf.UpdatedAt,
	)
	return err
}

func (r *WorkflowRepository) GetWorkflowByID(ctx context.Context, id, workspaceID uuid.UUID) (*models.Workflow, error) {
	query := `
		SELECT id, workspace_id, user_id, name, description, trigger_type, definition, is_active, version, created_at, updated_at
		FROM workflows
		WHERE id = $1 AND workspace_id = $2
	`
	var wf models.Workflow
	err := r.db.Pool.QueryRow(ctx, query, id, workspaceID).Scan(
		&wf.ID, &wf.WorkspaceID, &wf.UserID, &wf.Name, &wf.Description, &wf.TriggerType, &wf.Definition, &wf.IsActive, &wf.Version, &wf.CreatedAt, &wf.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkflowNotFound
		}
		return nil, err
	}
	return &wf, nil
}

func (r *WorkflowRepository) ListWorkflows(ctx context.Context, workspaceID uuid.UUID) ([]models.Workflow, error) {
	query := `
		SELECT id, workspace_id, user_id, name, description, trigger_type, definition, is_active, version, created_at, updated_at
		FROM workflows
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Workflow
	for rows.Next() {
		var wf models.Workflow
		if err := rows.Scan(
			&wf.ID, &wf.WorkspaceID, &wf.UserID, &wf.Name, &wf.Description, &wf.TriggerType, &wf.Definition, &wf.IsActive, &wf.Version, &wf.CreatedAt, &wf.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, wf)
	}
	return list, nil
}

func (r *WorkflowRepository) CreateExecution(ctx context.Context, ex *models.WorkflowExecution) error {
	query := `
		INSERT INTO workflow_executions (id, workflow_id, document_id, status, current_step_id, context_data, logs, error_message, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	now := time.Now().UTC()
	ex.CreatedAt = now
	ex.UpdatedAt = now

	_, err := r.db.Pool.Exec(ctx, query,
		ex.ID, ex.WorkflowID, ex.DocumentID, ex.Status, ex.CurrentStepID, ex.ContextData, ex.Logs, ex.ErrorMessage, ex.CreatedAt, ex.UpdatedAt,
	)
	return err
}

func (r *WorkflowRepository) GetExecutionByID(ctx context.Context, id uuid.UUID) (*models.WorkflowExecution, error) {
	query := `
		SELECT we.id, we.workflow_id, we.document_id, we.status, we.current_step_id, we.context_data, we.logs, we.error_message, we.created_at, we.updated_at, w.name
		FROM workflow_executions we
		JOIN workflows w ON we.workflow_id = w.id
		WHERE we.id = $1
	`
	var ex models.WorkflowExecution
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&ex.ID, &ex.WorkflowID, &ex.DocumentID, &ex.Status, &ex.CurrentStepID, &ex.ContextData, &ex.Logs, &ex.ErrorMessage, &ex.CreatedAt, &ex.UpdatedAt, &ex.WorkflowName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrExecutionNotFound
		}
		return nil, err
	}
	return &ex, nil
}

func (r *WorkflowRepository) UpdateExecution(ctx context.Context, ex *models.WorkflowExecution) error {
	ex.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE workflow_executions
		SET status = $1, current_step_id = $2, context_data = $3, logs = $4, error_message = $5, updated_at = $6
		WHERE id = $7
	`
	_, err := r.db.Pool.Exec(ctx, query, ex.Status, ex.CurrentStepID, ex.ContextData, ex.Logs, ex.ErrorMessage, ex.UpdatedAt, ex.ID)
	return err
}

func (r *WorkflowRepository) CreateApproval(ctx context.Context, app *models.WorkflowApproval) error {
	query := `
		INSERT INTO workflow_approvals (id, execution_id, step_id, status, decision_notes, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	app.CreatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query, app.ID, app.ExecutionID, app.StepID, app.Status, app.DecisionNotes, app.CreatedAt)
	return err
}

func (r *WorkflowRepository) ListApprovals(ctx context.Context, workspaceID uuid.UUID, status string) ([]models.WorkflowApproval, error) {
	query := `
		SELECT wa.id, wa.execution_id, wa.step_id, wa.approver_id, wa.status, wa.decision_notes, wa.decided_at, wa.created_at, w.name, u.name
		FROM workflow_approvals wa
		JOIN workflow_executions we ON wa.execution_id = we.id
		JOIN workflows w ON we.workflow_id = w.id
		LEFT JOIN users u ON wa.approver_id = u.id
		WHERE w.workspace_id = $1 AND ($2 = '' OR wa.status = $2)
		ORDER BY wa.created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.WorkflowApproval
	for rows.Next() {
		var a models.WorkflowApproval
		var approverName *string
		if err := rows.Scan(
			&a.ID, &a.ExecutionID, &a.StepID, &a.ApproverID, &a.Status, &a.DecisionNotes, &a.DecidedAt, &a.CreatedAt, &a.WorkflowName, &approverName,
		); err != nil {
			return nil, err
		}
		if approverName != nil {
			a.ApproverName = *approverName
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *WorkflowRepository) DecideApproval(ctx context.Context, id, approverID uuid.UUID, status, notes string) error {
	now := time.Now().UTC()
	query := `
		UPDATE workflow_approvals
		SET status = $1, approver_id = $2, decision_notes = $3, decided_at = $4
		WHERE id = $5 AND status = 'pending'
	`
	tag, err := r.db.Pool.Exec(ctx, query, status, approverID, notes, now, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrApprovalNotFound
	}
	return nil
}
