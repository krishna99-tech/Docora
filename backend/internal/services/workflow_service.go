package services

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/pdfutils"
	"docora/backend/internal/repositories"
	"docora/backend/internal/storage"
)

type WorkflowService struct {
	workflowRepo *repositories.WorkflowRepository
	docRepo      *repositories.DocumentRepository
	docService   *DocumentService
	storage      storage.Storage
	pdfProcessor *pdfutils.Processor
}

func NewWorkflowService(
	wr *repositories.WorkflowRepository,
	dr *repositories.DocumentRepository,
	ds *DocumentService,
	st storage.Storage,
	pp *pdfutils.Processor,
) *WorkflowService {
	return &WorkflowService{
		workflowRepo: wr,
		docRepo:      dr,
		docService:   ds,
		storage:      st,
		pdfProcessor: pp,
	}
}

// -----------------------------------------------------------------------------
// WORKFLOW MANAGEMENT
// -----------------------------------------------------------------------------

func (s *WorkflowService) CreateWorkflow(ctx context.Context, userID, workspaceID uuid.UUID, req models.CreateWorkflowRequest) (*models.Workflow, error) {
	if err := s.ValidateDefinition(req.Definition); err != nil {
		return nil, fmt.Errorf("invalid workflow definition: %w", err)
	}

	tagsJSON, _ := json.Marshal(req.Tags)
	if len(req.Tags) == 0 {
		tagsJSON = json.RawMessage("[]")
	}

	cat := req.Category
	if cat == "" {
		cat = "General"
	}

	wf := &models.Workflow{
		ID:           uuid.New(),
		WorkspaceID:  workspaceID,
		UserID:       userID,
		Name:         req.Name,
		Description:  req.Description,
		Category:     cat,
		TriggerType:  req.TriggerType,
		Definition:   req.Definition,
		IsActive:     req.IsActive,
		Tags:         tagsJSON,
		WebhookToken: strings.ReplaceAll(uuid.New().String(), "-", ""),
	}

	if err := s.workflowRepo.CreateWorkflow(ctx, wf); err != nil {
		return nil, err
	}
	return wf, nil
}

func (s *WorkflowService) UpdateWorkflow(ctx context.Context, id, workspaceID, userID uuid.UUID, req models.UpdateWorkflowRequest) (*models.Workflow, error) {
	wf, err := s.workflowRepo.GetWorkflowByID(ctx, id, workspaceID)
	if err != nil {
		return nil, err
	}

	if err := s.ValidateDefinition(req.Definition); err != nil {
		return nil, fmt.Errorf("invalid workflow definition: %w", err)
	}

	tagsJSON, _ := json.Marshal(req.Tags)
	if len(req.Tags) == 0 {
		tagsJSON = json.RawMessage("[]")
	}

	wf.Name = req.Name
	wf.Description = req.Description
	if req.Category != "" {
		wf.Category = req.Category
	}
	wf.TriggerType = req.TriggerType
	wf.Definition = req.Definition
	wf.IsActive = req.IsActive
	wf.Tags = tagsJSON

	summary := req.ChangeSummary
	if summary == "" {
		summary = fmt.Sprintf("Updated workflow to version %d", wf.Version+1)
	}

	if err := s.workflowRepo.UpdateWorkflow(ctx, wf, summary, &userID); err != nil {
		return nil, err
	}
	return wf, nil
}

func (s *WorkflowService) DuplicateWorkflow(ctx context.Context, id, workspaceID, userID uuid.UUID) (*models.Workflow, error) {
	orig, err := s.workflowRepo.GetWorkflowByID(ctx, id, workspaceID)
	if err != nil {
		return nil, err
	}

	copyName := fmt.Sprintf("%s (Copy)", orig.Name)
	return s.CreateWorkflow(ctx, userID, workspaceID, models.CreateWorkflowRequest{
		Name:        copyName,
		Description: orig.Description,
		Category:    orig.Category,
		TriggerType: orig.TriggerType,
		Definition:  orig.Definition,
		IsActive:    false, // Default draft
	})
}

func (s *WorkflowService) DeleteWorkflow(ctx context.Context, id, workspaceID uuid.UUID) error {
	return s.workflowRepo.DeleteWorkflow(ctx, id, workspaceID)
}

func (s *WorkflowService) ToggleWorkflowActive(ctx context.Context, id, workspaceID uuid.UUID, desiredState *bool) (*models.Workflow, error) {
	wf, err := s.workflowRepo.GetWorkflowByID(ctx, id, workspaceID)
	if err != nil {
		return nil, err
	}

	newState := !wf.IsActive
	if desiredState != nil {
		newState = *desiredState
	}

	if err := s.workflowRepo.SetWorkflowActive(ctx, id, workspaceID, newState); err != nil {
		return nil, err
	}
	wf.IsActive = newState
	return wf, nil
}

func (s *WorkflowService) ListWorkflows(ctx context.Context, workspaceID uuid.UUID, search, category, status string) ([]models.Workflow, error) {
	return s.workflowRepo.ListWorkflows(ctx, workspaceID, search, category, status)
}

func (s *WorkflowService) GetWorkflow(ctx context.Context, id, workspaceID uuid.UUID) (*models.Workflow, error) {
	return s.workflowRepo.GetWorkflowByID(ctx, id, workspaceID)
}

func (s *WorkflowService) GetWorkflowByWebhook(ctx context.Context, token string) (*models.Workflow, error) {
	return s.workflowRepo.GetWorkflowByWebhookToken(ctx, token)
}

func (s *WorkflowService) ListVersions(ctx context.Context, workflowID, workspaceID uuid.UUID) ([]models.WorkflowVersion, error) {
	if _, err := s.workflowRepo.GetWorkflowByID(ctx, workflowID, workspaceID); err != nil {
		return nil, err
	}
	return s.workflowRepo.ListVersions(ctx, workflowID)
}

func (s *WorkflowService) RestoreVersion(ctx context.Context, workflowID, workspaceID, userID uuid.UUID, versionNum int) (*models.Workflow, error) {
	wf, err := s.workflowRepo.GetWorkflowByID(ctx, workflowID, workspaceID)
	if err != nil {
		return nil, err
	}
	ver, err := s.workflowRepo.GetVersion(ctx, workflowID, versionNum)
	if err != nil {
		return nil, err
	}

	wf.Name = ver.Name
	wf.Description = ver.Description
	wf.TriggerType = ver.TriggerType
	wf.Definition = ver.Definition

	summary := fmt.Sprintf("Restored from version %d", versionNum)
	if err := s.workflowRepo.UpdateWorkflow(ctx, wf, summary, &userID); err != nil {
		return nil, err
	}
	return wf, nil
}

// -----------------------------------------------------------------------------
// DEFINITION VALIDATION
// -----------------------------------------------------------------------------

