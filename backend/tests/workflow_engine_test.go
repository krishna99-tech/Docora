package tests

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/services"
)

// TestCycleDetection validates directed dependency cycle detection in workflow graphs
func TestCycleDetection(t *testing.T) {
	svc := services.NewWorkflowService(nil, nil, nil, nil, nil)

	// Test 1: Self-referencing cycle
	selfCycle := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n1"}
		]
	}`)
	if err := svc.ValidateDefinition(selfCycle); err == nil {
		t.Fatalf("expected error on self-referencing cycle, got nil")
	}

	// Test 2: Multi-node cyclic deadlock (n1 -> n2 -> n3 -> n1)
	multiCycle := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "transform_data", "label": "Transform", "data": {"mappings": {"k": "v"}}},
			{"id": "n3", "type": "log_note", "label": "Log", "data": {"note": "test"}}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"},
			{"id": "e2", "source": "n2", "target": "n3"},
			{"id": "e3", "source": "n3", "target": "n1"}
		]
	}`)
	if err := svc.ValidateDefinition(multiCycle); err == nil {
		t.Fatalf("expected error on cyclic graph deadlock, got nil")
	}

	// Test 3: Acyclic branching graph must succeed
	acyclicGraph := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "condition", "label": "Check Amount", "data": {"field": "amount", "operator": "greater_than", "value": "100"}},
			{"id": "n3", "type": "log_note", "label": "High Value", "data": {"note": "High"}},
			{"id": "n4", "type": "log_note", "label": "Normal Value", "data": {"note": "Normal"}}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"},
			{"id": "e2", "source": "n2", "target": "n3", "sourceHandle": "true"},
			{"id": "e3", "source": "n2", "target": "n4", "sourceHandle": "false"}
		]
	}`)
	if err := svc.ValidateDefinition(acyclicGraph); err != nil {
		t.Fatalf("expected valid acyclic graph to pass, got: %v", err)
	}
}

// TestNodeLevelValidation verifies node configuration validation
func TestNodeLevelValidation(t *testing.T) {
	svc := services.NewWorkflowService(nil, nil, nil, nil, nil)

	// Condition node with missing field
	invalidCondition := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "condition", "label": "Condition", "data": {"operator": "equals", "value": "10"}}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"}
		]
	}`)
	if err := svc.ValidateDefinition(invalidCondition); err == nil {
		t.Errorf("expected error on condition node with missing field, got nil")
	}

	// Validate fields node with empty requiredFields
	invalidValidateFields := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "validate_fields", "label": "Validator", "data": {"requiredFields": []}}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"}
		]
	}`)
	if err := svc.ValidateDefinition(invalidValidateFields); err == nil {
		t.Errorf("expected error on validate_fields with empty requiredFields, got nil")
	}

	// Unsupported node type
	invalidType := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "unknown_ai_bot_hack", "label": "Unknown"}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"}
		]
	}`)
	if err := svc.ValidateDefinition(invalidType); err == nil {
		t.Errorf("expected error on unsupported node type, got nil")
	}
}

// TestDryRunConditionBranching verifies that dry run simulation evaluates conditions and logs steps
func TestDryRunConditionBranching(t *testing.T) {
	svc := services.NewWorkflowService(nil, nil, nil, nil, nil)

	validDef := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "validate_fields", "label": "Validate Name", "data": {"requiredFields": ["customerName"]}},
			{"id": "n3", "type": "condition", "label": "Check VIP", "data": {"field": "isVIP", "operator": "equals", "value": "true"}},
			{"id": "n4", "type": "log_note", "label": "Success Note", "data": {"note": "Pipeline verified"}}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"},
			{"id": "e2", "source": "n2", "target": "n3"},
			{"id": "e3", "source": "n3", "target": "n4"}
		]
	}`)

	// Passing simulation
	resp, err := svc.DryRun(context.Background(), models.DryRunRequest{
		Definition: validDef,
		SampleInput: map[string]interface{}{
			"customerName": "Acme Corp",
			"isVIP":        "true",
		},
	})
	if err != nil {
		t.Fatalf("dry run failed unexpectedly: %v", err)
	}
	if !resp.Success {
		t.Fatalf("expected dry run success, got false")
	}
	if len(resp.StepResults) != 4 {
		t.Fatalf("expected 4 simulated steps, got %d", len(resp.StepResults))
	}

	// Failing simulation (missing required field)
	failResp, err := svc.DryRun(context.Background(), models.DryRunRequest{
		Definition: validDef,
		SampleInput: map[string]interface{}{
			"isVIP": "true",
		},
	})
	if err != nil {
		t.Fatalf("dry run failed unexpectedly: %v", err)
	}
	if failResp.Success {
		t.Fatalf("expected dry run to report failure for missing required field, got true")
	}
}

// TestExecutionModelVersionPinning verifies version pinning and retry policy structs
func TestExecutionModelVersionPinning(t *testing.T) {
	pinnedDef := json.RawMessage(`{"nodes": [{"id": "n1", "type": "trigger", "label": "Start"}], "edges": []}`)
	ex := models.WorkflowExecution{
		ID:               uuid.New(),
		WorkflowID:       uuid.New(),
		Status:           models.WorkflowStatusRunning,
		VersionNumber:    3,
		PinnedDefinition: pinnedDef,
		TriggerSource:    models.TriggerWebhook,
	}

	if ex.VersionNumber != 3 {
		t.Errorf("expected version number 3, got %d", ex.VersionNumber)
	}
	if len(ex.PinnedDefinition) == 0 {
		t.Errorf("expected non-empty pinned definition")
	}

	step := models.WorkflowStepExecution{
		ID:          uuid.New(),
		ExecutionID: ex.ID,
		NodeID:      "n1",
		NodeType:    "trigger",
		Status:      models.StepStatusCompleted,
		Attempt:     2,
		MaxRetries:  3,
		RetryPolicy: json.RawMessage(`{"maxAttempts": 3, "initialBackoffMs": 500, "backoffMultiplier": 2.0}`),
	}

	if step.Attempt != 2 {
		t.Errorf("expected attempt 2, got %d", step.Attempt)
	}
	if step.MaxRetries != 3 {
		t.Errorf("expected maxRetries 3, got %d", step.MaxRetries)
	}
}
