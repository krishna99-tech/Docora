package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	TriggerManual            = "manual"
	TriggerScheduled         = "scheduled"
	TriggerWebhook           = "webhook"
	TriggerAPI               = "api"
	TriggerDocumentCreated   = "document_created"
	TriggerDocumentFinalized = "document_finalized"

	WorkflowStatusPending         = "pending"
	WorkflowStatusRunning         = "running"
	WorkflowStatusWaitingApproval = "waiting_approval"
	WorkflowStatusCompleted       = "completed"
	WorkflowStatusFailed          = "failed"
	WorkflowStatusCancelled       = "cancelled"

	StepStatusPending   = "pending"
	StepStatusRunning   = "running"
	StepStatusCompleted = "completed"
	StepStatusFailed    = "failed"
	StepStatusSkipped   = "skipped"

	ApprovalPending  = "pending"
	ApprovalApproved = "approved"
	ApprovalRejected = "rejected"
)

type NodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type WorkflowNode struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"` // trigger, generate_receipt, generate_invoice, generate_quotation, generate_pdf, merge_pdfs, create_zip, parse_csv, parse_json, validate_fields, transform_data, filter_records, iterate_records, condition, switch, delay, log_note, set_output, stop, approval
	Label    string                 `json:"label"`
	Position NodePosition           `json:"position"`
	Data     map[string]interface{} `json:"data"`
}

type WorkflowEdge struct {
	ID           string `json:"id"`
	Source       string `json:"source"`
	Target       string `json:"target"`
	SourceHandle string `json:"sourceHandle,omitempty"` // "true", "false", "default", etc.
	TargetHandle string `json:"targetHandle,omitempty"`
	Label        string `json:"label,omitempty"`
}

type WorkflowDefinition struct {
	Nodes     []WorkflowNode         `json:"nodes"`
	Edges     []WorkflowEdge         `json:"edges"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

type Workflow struct {
	ID           uuid.UUID       `json:"id"`
	WorkspaceID  uuid.UUID       `json:"workspaceId"`
	UserID       uuid.UUID       `json:"userId"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	Category     string          `json:"category"`
	TriggerType  string          `json:"triggerType"`
	Definition   json.RawMessage `json:"definition"`
	IsActive     bool            `json:"isActive"`
	Version      int             `json:"version"`
	Tags         json.RawMessage `json:"tags"`
	WebhookToken string          `json:"webhookToken,omitempty"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`

	// Enriched fields for dashboard
	TotalExecutions      int    `json:"totalExecutions,omitempty"`
	SuccessfulExecutions int    `json:"successfulExecutions,omitempty"`
	FailedExecutions     int    `json:"failedExecutions,omitempty"`
	LastExecutedAt       string `json:"lastExecutedAt,omitempty"`
}

type CreateWorkflowRequest struct {
	Name        string          `json:"name" binding:"required,min=2,max=100"`
	Description string          `json:"description"`
	Category    string          `json:"category"`
	TriggerType string          `json:"triggerType" binding:"required"`
	Definition  json.RawMessage `json:"definition" binding:"required"`
	IsActive    bool            `json:"isActive"`
	Tags        []string        `json:"tags,omitempty"`
}

type UpdateWorkflowRequest struct {
	Name          string          `json:"name" binding:"required,min=2,max=100"`
	Description   string          `json:"description"`
	Category      string          `json:"category"`
	TriggerType   string          `json:"triggerType" binding:"required"`
	Definition    json.RawMessage `json:"definition" binding:"required"`
	IsActive      bool            `json:"isActive"`
	Tags          []string        `json:"tags,omitempty"`
	ChangeSummary string          `json:"changeSummary"`
}

type WorkflowVersion struct {
	ID            uuid.UUID       `json:"id"`
	WorkflowID    uuid.UUID       `json:"workflowId"`
	VersionNumber int             `json:"versionNumber"`
	Name          string          `json:"name"`
	Description   string          `json:"description"`
	TriggerType   string          `json:"triggerType"`
	Definition    json.RawMessage `json:"definition"`
	ChangeSummary string          `json:"changeSummary"`
	UserID        *uuid.UUID      `json:"userId,omitempty"`
	CreatedAt     time.Time       `json:"createdAt"`
}

type NodeRetryPolicy struct {
	MaxAttempts       int     `json:"maxAttempts"`
	InitialBackoffMs  int     `json:"initialBackoffMs"`
	BackoffMultiplier float64 `json:"backoffMultiplier"`
}

type WorkflowStepExecution struct {
	ID           uuid.UUID       `json:"id"`
	ExecutionID  uuid.UUID       `json:"executionId"`
	NodeID       string          `json:"nodeId"`
	NodeType     string          `json:"nodeType"`
	NodeLabel    string          `json:"nodeLabel"`
	Status       string          `json:"status"` // pending, running, completed, failed, skipped
	InputData    json.RawMessage `json:"inputData"`
	OutputData   json.RawMessage `json:"outputData"`
	ErrorMessage string          `json:"errorMessage,omitempty"`
	DurationMs   int64           `json:"durationMs"`
	StartedAt    time.Time       `json:"startedAt"`
	CompletedAt  *time.Time      `json:"completedAt,omitempty"`
	StepOrder    int             `json:"stepOrder"`
	Attempt      int             `json:"attempt"`
	MaxRetries   int             `json:"maxRetries"`
	RetryPolicy  json.RawMessage `json:"retryPolicy,omitempty"`
}