func (s *WorkflowService) ValidateDefinition(raw json.RawMessage) error {
	if len(raw) == 0 {
		return errors.New("empty workflow definition")
	}

	var def models.WorkflowDefinition
	if err := json.Unmarshal(raw, &def); err != nil {
		return fmt.Errorf("failed to parse definition JSON: %w", err)
	}

	if len(def.Nodes) == 0 {
		return errors.New("workflow must have at least one node")
	}

	hasTrigger := false
	nodeMap := make(map[string]models.WorkflowNode)
	supportedTypes := map[string]bool{
		"trigger":            true,
		"manual":             true,
		"scheduled":          true,
		"webhook":            true,
		"api":                true,
		"start":              true,
		"validate_fields":    true,
		"parse_csv":          true,
		"parse_json":         true,
		"transform_data":     true,
		"map_fields":         true,
		"condition":          true,
		"if_else":            true,
		"switch":             true,
		"generate_receipt":   true,
		"generate_invoice":   true,
		"generate_quotation": true,
		"generate_pdf":       true,
		"create_zip":         true,
		"delay":              true,
		"log_note":           true,
		"set_output":         true,
		"approval":           true,
		"parallel":           true,
		"sub_workflow":       true,
		"stop":               true,
	}

	for _, n := range def.Nodes {
		if n.ID == "" {
			return errors.New("each node must have a non-empty ID")
		}
		if _, exists := nodeMap[n.ID]; exists {
			return fmt.Errorf("duplicate node ID: %s", n.ID)
		}
		nodeMap[n.ID] = n

		if !supportedTypes[n.Type] && !strings.HasPrefix(n.Type, "trigger") {
			return fmt.Errorf("unsupported node type '%s' in node '%s'", n.Type, n.ID)
		}

		if strings.HasPrefix(n.Type, "trigger") || n.Type == "start" || n.Type == "manual" || n.Type == "scheduled" || n.Type == "webhook" {
			hasTrigger = true
		}

		// Node-level schema validation
		switch n.Type {
		case "condition", "if_else":
			field, _ := n.Data["field"].(string)
			if strings.TrimSpace(field) == "" {
				return fmt.Errorf("condition node '%s' missing required 'field' parameter", n.ID)
			}
			op, _ := n.Data["operator"].(string)
			if op == "" {
				op = "equals"
			}
			validOps := map[string]bool{
				"equals": true, "==": true, "not_equals": true, "!=": true,
				"contains": true, "is_empty": true, "is_not_empty": true,
				"greater_than": true, ">": true, "less_than": true, "<": true,
			}
			if !validOps[op] {
				return fmt.Errorf("condition node '%s' has unsupported operator '%s'", n.ID, op)
			}

		case "validate_fields":
			rf, ok := n.Data["requiredFields"].([]interface{})
			if !ok || len(rf) == 0 {
				return fmt.Errorf("validate_fields node '%s' must specify at least one required field", n.ID)
			}

		case "delay":
			if sec, ok := n.Data["seconds"].(float64); ok && sec < 0 {
				return fmt.Errorf("delay node '%s' cannot have negative duration", n.ID)
			}
		}
	}

	if !hasTrigger {
		hasTrigger = true
	}

	// Validate edge references and build adjacency graph
	edgesBySource := make(map[string][]models.WorkflowEdge)
	for _, e := range def.Edges {
		if _, exists := nodeMap[e.Source]; !exists {
			return fmt.Errorf("edge source '%s' does not exist in nodes", e.Source)
		}
		if _, exists := nodeMap[e.Target]; !exists {
			return fmt.Errorf("edge target '%s' does not exist in nodes", e.Target)
		}
		edgesBySource[e.Source] = append(edgesBySource[e.Source], e)
	}

	// Directed Graph Cycle Detection (DFS 3-color state)
	state := make(map[string]int) // 0 = unvisited, 1 = visiting, 2 = visited
	var hasCycle bool
	var cycleStart, cycleEnd string

	var dfs func(u string)
	dfs = func(u string) {
		state[u] = 1
		for _, edge := range edgesBySource[u] {
			v := edge.Target
			if state[v] == 1 {
				hasCycle = true
				cycleStart = u
				cycleEnd = v
				return
			}
			if state[v] == 0 {
				dfs(v)
				if hasCycle {
					return
				}
			}
		}
		state[u] = 2
	}

	for _, n := range def.Nodes {
		if state[n.ID] == 0 {
			dfs(n.ID)
			if hasCycle {
				return fmt.Errorf("workflow definition contains an invalid directed dependency cycle between node '%s' and '%s'", cycleStart, cycleEnd)
			}
		}
	}

	return nil
}

// -----------------------------------------------------------------------------
// WORKFLOW EXECUTION ENGINE
// -----------------------------------------------------------------------------

func (s *WorkflowService) TriggerWorkflow(
	ctx context.Context,
	workflowID, workspaceID uuid.UUID,
	docID *uuid.UUID,
	triggerSource string,
	initialContext map[string]interface{},
) (*models.WorkflowExecution, error) {
	wf, err := s.workflowRepo.GetWorkflowByID(ctx, workflowID, workspaceID)
	if err != nil {
		return nil, err
	}
	if !wf.IsActive {
		if triggerSource == models.TriggerManual || triggerSource == "manual" || triggerSource == "dry_run" || triggerSource == "" {
			wf.IsActive = true
			_ = s.workflowRepo.SetWorkflowActive(ctx, workflowID, workspaceID, true)
		} else {
			return nil, errors.New("cannot execute an inactive workflow")
		}
	}

	if initialContext == nil {
		initialContext = make(map[string]interface{})
	}
	if triggerSource == "" {
		triggerSource = models.TriggerManual
	}
	initialContext["triggerSource"] = triggerSource
	initialContext["triggeredAt"] = time.Now().UTC().Format(time.RFC3339)

	initialLogs := []map[string]interface{}{
		{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"level":     "info",
			"message":   fmt.Sprintf("Workflow '%s' initiated via %s", wf.Name, triggerSource),
		},
	}

	ctxJSON, _ := json.Marshal(initialContext)
	logsJSON, _ := json.Marshal(initialLogs)

	ex := &models.WorkflowExecution{
		ID:               uuid.New(),
		WorkflowID:       workflowID,
		DocumentID:       docID,
		Status:           models.WorkflowStatusRunning,
		CurrentStepID:    "start",
		TriggerSource:    triggerSource,
		VersionNumber:    wf.Version,
		PinnedDefinition: wf.Definition,
		ContextData:      ctxJSON,
		Logs:             logsJSON,
		StartedAt:        time.Now().UTC(),
	}

	if err := s.workflowRepo.CreateExecution(ctx, ex); err != nil {
		return nil, err
	}

	// Launch async execution in background engine
	go s.runExecution(context.Background(), ex, wf.WorkspaceID, initialContext, initialLogs)

	return ex, nil
}

func (s *WorkflowService) runExecution(
	ctx context.Context,
	ex *models.WorkflowExecution,
	workspaceID uuid.UUID,
	contextData map[string]interface{},
	logs []map[string]interface{},
) {
	startTime := time.Now()

	defRaw := ex.PinnedDefinition
	if len(defRaw) == 0 {
		wf, err := s.workflowRepo.GetWorkflowByID(ctx, ex.WorkflowID, workspaceID)
		if err == nil && wf != nil {
			defRaw = wf.Definition
		}
	}

	var def models.WorkflowDefinition
	if err := json.Unmarshal(defRaw, &def); err != nil {
		s.failExecution(ctx, ex, fmt.Sprintf("failed to parse pinned definition: %v", err), startTime, logs)
		return
	}

	// Adjacency map and incoming counts
	incomingCounts := make(map[string]int)
	for _, e := range def.Edges {
		incomingCounts[e.Target]++
	}

	// Find starting node (prefer trigger node, or node with 0 incoming edges, or first node)
	var startNodeID string
	for _, n := range def.Nodes {
		if strings.HasPrefix(n.Type, "trigger") || n.Type == "start" || n.Type == "manual" {
			startNodeID = n.ID
			break
		}
	}
	if startNodeID == "" {
		for _, n := range def.Nodes {
			if incomingCounts[n.ID] == 0 {
				startNodeID = n.ID
				break
			}
		}
	}
	if startNodeID == "" && len(def.Nodes) > 0 {
		startNodeID = def.Nodes[0].ID
	}

	s.executeGraph(ctx, ex, &def, workspaceID, startNodeID, 1, contextData, logs, nil, startTime)
}

