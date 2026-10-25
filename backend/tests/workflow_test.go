package tests

import (
	"context"
	"encoding/json"
	"testing"

	"docora/backend/internal/models"
	"docora/backend/internal/services"
)

func TestWorkflowDefinitionValidation(t *testing.T) {
	svc := services.NewWorkflowService(nil, nil, nil, nil, nil)

	// Test 1: Empty definition fails
	if err := svc.ValidateDefinition(json.RawMessage("")); err == nil {
		t.Errorf("expected error on empty definition, got nil")
	}

	// Test 2: Definition with no nodes fails
	emptyNodesDef := json.RawMessage(`{"nodes":[], "edges":[]}`)
	if err := svc.ValidateDefinition(emptyNodesDef); err == nil {
		t.Errorf("expected error on definition with no nodes, got nil")
	}

	// Test 3: Definition with invalid edge target fails
	invalidEdgeDef := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n_missing"}
		]
	}`)
	if err := svc.ValidateDefinition(invalidEdgeDef); err == nil {
		t.Errorf("expected error on edge pointing to non-existent node, got nil")
	}

	// Test 4: Valid definition passes
	validDef := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Start"},
			{"id": "n2", "type": "generate_receipt", "label": "Receipt"}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"}
		]
	}`)
	if err := svc.ValidateDefinition(validDef); err != nil {
		t.Errorf("expected valid definition to pass, got: %v", err)
	}
}

func TestWorkflowDryRunSimulation(t *testing.T) {
	svc := services.NewWorkflowService(nil, nil, nil, nil, nil)

	defJSON := json.RawMessage(`{
		"nodes": [
			{"id": "n1", "type": "trigger", "label": "Manual Start"},
			{"id": "n2", "type": "validate_fields", "label": "Validate Client", "data": {"requiredFields": ["customerName"]}},
			{"id": "n3", "type": "condition", "label": "Amount Check", "data": {"field": "amount", "operator": "greater_than", "value": "100"}},
			{"id": "n4", "type": "generate_invoice", "label": "Generate Invoice"}
		],
		"edges": [
			{"id": "e1", "source": "n1", "target": "n2"},
			{"id": "e2", "source": "n2", "target": "n3"},
			{"id": "e3", "source": "n3", "target": "n4", "sourceHandle": "true"}
		]
	}`)

	// Case A: Missing required field fails simulation gracefully
	resFail, err := svc.DryRun(context.Background(), models.DryRunRequest{
		Definition:  defJSON,
		SampleInput: map[string]interface{}{"amount": 250}, // missing customerName
	})
	if err != nil {
		t.Fatalf("dry run returned unexpected fatal error: %v", err)
	}
	if resFail.Success {
		t.Errorf("expected dry run to fail when required field is missing")
	}

	// Case B: Valid input succeeds and returns simulated outputs
	resPass, err := svc.DryRun(context.Background(), models.DryRunRequest{
		Definition: defJSON,
		SampleInput: map[string]interface{}{
			"customerName": "Acme Corp",
			"amount":       250,
		},
	})
	if err != nil {
		t.Fatalf("dry run returned unexpected fatal error: %v", err)
	}
	if !resPass.Success {
		t.Errorf("expected dry run to pass with valid inputs")
	}
	if len(resPass.StepResults) != 4 {
		t.Errorf("expected 4 step results in dry run, got %d", len(resPass.StepResults))
	}
}

func TestBuiltInTemplatesLibrary(t *testing.T) {
	svc := services.NewWorkflowService(nil, nil, nil, nil, nil)
	templates := svc.GetTemplates()

	if len(templates) < 15 {
		t.Errorf("expected at least 15 production templates, got %d", len(templates))
	}

	for _, tpl := range templates {
		if tpl.ID == "" {
			t.Errorf("template missing ID")
		}
		if tpl.Name == "" {
			t.Errorf("template %s missing name", tpl.ID)
		}
		if len(tpl.Definition.Nodes) == 0 {
			t.Errorf("template %s has no nodes", tpl.ID)
		}

		// Ensure definition JSON is valid
		defBytes, err := json.Marshal(tpl.Definition)
		if err != nil {
			t.Errorf("template %s definition failed to marshal: %v", tpl.ID, err)
		}
		if err := svc.ValidateDefinition(defBytes); err != nil {
			t.Errorf("template %s definition is invalid: %v", tpl.ID, err)
		}
	}
}