type WorkflowExecution struct {
	ID               uuid.UUID               `json:"id"`
	WorkflowID       uuid.UUID               `json:"workflowId"`
	DocumentID       *uuid.UUID              `json:"documentId,omitempty"`
	Status           string                  `json:"status"`
	CurrentStepID    string                  `json:"currentStepId"`
	TriggerSource    string                  `json:"triggerSource"`
	VersionNumber    int                     `json:"versionNumber"`
	PinnedDefinition json.RawMessage         `json:"pinnedDefinition"`
	ContextData      json.RawMessage         `json:"contextData"`
	Logs             json.RawMessage         `json:"logs"`
	ErrorMessage     string                  `json:"errorMessage,omitempty"`
	DurationMs       int64                   `json:"durationMs"`
	RecordsTotal     int                     `json:"recordsTotal"`
	RecordsProcessed int                     `json:"recordsProcessed"`
	RecordsFailed    int                     `json:"recordsFailed"`
	GeneratedDocIDs  json.RawMessage         `json:"generatedDocIds"`
	StartedAt        time.Time               `json:"startedAt"`
	CompletedAt      *time.Time              `json:"completedAt,omitempty"`
	CreatedAt        time.Time               `json:"createdAt"`
	UpdatedAt        time.Time               `json:"updatedAt"`
	WorkflowName     string                  `json:"workflowName,omitempty"`
	StepExecutions   []WorkflowStepExecution `json:"stepExecutions,omitempty"`
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

type WorkflowSchedule struct {
	ID             uuid.UUID  `json:"id"`
	WorkflowID     uuid.UUID  `json:"workflowId"`
	WorkspaceID    uuid.UUID  `json:"workspaceId"`
	CronExpression string     `json:"cronExpression"`
	Frequency      string     `json:"frequency"` // hourly, daily, weekly, monthly, cron
	Timezone       string     `json:"timezone"`
	IsActive       bool       `json:"isActive"`
	NextRunAt      *time.Time `json:"nextRunAt,omitempty"`
	LastRunAt      *time.Time `json:"lastRunAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	WorkflowName   string     `json:"workflowName,omitempty"`
}

type SaveScheduleRequest struct {
	CronExpression string `json:"cronExpression"`
	Frequency      string `json:"frequency" binding:"required,oneof=hourly daily weekly monthly cron"`
	Timezone       string `json:"timezone"`
	IsActive       bool   `json:"isActive"`
}

type DailyExecutionMetric struct {
	Date       string `json:"date"`
	Total      int    `json:"total"`
	Successful int    `json:"successful"`
	Failed     int    `json:"failed"`
}

type WorkflowAnalytics struct {
	TotalWorkflows       int                    `json:"totalWorkflows"`
	ActiveWorkflows      int                    `json:"activeWorkflows"`
	DraftWorkflows       int                    `json:"draftWorkflows"`
	TotalExecutions      int                    `json:"totalExecutions"`
	SuccessfulExecutions int                    `json:"successfulExecutions"`
	FailedExecutions     int                    `json:"failedExecutions"`
	SuccessRate          float64                `json:"successRate"`
	AvgDurationMs        int64                  `json:"avgDurationMs"`
	DocumentsGenerated   int                    `json:"documentsGenerated"`
	DailyVolume          []DailyExecutionMetric `json:"dailyVolume"`
}

type DryRunStepResult struct {
	NodeID       string                 `json:"nodeId"`
	NodeType     string                 `json:"nodeType"`
	NodeLabel    string                 `json:"nodeLabel"`
	Status       string                 `json:"status"`
	Input        map[string]interface{} `json:"input"`
	Output       map[string]interface{} `json:"output"`
	ErrorMessage string                 `json:"errorMessage,omitempty"`
	DurationMs   int64                  `json:"durationMs"`
}

type DryRunRequest struct {
	Definition  json.RawMessage        `json:"definition" binding:"required"`
	SampleInput map[string]interface{} `json:"sampleInput"`
}

type DryRunResponse struct {
	Success         bool                   `json:"success"`
	StepResults     []DryRunStepResult     `json:"stepResults"`
	SimulatedOutput map[string]interface{} `json:"simulatedOutput"`
	Logs            []string               `json:"logs"`
	DurationMs      int64                  `json:"durationMs"`
}

type BulkExecutionRequest struct {
	Records      []map[string]interface{} `json:"records"`
	CSVData      string                   `json:"csvData"`
	FieldMapping map[string]string        `json:"fieldMapping"`
	DocumentType string                   `json:"documentType"` // receipt, invoice, quotation, pdf
	CreateZip    bool                     `json:"createZip"`
}

type WorkflowTemplate struct {
	ID                string             `json:"id"`
	Name              string             `json:"name"`
	Description       string             `json:"description"`
	Category          string             `json:"category"`
	TriggerType       string             `json:"triggerType"`
	Definition        WorkflowDefinition `json:"definition"`
	RequiredInputs    []string           `json:"requiredInputs"`
	SetupInstructions string             `json:"setupInstructions"`
}