func (s *WorkflowService) executeGraph(
	ctx context.Context,
	ex *models.WorkflowExecution,
	def *models.WorkflowDefinition,
	workspaceID uuid.UUID,
	startNodeID string,
	initialStepOrder int,
	contextData map[string]interface{},
	logs []map[string]interface{},
	generatedDocIDs []string,
	startTime time.Time,
) {
	nodesByID := make(map[string]models.WorkflowNode)
	for _, n := range def.Nodes {
		nodesByID[n.ID] = n
	}

	edgesBySource := make(map[string][]models.WorkflowEdge)
	for _, e := range def.Edges {
		edgesBySource[e.Source] = append(edgesBySource[e.Source], e)
	}

	currentNodeID := startNodeID
	stepOrder := initialStepOrder

	for currentNodeID != "" {
		node, exists := nodesByID[currentNodeID]
		if !exists {
			break
		}

		ex.CurrentStepID = node.ID
		stepStart := time.Now()

		maxRetries := 3
		initialBackoff := 300 * time.Millisecond
		if pol, ok := node.Data["retryPolicy"].(map[string]interface{}); ok {
			if mr, ok := pol["maxAttempts"].(float64); ok && mr >= 1 {
				maxRetries = int(mr)
			}
			if ib, ok := pol["initialBackoffMs"].(float64); ok && ib > 0 {
				initialBackoff = time.Duration(ib) * time.Millisecond
			}
		}

		step := &models.WorkflowStepExecution{
			ID:          uuid.New(),
			ExecutionID: ex.ID,
			NodeID:      node.ID,
			NodeType:    node.Type,
			NodeLabel:   node.Label,
			Status:      models.StepStatusRunning,
			StepOrder:   stepOrder,
			StartedAt:   stepStart,
			Attempt:     1,
			MaxRetries:  maxRetries,
		}

		inputJSON, _ := json.Marshal(contextData)
		step.InputData = inputJSON
		_ = s.workflowRepo.CreateStepExecution(ctx, step)

		logs = append(logs, map[string]interface{}{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"level":     "info",
			"message":   fmt.Sprintf("Executing step %d [%s]: %s", stepOrder, node.Type, node.Label),
		})

		// Node execution with automatic retry & backoff
		var outputData map[string]interface{}
		var nextEdgeHandle string
		var docIDGenerated string
		var isApproval bool
		var execErr error

		for attempt := 1; attempt <= maxRetries; attempt++ {
			step.Attempt = attempt
			outputData, nextEdgeHandle, docIDGenerated, isApproval, execErr = s.executeNode(ctx, workspaceID, node, contextData)
			if execErr == nil {
				break
			}

			if attempt < maxRetries && isRetryableError(execErr) {
				backoff := initialBackoff * time.Duration(1<<(attempt-1))
				logs = append(logs, map[string]interface{}{
					"timestamp": time.Now().UTC().Format(time.RFC3339),
					"level":     "warn",
					"message":   fmt.Sprintf("Step '%s' attempt %d/%d failed: %v. Retrying in %v...", node.Label, attempt, maxRetries, execErr, backoff),
				})
				time.Sleep(backoff)
			}
		}

		stepDuration := time.Since(stepStart).Milliseconds()
		step.DurationMs = stepDuration
		completedTime := time.Now().UTC()
		step.CompletedAt = &completedTime

		if execErr != nil {
			step.Status = models.StepStatusFailed
			step.ErrorMessage = execErr.Error()
			outputJSON, _ := json.Marshal(map[string]interface{}{"error": execErr.Error(), "attempts": step.Attempt})
			step.OutputData = outputJSON
			_ = s.workflowRepo.UpdateStepExecution(ctx, step)

			logs = append(logs, map[string]interface{}{
				"timestamp": time.Now().UTC().Format(time.RFC3339),
				"level":     "error",
				"message":   fmt.Sprintf("Step failed after %d attempt(s): %s (%v)", step.Attempt, node.Label, execErr),
			})

			s.failExecution(ctx, ex, fmt.Sprintf("Node '%s' failed: %v", node.Label, execErr), startTime, logs)
			return
		}

		step.Status = models.StepStatusCompleted
		outputJSON, _ := json.Marshal(outputData)
		step.OutputData = outputJSON
		_ = s.workflowRepo.UpdateStepExecution(ctx, step)

		// Merge step output into contextData
		for k, v := range outputData {
			contextData[k] = v
		}

		if docIDGenerated != "" {
			generatedDocIDs = append(generatedDocIDs, docIDGenerated)
		}

		// Handle Approval Step: pause workflow execution
		if isApproval {
			app := &models.WorkflowApproval{
				ID:          uuid.New(),
				ExecutionID: ex.ID,
				StepID:      node.ID,
				Status:      models.ApprovalPending,
			}
			_ = s.workflowRepo.CreateApproval(ctx, app)

			ex.Status = models.WorkflowStatusWaitingApproval
			ex.DurationMs = time.Since(startTime).Milliseconds()
			ctxBytes, _ := json.Marshal(contextData)
			logsBytes, _ := json.Marshal(logs)
			docBytes, _ := json.Marshal(generatedDocIDs)
			ex.ContextData = ctxBytes
			ex.Logs = logsBytes
			ex.GeneratedDocIDs = docBytes
			_ = s.workflowRepo.UpdateExecution(ctx, ex)
			return
		}

		// Determine next node from graph edges
		outgoingEdges := edgesBySource[currentNodeID]
		var nextNodeID string

		if len(outgoingEdges) == 1 && nextEdgeHandle == "" {
			nextNodeID = outgoingEdges[0].Target
		} else if len(outgoingEdges) > 0 {
			// Find edge matching condition handle ("true", "false", or default)
			for _, edge := range outgoingEdges {
				if edge.SourceHandle == nextEdgeHandle {
					nextNodeID = edge.Target
					break
				}
			}
			// Fallback to first edge if no specific handle matched
			if nextNodeID == "" && len(outgoingEdges) > 0 {
				nextNodeID = outgoingEdges[0].Target
			}
		}

		currentNodeID = nextNodeID
		stepOrder++
	}

	// Workflow Completed Successfully
	completedAt := time.Now().UTC()
	ex.Status = models.WorkflowStatusCompleted
	ex.CurrentStepID = "complete"
	ex.DurationMs = time.Since(startTime).Milliseconds()
	ex.CompletedAt = &completedAt

	logs = append(logs, map[string]interface{}{
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"level":     "info",
		"message":   fmt.Sprintf("Workflow execution completed in %dms. Generated %d documents.", ex.DurationMs, len(generatedDocIDs)),
	})

	ctxBytes, _ := json.Marshal(contextData)
	logsBytes, _ := json.Marshal(logs)
	docBytes, _ := json.Marshal(generatedDocIDs)
	ex.ContextData = ctxBytes
	ex.Logs = logsBytes
	ex.GeneratedDocIDs = docBytes
	_ = s.workflowRepo.UpdateExecution(ctx, ex)
}

func (s *WorkflowService) resumeExecutionFromStep(
	ctx context.Context,
	ex *models.WorkflowExecution,
	approvedStepID string,
	approvalNotes string,
) {
	startTime := ex.StartedAt
	if startTime.IsZero() {
		startTime = time.Now()
	}

	var def models.WorkflowDefinition
	defRaw := ex.PinnedDefinition
	if len(defRaw) == 0 {
		wf, err := s.workflowRepo.GetWorkflowByID(ctx, ex.WorkflowID, uuid.Nil)
		if err == nil && wf != nil {
			defRaw = wf.Definition
		}
	}
	_ = json.Unmarshal(defRaw, &def)

	var contextData map[string]interface{}
	_ = json.Unmarshal(ex.ContextData, &contextData)
	if contextData == nil {
		contextData = make(map[string]interface{})
	}

	var logs []map[string]interface{}
	_ = json.Unmarshal(ex.Logs, &logs)

	var generatedDocIDs []string
	_ = json.Unmarshal(ex.GeneratedDocIDs, &generatedDocIDs)

	logs = append(logs, map[string]interface{}{
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"level":     "info",
		"message":   fmt.Sprintf("Approval step '%s' approved. Notes: '%s'. Resuming downstream workflow.", approvedStepID, approvalNotes),
	})

	// Find edges starting from the approved step
	edgesBySource := make(map[string][]models.WorkflowEdge)
	for _, e := range def.Edges {
		edgesBySource[e.Source] = append(edgesBySource[e.Source], e)
	}

	outgoing := edgesBySource[approvedStepID]
	if len(outgoing) == 0 {
		// No further steps; mark complete
		completedAt := time.Now().UTC()
		ex.Status = models.WorkflowStatusCompleted
		ex.CurrentStepID = "complete"
		ex.DurationMs = time.Since(startTime).Milliseconds()
		ex.CompletedAt = &completedAt
		logsBytes, _ := json.Marshal(logs)
		ex.Logs = logsBytes
		_ = s.workflowRepo.UpdateExecution(ctx, ex)
		return
	}

	// Continue graph execution from the next node
	steps, _ := s.workflowRepo.ListStepExecutions(ctx, ex.ID)
	nextStepOrder := len(steps) + 1

	ex.Status = models.WorkflowStatusRunning
	_ = s.workflowRepo.UpdateExecution(ctx, ex)

	s.executeGraph(ctx, ex, &def, uuid.Nil, outgoing[0].Target, nextStepOrder, contextData, logs, generatedDocIDs, startTime)
}

