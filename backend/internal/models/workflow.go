package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	TriggerManual            = "manual"
	TriggerDocumentCreated   = "document_created"
	TriggerDocumentFinalized = "document_finalized"

	WorkflowStatusPending         = "pending"
	WorkflowStatusRunning         = "running"
	WorkflowStatusWaitingApproval = "waiting_approval"
	WorkflowStatusCompleted       = "completed"
	WorkflowStatusFailed          = "failed"
	WorkflowStatusCancelled       = "cancelled"

	ApprovalPending  = "pending"
	ApprovalApproved = "approved"
	ApprovalRejected = "rejected"
)

type Workflow struct {
	ID          uuid.UUID       `json:"id"`
	WorkspaceID uuid.UUID       `json:"workspaceId"`
	UserID      uuid.UUID       `json:"userId"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	TriggerType string          `json:"triggerType"`
	Definition  json.RawMessage `json:"definition"`
	IsActive    bool            `json:"isActive"`
	Version     int             `json:"version"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

type CreateWorkflowRequest struct {
	Name        string          `json:"name" binding:"required,min=2,max=100"`
	Description string          `json:"description"`
	TriggerType string          `json:"triggerType" binding:"required,oneof=manual document_created document_finalized"`
	Definition  json.RawMessage `json:"definition" binding:"required"`
	IsActive    bool            `json:"isActive"`
}

type WorkflowExecution struct {
	ID            uuid.UUID       `json:"id"`
	WorkflowID    uuid.UUID       `json:"workflowId"`
	DocumentID    *uuid.UUID      `json:"documentId,omitempty"`
	Status        string          `json:"status"`
	CurrentStepID string          `json:"currentStepId"`
	ContextData   json.RawMessage `json:"contextData"`
	Logs          json.RawMessage `json:"logs"`
	ErrorMessage  string          `json:"errorMessage,omitempty"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
	WorkflowName  string          `json:"workflowName,omitempty"`
}

type WorkflowApproval struct {
	ID            uuid.UUID  `json:"id"`
	ExecutionID   uuid.UUID  `json:"executionId"`
	StepID        string     `json:"stepId"`
	ApproverID    *uuid.UUID `json:"approverId,omitempty"`
	ApproverName  string     `json:"approverName,omitempty"`
	Status        string     `json:"status"`
	DecisionNotes string     `json:"decisionNotes"`
	DecidedAt     *time.Time `json:"decidedAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	WorkflowName  string     `json:"workflowName,omitempty"`
}

type SubmitApprovalRequest struct {
	Status        string `json:"status" binding:"required,oneof=approved rejected"`
	DecisionNotes string `json:"decisionNotes"`
}
