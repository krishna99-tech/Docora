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

var (
	ErrWorkspaceNotFound = errors.New("workspace not found")
	ErrMemberNotFound    = errors.New("member not found")
	ErrAlreadyMember     = errors.New("user is already a member of this workspace")
)

type WorkspaceRepository struct {
	db *DB
}

func NewWorkspaceRepository(db *DB) *WorkspaceRepository {
	return &WorkspaceRepository{db: db}
}

func (r *WorkspaceRepository) CreateWorkspace(ctx context.Context, ws *models.Workspace) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	now := time.Now().UTC()
	ws.CreatedAt = now
	ws.UpdatedAt = now

	_, err = tx.Exec(ctx, query, ws.ID, ws.Name, ws.Slug, ws.OwnerID, ws.CreatedAt, ws.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed creating workspace: %w", err)
	}

	// Add owner as workspace member with owner role
	memberQuery := `
		INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = tx.Exec(ctx, memberQuery, uuid.New(), ws.ID, ws.OwnerID, models.RoleOwner, now)
	if err != nil {
		return fmt.Errorf("failed adding owner to workspace members: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *WorkspaceRepository) GetWorkspaceByID(ctx context.Context, id uuid.UUID) (*models.Workspace, error) {
	query := `SELECT id, name, slug, owner_id, created_at, updated_at FROM workspaces WHERE id = $1`
	var ws models.Workspace
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(&ws.ID, &ws.Name, &ws.Slug, &ws.OwnerID, &ws.CreatedAt, &ws.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}
	return &ws, nil
}

func (r *WorkspaceRepository) GetWorkspacesForUser(ctx context.Context, userID uuid.UUID) ([]models.Workspace, error) {
	query := `
		SELECT w.id, w.name, w.slug, w.owner_id, w.created_at, w.updated_at
		FROM workspaces w
		JOIN workspace_members wm ON w.id = wm.workspace_id
		WHERE wm.user_id = $1
		ORDER BY w.name ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	workspaces := make([]models.Workspace, 0)
	for rows.Next() {
		var ws models.Workspace
		if err := rows.Scan(&ws.ID, &ws.Name, &ws.Slug, &ws.OwnerID, &ws.CreatedAt, &ws.UpdatedAt); err != nil {
			return nil, err
		}
		workspaces = append(workspaces, ws)
	}
	return workspaces, nil
}

func (r *WorkspaceRepository) GetUserRole(ctx context.Context, workspaceID, userID uuid.UUID) (string, error) {
	query := `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`
	var role string
	err := r.db.Pool.QueryRow(ctx, query, workspaceID, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrMemberNotFound
		}
		return "", err
	}
	return role, nil
}

func (r *WorkspaceRepository) GetMembers(ctx context.Context, workspaceID uuid.UUID) ([]models.WorkspaceMember, error) {
	query := `
		SELECT wm.id, wm.workspace_id, wm.user_id, wm.role, wm.created_at, u.name, u.email
		FROM workspace_members wm
		JOIN users u ON wm.user_id = u.id
		WHERE wm.workspace_id = $1
		ORDER BY wm.created_at ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := make([]models.WorkspaceMember, 0)
	for rows.Next() {
		var m models.WorkspaceMember
		if err := rows.Scan(&m.ID, &m.WorkspaceID, &m.UserID, &m.Role, &m.CreatedAt, &m.UserName, &m.UserEmail); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, nil
}

func (r *WorkspaceRepository) AddMember(ctx context.Context, member *models.WorkspaceMember) error {
	query := `
		INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (workspace_id, user_id) DO NOTHING
	`
	tag, err := r.db.Pool.Exec(ctx, query, member.ID, member.WorkspaceID, member.UserID, member.Role, time.Now().UTC())
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrAlreadyMember
	}
	return nil
}

func (r *WorkspaceRepository) RemoveMember(ctx context.Context, workspaceID, userID uuid.UUID) error {
	query := `DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`
	_, err := r.db.Pool.Exec(ctx, query, workspaceID, userID)
	return err
}

func (r *WorkspaceRepository) UpdateMemberRole(ctx context.Context, workspaceID, userID uuid.UUID, role string) error {
	query := `UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3`
	tag, err := r.db.Pool.Exec(ctx, query, role, workspaceID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrMemberNotFound
	}
	return nil
}