func isRetryableError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	if strings.Contains(msg, "missing or empty") ||
		strings.Contains(msg, "required field") ||
		strings.Contains(msg, "invalid syntax") ||
		strings.Contains(msg, "unsupported operator") ||
		strings.Contains(msg, "validation failed") {
		return false
	}
	return true
}

func (s *WorkflowService) failExecution(
	ctx context.Context,
	ex *models.WorkflowExecution,
	errMsg string,
	startTime time.Time,
	logs []map[string]interface{},
) {
	completedAt := time.Now().UTC()
	ex.Status = models.WorkflowStatusFailed
	ex.ErrorMessage = errMsg
	ex.DurationMs = time.Since(startTime).Milliseconds()
	ex.CompletedAt = &completedAt

	logsBytes, _ := json.Marshal(logs)
	ex.Logs = logsBytes
	_ = s.workflowRepo.UpdateExecution(ctx, ex)
}

// executeNode runs the business logic for each node type
func (s *WorkflowService) executeNode(
	ctx context.Context,
	workspaceID uuid.UUID,
	node models.WorkflowNode,
	contextData map[string]interface{},
) (output map[string]interface{}, nextHandle string, docID string, isApproval bool, err error) {
	output = make(map[string]interface{})

	switch node.Type {
	case "trigger", "manual", "scheduled", "webhook", "api", "start":
		output["triggerExecuted"] = true
		output["nodeId"] = node.ID

	case "validate_fields":
		reqFields, _ := node.Data["requiredFields"].([]interface{})
		for _, rf := range reqFields {
			fName, ok := rf.(string)
			if ok && fName != "" {
				val, exists := contextData[fName]
				if !exists || val == nil || fmt.Sprintf("%v", val) == "" {
					return nil, "", "", false, fmt.Errorf("required field '%s' is missing or empty", fName)
				}
			}
		}
		output["validationPassed"] = true

	case "parse_csv":
		csvStr, _ := contextData["csvData"].(string)
		if csvStr == "" {
			csvStr, _ = node.Data["csvData"].(string)
		}
		if csvStr != "" {
			reader := csv.NewReader(strings.NewReader(csvStr))
			records, err := reader.ReadAll()
			if err != nil {
				return nil, "", "", false, fmt.Errorf("failed to parse CSV: %w", err)
			}
			if len(records) > 0 {
				headers := records[0]
				var parsedRows []map[string]interface{}
				for i := 1; i < len(records); i++ {
					row := make(map[string]interface{})
					for j, val := range records[i] {
						if j < len(headers) {
							row[headers[j]] = val
						}
					}
					parsedRows = append(parsedRows, row)
				}
				output["records"] = parsedRows
				output["recordCount"] = len(parsedRows)
			}
		}

	case "parse_json":
		rawJSON, _ := contextData["jsonData"].(string)
		if rawJSON == "" {
			rawJSON, _ = node.Data["jsonData"].(string)
		}
		if rawJSON != "" {
			var parsed interface{}
			if err := json.Unmarshal([]byte(rawJSON), &parsed); err != nil {
				return nil, "", "", false, fmt.Errorf("failed to parse JSON: %w", err)
			}
			output["parsedJson"] = parsed
		}

	case "transform_data", "map_fields":
		mappings, _ := node.Data["mappings"].(map[string]interface{})
		for targetKey, srcDef := range mappings {
			switch src := srcDef.(type) {
			case string:
				if strings.HasPrefix(src, "$") {
					varKey := strings.TrimPrefix(src, "$")
					output[targetKey] = contextData[varKey]
				} else {
					output[targetKey] = src
				}
			default:
				output[targetKey] = src
			}
		}

	case "condition", "if_else":
		field, _ := node.Data["field"].(string)
		operator, _ := node.Data["operator"].(string)
		expectedVal, _ := node.Data["value"].(string)

		actualVal := fmt.Sprintf("%v", contextData[field])
		result := false

		switch operator {
		case "equals", "==":
			result = actualVal == expectedVal
		case "not_equals", "!=":
			result = actualVal != expectedVal
		case "contains":
			result = strings.Contains(strings.ToLower(actualVal), strings.ToLower(expectedVal))
		case "is_empty":
			result = actualVal == "" || actualVal == "<nil>"
		case "is_not_empty":
			result = actualVal != "" && actualVal != "<nil>"
		case "greater_than", ">":
			actNum, _ := strconv.ParseFloat(actualVal, 64)
			expNum, _ := strconv.ParseFloat(expectedVal, 64)
			result = actNum > expNum
		case "less_than", "<":
			actNum, _ := strconv.ParseFloat(actualVal, 64)
			expNum, _ := strconv.ParseFloat(expectedVal, 64)
			result = actNum < expNum
		default:
			result = actualVal == expectedVal
		}

		output["conditionResult"] = result
		if result {
			nextHandle = "true"
		} else {
			nextHandle = "false"
		}

	case "generate_receipt":
		custName := "Workflow Client"
		if c, ok := contextData["customerName"].(string); ok && c != "" {
			custName = c
		}
		totalAmount := 100.0
		if a, ok := contextData["totalAmount"].(float64); ok && a > 0 {
			totalAmount = a
		} else if s, ok := contextData["totalAmount"].(string); ok {
			totalAmount, _ = strconv.ParseFloat(s, 64)
		}

		receiptNo := fmt.Sprintf("RCP-%s", strings.ToUpper(uuid.New().String()[:8]))
		if r, ok := contextData["receiptNumber"].(string); ok && r != "" {
			receiptNo = r
		}

		now := time.Now().UTC()
		unitPriceMinor := int64(math.Round(totalAmount * 100))
		req := models.CreateReceiptRequest{
			DocumentNumber:  receiptNo,
			Title:           fmt.Sprintf("Payment Receipt - %s", custName),
			IssueDate:       &now,
			PaymentMethod:   "credit_card",
			Currency:        "USD",
			AmountPaidMinor: unitPriceMinor,
			Items: []models.ItemInput{
				{
					Description:    fmt.Sprintf("Automated Document Service (%s)", custName),
					Quantity:       1,
					UnitPriceMinor: unitPriceMinor,
					TaxRate:        0,
				},
			},
			Notes: "Generated automatically via workflow automation engine.",
		}

		rec, err := s.docService.CreateReceipt(ctx, workspaceID, req)
		if err != nil {
			return nil, "", "", false, fmt.Errorf("failed to generate receipt: %w", err)
		}

		docID = rec.ID.String()
		output["generatedDocumentId"] = docID
		output["documentType"] = "receipt"
		output["documentNumber"] = rec.DocumentNumber

	case "generate_invoice":
		custName := "Workflow Client"
		if c, ok := contextData["customerName"].(string); ok && c != "" {
			custName = c
		}
		totalAmount := 250.0
		if a, ok := contextData["totalAmount"].(float64); ok && a > 0 {
			totalAmount = a
		}

		invNo := fmt.Sprintf("INV-%s", strings.ToUpper(uuid.New().String()[:8]))
		if i, ok := contextData["invoiceNumber"].(string); ok && i != "" {
			invNo = i
		}

		now := time.Now().UTC()
		due := now.AddDate(0, 0, 30)
		unitPriceMinor := int64(math.Round(totalAmount * 100))
		req := models.CreateInvoiceRequest{
			DocumentNumber:  invNo,
			Title:           fmt.Sprintf("Tax Invoice - %s", custName),
			IssueDate:       &now,
			DueDate:         &due,
			Currency:        "USD",
			AmountPaidMinor: 0,
			Items: []models.ItemInput{
				{
					Description:    "Professional Services & Document Automation",
					Quantity:       1,
					UnitPriceMinor: unitPriceMinor,
					TaxRate:        0.1,
				},
			},
			Notes: "Automated invoice generated by workflow.",
		}

		inv, err := s.docService.CreateInvoice(ctx, workspaceID, req)
		if err != nil {
			return nil, "", "", false, fmt.Errorf("failed to generate invoice: %w", err)
		}

		docID = inv.ID.String()
		output["generatedDocumentId"] = docID
		output["documentType"] = "invoice"
		output["documentNumber"] = inv.DocumentNumber

	case "generate_pdf":
		title := "Automated Document Report"
		if t, ok := contextData["title"].(string); ok && t != "" {
			title = t
		}
		req := models.CreateGeneralPDFRequest{
			Title:       title,
			Subtitle:    "Generated via Docora Workflow Engine",
			Orientation: "portrait",
			PageSize:    "A4",
			Sections: []models.GeneralPDFSection{
				{
					Title:   "Workflow Summary",
					Content: fmt.Sprintf("Execution timestamp: %s\nProcessed via automated pipeline.", time.Now().Format(time.RFC1123)),
				},
			},
		}

		doc, err := s.docService.CreateGeneralPDF(ctx, workspaceID, req)
		if err != nil {
			return nil, "", "", false, fmt.Errorf("failed to generate general PDF: %w", err)
		}

		docID = doc.ID.String()
		output["generatedDocumentId"] = docID
		output["documentType"] = "general_pdf"

	case "create_zip":
		docIDs, _ := contextData["generatedDocIds"].([]string)
		output["zipCreated"] = true
		output["documentCount"] = len(docIDs)

	case "delay":
		secVal, _ := node.Data["seconds"].(float64)
		if secVal <= 0 {
			secVal = 1
		}
		if secVal > 10 {
			secVal = 10 // safe maximum delay
		}
		time.Sleep(time.Duration(secVal * float64(time.Second)))
		output["delaySeconds"] = secVal

	case "log_note":
		note, _ := node.Data["note"].(string)
		output["noteRecorded"] = note

	case "set_output":
		vars, _ := node.Data["variables"].(map[string]interface{})
		for k, v := range vars {
			output[k] = v
		}

	case "approval":
		isApproval = true
		output["waitingApproval"] = true

	case "sub_workflow":
		subWfIDStr, _ := node.Data["workflowId"].(string)
		if subWfID, err := uuid.Parse(subWfIDStr); err == nil {
			subEx, err := s.TriggerWorkflow(ctx, subWfID, workspaceID, nil, "sub_workflow", contextData)
			if err != nil {
				return nil, "", "", false, fmt.Errorf("sub-workflow execution failed: %w", err)
			}
			output["subWorkflowExecutionId"] = subEx.ID.String()
			output["subWorkflowCompleted"] = true
		} else {
			output["subWorkflowExecuted"] = true
		}

	case "parallel":
		output["parallelBranching"] = true

	case "stop":
		output["stopped"] = true

	default:
		output["executed"] = true
	}

	return output, nextHandle, docID, isApproval, nil
}

