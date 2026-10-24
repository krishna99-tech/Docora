package services

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

var (
	ErrForbiddenWorkspaceAction = errors.New("forbidden: insufficient workspace permissions")
	ErrOwnerCannotLeave         = errors.New("the workspace owner cannot leave or be removed")
)

type WorkspaceService struct {
	workspaceRepo *repositories.WorkspaceRepository
	userRepo      *repositories.UserRepository
}

func NewWorkspaceService(wsRepo *repositories.WorkspaceRepository, userRepo *repositories.UserRepository) *WorkspaceService {
	return &WorkspaceService{
		workspaceRepo: wsRepo,
		userRepo:      userRepo,
	}
}

func (s *WorkspaceService) CreateWorkspace(ctx context.Context, userID uuid.UUID, req models.CreateWorkspaceRequest) (*models.Workspace, error) {
	slug := strings.ToLower(strings.TrimSpace(req.Slug))
	slug = strings.ReplaceAll(slug, " ", "-")

	ws := &models.Workspace{
		ID:      uuid.New(),
		Name:    req.Name,
		Slug:    slug,
		OwnerID: userID,
	}

	if err := s.workspaceRepo.CreateWorkspace(ctx, ws); err != nil {
		return nil, err
	}
	return ws, nil
}

func (s *WorkspaceService) GetUserWorkspaces(ctx context.Context, userID uuid.UUID) ([]models.Workspace, error) {
	return s.workspaceRepo.GetWorkspacesForUser(ctx, userID)
}

func (s *WorkspaceService) GetWorkspace(ctx context.Context, workspaceID, userID uuid.UUID) (*models.Workspace, error) {
	// Verify membership
	_, err := s.workspaceRepo.GetUserRole(ctx, workspaceID, userID)
	if err != nil {
		return nil, ErrForbiddenWorkspaceAction
	}
	return s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
}

func (s *WorkspaceService) GetMembers(ctx context.Context, workspaceID, userID uuid.UUID) ([]models.WorkspaceMember, error) {
	_, err := s.workspaceRepo.GetUserRole(ctx, workspaceID, userID)
	if err != nil {
		return nil, ErrForbiddenWorkspaceAction
	}
	return s.workspaceRepo.GetMembers(ctx, workspaceID)
}

func (s *WorkspaceService) AddMember(ctx context.Context, workspaceID, currentUserID uuid.UUID, req models.AddMemberRequest) error {
	role, err := s.workspaceRepo.GetUserRole(ctx, workspaceID, currentUserID)
	if err != nil || (role != models.RoleOwner && role != models.RoleAdmin) {
		return ErrForbiddenWorkspaceAction
	}

	targetUser, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return errors.New("user with this email does not exist")
	}

	member := &models.WorkspaceMember{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		UserID:      targetUser.ID,
		Role:        req.Role,
	}
	return s.workspaceRepo.AddMember(ctx, member)
}

func (s *WorkspaceService) UpdateMemberRole(ctx context.Context, workspaceID, currentUserID, targetUserID uuid.UUID, newRole string) error {
	callerRole, err := s.workspaceRepo.GetUserRole(ctx, workspaceID, currentUserID)
	if err != nil || callerRole != models.RoleOwner {
		return ErrForbiddenWorkspaceAction
	}

	ws, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	if ws.OwnerID == targetUserID {
		return errors.New("cannot change role of workspace owner")
	}

	return s.workspaceRepo.UpdateMemberRole(ctx, workspaceID, targetUserID, newRole)
}

func (s *WorkspaceService) RemoveMember(ctx context.Context, workspaceID, currentUserID, targetUserID uuid.UUID) error {
	callerRole, err := s.workspaceRepo.GetUserRole(ctx, workspaceID, currentUserID)
	if err != nil {
		return ErrForbiddenWorkspaceAction
	}

	if currentUserID != targetUserID && callerRole != models.RoleOwner && callerRole != models.RoleAdmin {
		return ErrForbiddenWorkspaceAction
	}

	ws, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	if ws.OwnerID == targetUserID {
		return ErrOwnerCannotLeave
	}

	return s.workspaceRepo.RemoveMember(ctx, workspaceID, targetUserID)
}