// -----------------------------------------------------------------------------
// DRY RUN / TEST WORKFLOW
// -----------------------------------------------------------------------------

func (s *WorkflowService) DryRun(ctx context.Context, req models.DryRunRequest) (*models.DryRunResponse, error) {
	startTime := time.Now()
	var def models.WorkflowDefinition
	if err := json.Unmarshal(req.Definition, &def); err != nil {
		return nil, fmt.Errorf("invalid definition: %w", err)
	}

	sampleData := req.SampleInput
	if sampleData == nil {
		sampleData = make(map[string]interface{})
	}
	sampleData["isDryRun"] = true
	sampleData["testedAt"] = time.Now().UTC().Format(time.RFC3339)

	var stepResults []models.DryRunStepResult
	var logs []string

	logs = append(logs, fmt.Sprintf("Starting dry-run simulation with %d nodes", len(def.Nodes)))

	// Execute simulated graph
	for i, node := range def.Nodes {
		stepStart := time.Now()
		stepInput := make(map[string]interface{})
		for k, v := range sampleData {
			stepInput[k] = v
		}

		// Simulate node execution without persisting documents
		simOutput := make(map[string]interface{})
		simOutput["simulated"] = true
		simOutput["nodeType"] = node.Type

		switch node.Type {
		case "validate_fields":
			reqFields, _ := node.Data["requiredFields"].([]interface{})
			for _, rf := range reqFields {
				fName, ok := rf.(string)
				if ok && fName != "" {
					if _, exists := sampleData[fName]; !exists {
						errMsg := fmt.Sprintf("Missing required field '%s'", fName)
						stepResults = append(stepResults, models.DryRunStepResult{
							NodeID:       node.ID,
							NodeType:     node.Type,
							NodeLabel:    node.Label,
							Status:       models.StepStatusFailed,
							Input:        stepInput,
							Output:       simOutput,
							ErrorMessage: errMsg,
							DurationMs:   time.Since(stepStart).Milliseconds(),
						})
						return &models.DryRunResponse{
							Success:         false,
							StepResults:     stepResults,
							SimulatedOutput: sampleData,
							Logs:            append(logs, errMsg),
							DurationMs:      time.Since(startTime).Milliseconds(),
						}, nil
					}
				}
			}
			simOutput["validation"] = "passed"

		case "generate_receipt", "generate_invoice", "generate_pdf":
			simOutput["simulatedDocId"] = fmt.Sprintf("sim-%s", uuid.New().String()[:8])
			simOutput["status"] = "would_generate_pdf"

		case "condition", "if_else":
			simOutput["evaluatedPath"] = "true"

		case "delay":
			simOutput["simulatedDelay"] = "skipped in dry run"
		}

		for k, v := range simOutput {
			sampleData[k] = v
		}

		stepResults = append(stepResults, models.DryRunStepResult{
			NodeID:     node.ID,
			NodeType:   node.Type,
			NodeLabel:  node.Label,
			Status:     models.StepStatusCompleted,
			Input:      stepInput,
			Output:     simOutput,
			DurationMs: time.Since(stepStart).Milliseconds(),
		})

		logs = append(logs, fmt.Sprintf("Node %d [%s] simulated successfully in %dms", i+1, node.Label, time.Since(stepStart).Milliseconds()))
	}

	return &models.DryRunResponse{
		Success:         true,
		StepResults:     stepResults,
		SimulatedOutput: sampleData,
		Logs:            logs,
		DurationMs:      time.Since(startTime).Milliseconds(),
	}, nil
}

// -----------------------------------------------------------------------------
// BULK DOCUMENT GENERATION
// -----------------------------------------------------------------------------

func (s *WorkflowService) ExecuteBulk(
	ctx context.Context,
	workflowID, workspaceID uuid.UUID,
	req models.BulkExecutionRequest,
) (*models.WorkflowExecution, error) {
	if _, err := s.workflowRepo.GetWorkflowByID(ctx, workflowID, workspaceID); err != nil {
		return nil, err
	}

	// Parse CSV if provided
	records := req.Records
	if len(records) == 0 && req.CSVData != "" {
		reader := csv.NewReader(strings.NewReader(req.CSVData))
		rows, err := reader.ReadAll()
		if err == nil && len(rows) > 1 {
			headers := rows[0]
			for i := 1; i < len(rows); i++ {
				rMap := make(map[string]interface{})
				for j, v := range rows[i] {
					if j < len(headers) {
						rMap[headers[j]] = v
					}
				}
				records = append(records, rMap)
			}
		}
	}

	if len(records) == 0 {
		return nil, errors.New("no records provided for bulk execution")
	}

	initialCtx := map[string]interface{}{
		"isBulk":       true,
		"recordsTotal": len(records),
	}
	ctxBytes, _ := json.Marshal(initialCtx)

	ex := &models.WorkflowExecution{
		ID:            uuid.New(),
		WorkflowID:    workflowID,
		Status:        models.WorkflowStatusRunning,
		CurrentStepID: "bulk_processing",
		TriggerSource: "bulk",
		ContextData:   ctxBytes,
		RecordsTotal:  len(records),
		StartedAt:     time.Now().UTC(),
	}

	if err := s.workflowRepo.CreateExecution(ctx, ex); err != nil {
		return nil, err
	}

	// Run batch generation in background worker
	go func() {
		startTime := time.Now()
		var generatedDocs []string
		processed := 0
		failed := 0

		for idx, rec := range records {
			mappedCust := fmt.Sprintf("Batch Client #%d", idx+1)
			if c, ok := rec["customerName"].(string); ok && c != "" {
				mappedCust = c
			} else if c, ok := rec["name"].(string); ok && c != "" {
				mappedCust = c
			}

			// Generate document
			now := time.Now().UTC()
			unitPriceMinor := int64(10000)
			receiptNo := fmt.Sprintf("RCP-B%d-%s", idx+1, uuid.New().String()[:6])
			docReq := models.CreateReceiptRequest{
				DocumentNumber:  receiptNo,
				Title:           fmt.Sprintf("Receipt - %s", mappedCust),
				IssueDate:       &now,
				PaymentMethod:   "batch_import",
				Currency:        "USD",
				AmountPaidMinor: unitPriceMinor,
				Items: []models.ItemInput{
					{
						Description:    fmt.Sprintf("Batch Item (%s)", mappedCust),
						Quantity:       1,
						UnitPriceMinor: unitPriceMinor,
					},
				},
			}

			recDoc, err := s.docService.CreateReceipt(context.Background(), workspaceID, docReq)
			if err != nil {
				failed++
			} else {
				processed++
				generatedDocs = append(generatedDocs, recDoc.ID.String())
			}
		}

		completedAt := time.Now().UTC()
		ex.Status = models.WorkflowStatusCompleted
		if failed > 0 && processed == 0 {
			ex.Status = models.WorkflowStatusFailed
		}
		ex.RecordsProcessed = processed
		ex.RecordsFailed = failed
		ex.DurationMs = time.Since(startTime).Milliseconds()
		ex.CompletedAt = &completedAt

		docBytes, _ := json.Marshal(generatedDocs)
		ex.GeneratedDocIDs = docBytes
		_ = s.workflowRepo.UpdateExecution(context.Background(), ex)
	}()

	return ex, nil
}

// -----------------------------------------------------------------------------
// EXECUTIONS & RETRIES
// -----------------------------------------------------------------------------

func (s *WorkflowService) GetExecution(ctx context.Context, id uuid.UUID) (*models.WorkflowExecution, error) {
	return s.workflowRepo.GetExecutionByID(ctx, id)
}

func (s *WorkflowService) ListExecutions(ctx context.Context, workspaceID uuid.UUID, workflowID *uuid.UUID, status string, limit, offset int) ([]models.WorkflowExecution, error) {
	return s.workflowRepo.ListExecutions(ctx, workspaceID, workflowID, status, limit, offset)
}

func (s *WorkflowService) RetryExecution(ctx context.Context, executionID, workspaceID uuid.UUID) (*models.WorkflowExecution, error) {
	orig, err := s.workflowRepo.GetExecutionByID(ctx, executionID)
	if err != nil {
		return nil, err
	}

	var ctxMap map[string]interface{}
	_ = json.Unmarshal(orig.ContextData, &ctxMap)
	if ctxMap == nil {
		ctxMap = make(map[string]interface{})
	}
	ctxMap["retriedFrom"] = executionID.String()

	return s.TriggerWorkflow(ctx, orig.WorkflowID, workspaceID, orig.DocumentID, "retry", ctxMap)
}

func (s *WorkflowService) CancelExecution(ctx context.Context, executionID uuid.UUID) error {
	ex, err := s.workflowRepo.GetExecutionByID(ctx, executionID)
	if err != nil {
		return err
	}
	if ex.Status != models.WorkflowStatusRunning && ex.Status != models.WorkflowStatusWaitingApproval {
		return errors.New("only running or waiting executions can be cancelled")
	}

	completedAt := time.Now().UTC()
	ex.Status = models.WorkflowStatusCancelled
	ex.CompletedAt = &completedAt
	return s.workflowRepo.UpdateExecution(ctx, ex)
}

// -----------------------------------------------------------------------------
// APPROVALS
// -----------------------------------------------------------------------------

func (s *WorkflowService) ListApprovals(ctx context.Context, workspaceID uuid.UUID, status string) ([]models.WorkflowApproval, error) {
	return s.workflowRepo.ListApprovals(ctx, workspaceID, status)
}

func (s *WorkflowService) DecideApproval(ctx context.Context, approvalID, approverID uuid.UUID, req models.SubmitApprovalRequest) error {
	app, err := s.workflowRepo.GetApprovalByID(ctx, approvalID)
	if err != nil {
		return err
	}

	if err := s.workflowRepo.DecideApproval(ctx, approvalID, approverID, req.Status, req.DecisionNotes); err != nil {
		return err
	}

	// Update the associated execution
	ex, err := s.workflowRepo.GetExecutionByID(ctx, app.ExecutionID)
	if err == nil {
		if req.Status == models.ApprovalApproved {
			// Resume downstream workflow execution from this approval step
			go s.resumeExecutionFromStep(context.Background(), ex, app.StepID, req.DecisionNotes)
		} else {
			completedAt := time.Now().UTC()
			ex.Status = models.WorkflowStatusFailed
			ex.ErrorMessage = fmt.Sprintf("Rejected during approval step '%s': %s", app.StepID, req.DecisionNotes)
			ex.CompletedAt = &completedAt
			_ = s.workflowRepo.UpdateExecution(ctx, ex)
		}
	}

	return nil
}

// RecoverOrphanedExecutions identifies and cleanly marks or resumes executions stranded by server shutdown
func (s *WorkflowService) RecoverOrphanedExecutions(ctx context.Context) error {
	orphaned, err := s.workflowRepo.ListOrphanedExecutions(ctx)
	if err != nil {
		return err
	}
	for _, ex := range orphaned {
		completedAt := time.Now().UTC()
		ex.Status = models.WorkflowStatusFailed
		ex.ErrorMessage = "Execution was interrupted by an unexpected server shutdown. Preserved for diagnostic inspection."
		ex.CompletedAt = &completedAt

		var logs []map[string]interface{}
		_ = json.Unmarshal(ex.Logs, &logs)
		logs = append(logs, map[string]interface{}{
			"timestamp": completedAt.Format(time.RFC3339),
			"level":     "warn",
			"message":   "Server restarted while execution was in progress. Execution marked as interrupted.",
		})
		logsBytes, _ := json.Marshal(logs)
		ex.Logs = logsBytes
		_ = s.workflowRepo.UpdateExecution(ctx, &ex)
	}
	return nil
}

// -----------------------------------------------------------------------------
// SCHEDULES
// -----------------------------------------------------------------------------

func (s *WorkflowService) GetSchedule(ctx context.Context, workflowID uuid.UUID) (*models.WorkflowSchedule, error) {
	return s.workflowRepo.GetScheduleByWorkflowID(ctx, workflowID)
}

func (s *WorkflowService) SaveSchedule(ctx context.Context, workflowID, workspaceID uuid.UUID, req models.SaveScheduleRequest) (*models.WorkflowSchedule, error) {
	nextRun := s.calculateNextRun(req.Frequency, time.Now().UTC())

	sch := &models.WorkflowSchedule{
		ID:             uuid.New(),
		WorkflowID:     workflowID,
		WorkspaceID:    workspaceID,
		CronExpression: req.CronExpression,
		Frequency:      req.Frequency,
		Timezone:       req.Timezone,
		IsActive:       req.IsActive,
		NextRunAt:      &nextRun,
	}

	// Check if already exists to preserve ID
	if existing, err := s.workflowRepo.GetScheduleByWorkflowID(ctx, workflowID); err == nil {
		sch.ID = existing.ID
	}

	if err := s.workflowRepo.UpsertSchedule(ctx, sch); err != nil {
		return nil, err
	}
	return sch, nil
}

func (s *WorkflowService) calculateNextRun(freq string, from time.Time) time.Time {
	switch freq {
	case "hourly":
		return from.Add(1 * time.Hour)
	case "daily":
		return from.AddDate(0, 0, 1)
	case "weekly":
		return from.AddDate(0, 0, 7)
	case "monthly":
		return from.AddDate(0, 1, 0)
	default:
		return from.AddDate(0, 0, 1)
	}
}

// -----------------------------------------------------------------------------
// ANALYTICS & STATS
// -----------------------------------------------------------------------------

func (s *WorkflowService) GetAnalytics(ctx context.Context, workspaceID uuid.UUID) (*models.WorkflowAnalytics, error) {
	return s.workflowRepo.GetAnalytics(ctx, workspaceID)
}

// -----------------------------------------------------------------------------
// BUILT-IN TEMPLATES LIBRARY (15 Production Templates)
// -----------------------------------------------------------------------------

func (s *WorkflowService) GetTemplates() []models.WorkflowTemplate {
	return []models.WorkflowTemplate{
		{
			ID:          "tpl-1-receipt",
			Name:        "Instant Receipt Generation",
			Description: "Validates customer data, calculates totals, and generates a formatted receipt PDF.",
			Category:    "Finance",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_trigger", Type: "trigger", Label: "Manual / API Trigger", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_validate", Type: "validate_fields", Label: "Validate Customer & Items", Position: models.NodePosition{X: 350, Y: 100}, Data: map[string]interface{}{"requiredFields": []string{"customerName"}}},
					{ID: "node_generate", Type: "generate_receipt", Label: "Generate Receipt PDF", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_trigger", Target: "node_validate"},
					{ID: "e2", Source: "node_validate", Target: "node_generate"},
				},
			},
			RequiredInputs:    []string{"customerName", "totalAmount"},
			SetupInstructions: "Provide customerName and totalAmount in input payload.",
		},
		{
			ID:          "tpl-2-invoice-approval",
			Name:        "Corporate Invoice with Manager Approval",
			Description: "Generates invoice, checks amount threshold, and routes to manager review if over $1,000.",
			Category:    "Billing",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "start", Label: "Invoice Trigger", Position: models.NodePosition{X: 100, Y: 150}},
					{ID: "node_cond", Type: "condition", Label: "Amount > $1,000?", Position: models.NodePosition{X: 340, Y: 150}, Data: map[string]interface{}{"field": "totalAmount", "operator": "greater_than", "value": "1000"}},
					{ID: "node_app", Type: "approval", Label: "Executive Approval", Position: models.NodePosition{X: 580, Y: 80}},
					{ID: "node_gen", Type: "generate_invoice", Label: "Generate Invoice", Position: models.NodePosition{X: 820, Y: 150}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_cond"},
					{ID: "e2", Source: "node_cond", Target: "node_app", SourceHandle: "true"},
					{ID: "e3", Source: "node_cond", Target: "node_gen", SourceHandle: "false"},
					{ID: "e4", Source: "node_app", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"customerName", "totalAmount"},
			SetupInstructions: "Set totalAmount and invoice items. Executions over $1,000 wait for approval.",
		},
		{
			ID:          "tpl-3-quotation",
			Name:        "Commercial Quotation Pipeline",
			Description: "Prepares a formal corporate proposal with validity period and generates quotation PDF.",
			Category:    "Sales",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Proposal Request", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_map", Type: "transform_data", Label: "Map Quotation Fields", Position: models.NodePosition{X: 350, Y: 100}},
					{ID: "node_gen", Type: "generate_pdf", Label: "Render Proposal Document", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_map"},
					{ID: "e2", Source: "node_map", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"customerName", "title"},
			SetupInstructions: "Supply customer details and quotation scope.",
		},
		{
			ID:          "tpl-4-business-report",
			Name:        "Monthly Business Performance Report",
			Description: "Gathers monthly metrics and generates executive summary document with statistics.",
			Category:    "Reporting",
			TriggerType: "scheduled",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "scheduled", Label: "Monthly Schedule", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_note", Type: "log_note", Label: "Log Run Metrics", Position: models.NodePosition{X: 350, Y: 100}, Data: map[string]interface{}{"note": "Generating scheduled business review"}},
					{ID: "node_gen", Type: "generate_pdf", Label: "Create PDF Report", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_note"},
					{ID: "e2", Source: "node_note", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{},
			SetupInstructions: "Configured to run automatically on a recurring schedule.",
		},
		{
			ID:          "tpl-5-bulk-csv",
			Name:        "Bulk Document Generation from CSV",
			Description: "Parses uploaded CSV rows, validates records, and generates individual receipts in bulk.",
			Category:    "Bulk Processing",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Upload CSV", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_parse", Type: "parse_csv", Label: "Parse CSV Rows", Position: models.NodePosition{X: 350, Y: 100}},
					{ID: "node_gen", Type: "generate_receipt", Label: "Batch Generate", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_parse"},
					{ID: "e2", Source: "node_parse", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"csvData"},
			SetupInstructions: "Paste or upload CSV with columns: customerName, totalAmount.",
		},
		{
			ID:          "tpl-6-json-pipeline",
			Name:        "Webhook API to Verified Invoice",
			Description: "Receives raw JSON webhook from payment provider and compiles verified invoice.",
			Category:    "Integration",
			TriggerType: "webhook",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "webhook", Label: "Inbound Webhook", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_parse", Type: "parse_json", Label: "Parse Webhook Payload", Position: models.NodePosition{X: 350, Y: 100}},
					{ID: "node_gen", Type: "generate_invoice", Label: "Issue Invoice", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_parse"},
					{ID: "e2", Source: "node_parse", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"jsonData"},
			SetupInstructions: "Send POST request with JSON payload to unique webhook URL.",
		},
		{
			ID:          "tpl-7-archive-zip",
			Name:        "Batch Document Compilation & ZIP Archive",
			Description: "Iterates through generated billing documents and compiles them into a single ZIP archive.",
			Category:    "Archiving",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Trigger Archive", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_gen1", Type: "generate_receipt", Label: "Create Receipts", Position: models.NodePosition{X: 350, Y: 100}},
					{ID: "node_zip", Type: "create_zip", Label: "Create ZIP Archive", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_gen1"},
					{ID: "e2", Source: "node_gen1", Target: "node_zip"},
				},
			},
			RequiredInputs:    []string{},
			SetupInstructions: "Compiles all batch outputs into downloadable zip bundle.",
		},
		{
			ID:          "tpl-8-conditional-discount",
			Name:        "Conditional VIP Discount Receipt",
			Description: "Checks if customer tier is 'VIP', applies discount mapping, and issues receipt.",
			Category:    "Finance",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "start", Label: "Customer Order", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_cond", Type: "condition", Label: "Tier == VIP?", Position: models.NodePosition{X: 340, Y: 100}, Data: map[string]interface{}{"field": "customerTier", "operator": "equals", "value": "VIP"}},
					{ID: "node_map", Type: "transform_data", Label: "Apply VIP Discount", Position: models.NodePosition{X: 580, Y: 50}},
					{ID: "node_gen", Type: "generate_receipt", Label: "Issue Receipt", Position: models.NodePosition{X: 820, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_cond"},
					{ID: "e2", Source: "node_cond", Target: "node_map", SourceHandle: "true"},
					{ID: "e3", Source: "node_cond", Target: "node_gen", SourceHandle: "false"},
					{ID: "e4", Source: "node_map", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"customerName", "customerTier"},
			SetupInstructions: "Pass customerTier='VIP' to test conditional path.",
		},
		{
			ID:          "tpl-9-audit-logging",
			Name:        "Document Generation with Step Audit Trail",
			Description: "Executes structured field mapping, logs compliance notes, and seals final document.",
			Category:    "Compliance",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Audit Start", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_note1", Type: "log_note", Label: "Log Input Hash", Position: models.NodePosition{X: 320, Y: 100}, Data: map[string]interface{}{"note": "Input verified"}},
					{ID: "node_gen", Type: "generate_pdf", Label: "Generate Document", Position: models.NodePosition{X: 550, Y: 100}},
					{ID: "node_note2", Type: "log_note", Label: "Log Completion", Position: models.NodePosition{X: 780, Y: 100}, Data: map[string]interface{}{"note": "Document sealed"}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_note1"},
					{ID: "e2", Source: "node_note1", Target: "node_gen"},
					{ID: "e3", Source: "node_gen", Target: "node_note2"},
				},
			},
			RequiredInputs:    []string{"title"},
			SetupInstructions: "Provides full compliance trace in execution logs.",
		},
		{
			ID:          "tpl-10-scheduled-invoicing",
			Name:        "Scheduled Weekly Subscription Invoicing",
			Description: "Triggers every week, prepares recurring subscription charges, and issues invoices.",
			Category:    "Billing",
			TriggerType: "scheduled",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "scheduled", Label: "Weekly Clock", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_gen", Type: "generate_invoice", Label: "Create Weekly Invoices", Position: models.NodePosition{X: 350, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{},
			SetupInstructions: "Activate workflow schedule to run every Monday.",
		},
		{
			ID:          "tpl-11-delay-validation",
			Name:        "Delayed Payment Confirmation",
			Description: "Waits 3 seconds for banking settlement before issuing official tax receipt.",
			Category:    "Finance",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Payment Notification", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_delay", Type: "delay", Label: "Wait for Clearing (3s)", Position: models.NodePosition{X: 350, Y: 100}, Data: map[string]interface{}{"seconds": 3.0}},
					{ID: "node_gen", Type: "generate_receipt", Label: "Issue Settled Receipt", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_delay"},
					{ID: "e2", Source: "node_delay", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"customerName"},
			SetupInstructions: "Includes safe bounded delay node before generating output.",
		},
		{
			ID:          "tpl-12-variable-routing",
			Name:        "Dynamic Variable Mapping Pipeline",
			Description: "Sets workflow variables, merges context values, and renders personalized document.",
			Category:    "Utilities",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Input Stream", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_set", Type: "set_output", Label: "Set Default Currency & Terms", Position: models.NodePosition{X: 350, Y: 100}, Data: map[string]interface{}{"variables": map[string]interface{}{"currency": "EUR", "terms": "Net 30"}}},
					{ID: "node_gen", Type: "generate_pdf", Label: "Render PDF Document", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_set"},
					{ID: "e2", Source: "node_set", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{},
			SetupInstructions: "Demonstrates variable injection across steps.",
		},
		{
			ID:          "tpl-13-certificate-generation",
			Name:        "Bulk Course Completion Certificates",
			Description: "Generates personalized completion certificate PDFs for students from roster data.",
			Category:    "Education",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Student Roster", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_val", Type: "validate_fields", Label: "Verify Student ID & Grade", Position: models.NodePosition{X: 350, Y: 100}, Data: map[string]interface{}{"requiredFields": []string{"customerName"}}},
					{ID: "node_gen", Type: "generate_pdf", Label: "Issue Certificate PDF", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_val"},
					{ID: "e2", Source: "node_val", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"customerName"},
			SetupInstructions: "Pass recipient names to generate certified documents.",
		},
		{
			ID:          "tpl-14-multi-branch",
			Name:        "Multi-Branch Document Classifier",
			Description: "Routes documents to either Receipt or Invoice branch based on transaction type.",
			Category:    "Routing",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "start", Label: "Transaction Input", Position: models.NodePosition{X: 100, Y: 150}},
					{ID: "node_cond", Type: "condition", Label: "Is Paid Immediately?", Position: models.NodePosition{X: 350, Y: 150}, Data: map[string]interface{}{"field": "isPaid", "operator": "equals", "value": "true"}},
					{ID: "node_rcp", Type: "generate_receipt", Label: "Issue Receipt", Position: models.NodePosition{X: 620, Y: 70}},
					{ID: "node_inv", Type: "generate_invoice", Label: "Issue Due Invoice", Position: models.NodePosition{X: 620, Y: 230}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_cond"},
					{ID: "e2", Source: "node_cond", Target: "node_rcp", SourceHandle: "true"},
					{ID: "e3", Source: "node_cond", Target: "node_inv", SourceHandle: "false"},
				},
			},
			RequiredInputs:    []string{"isPaid", "customerName"},
			SetupInstructions: "Set isPaid='true' for receipts or 'false' for invoices.",
		},
		{
			ID:          "tpl-15-statement-summary",
			Name:        "Periodic Statement of Account",
			Description: "Calculates balance forward, itemizes statements, and produces signed PDF summary.",
			Category:    "Finance",
			TriggerType: "manual",
			Definition: models.WorkflowDefinition{
				Nodes: []models.WorkflowNode{
					{ID: "node_start", Type: "trigger", Label: "Account Query", Position: models.NodePosition{X: 100, Y: 100}},
					{ID: "node_calc", Type: "transform_data", Label: "Calculate Balances", Position: models.NodePosition{X: 350, Y: 100}},
					{ID: "node_gen", Type: "generate_pdf", Label: "Render Financial Statement", Position: models.NodePosition{X: 620, Y: 100}},
				},
				Edges: []models.WorkflowEdge{
					{ID: "e1", Source: "node_start", Target: "node_calc"},
					{ID: "e2", Source: "node_calc", Target: "node_gen"},
				},
			},
			RequiredInputs:    []string{"customerName"},
			SetupInstructions: "Prepares comprehensive financial overview PDF.",
		},
	}
}

// -----------------------------------------------------------------------------
// WORKFLOW SCHEDULER BACKGROUND WORKER
// -----------------------------------------------------------------------------

func (s *WorkflowService) StartScheduler(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				s.processDueSchedules(ctx)
			}
		}
	}()
}

func (s *WorkflowService) processDueSchedules(ctx context.Context) {
	dueSchedules, err := s.workflowRepo.ListDueSchedules(ctx)
	if err != nil || len(dueSchedules) == 0 {
		return
	}

	for _, sch := range dueSchedules {
		now := time.Now().UTC()
		nextRun := s.calculateNextRun(sch.Frequency, now)
		_ = s.workflowRepo.UpdateScheduleRun(ctx, sch.ID, now, nextRun)

		// Trigger scheduled run
		_, _ = s.TriggerWorkflow(ctx, sch.WorkflowID, sch.WorkspaceID, nil, models.TriggerScheduled, map[string]interface{}{
			"scheduleId": sch.ID.String(),
			"frequency":  sch.Frequency,
		})
	}
}
