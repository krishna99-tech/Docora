package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/middleware"
	"docora/backend/internal/models"
	"docora/backend/internal/services"
)

type WorkflowHandler struct {
	wfService *services.WorkflowService
}

func NewWorkflowHandler(ws *services.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{wfService: ws}
}

func (h *WorkflowHandler) getWorkspaceID(c *gin.Context) uuid.UUID {
	wsHeader := c.GetHeader("X-Workspace-ID")
	if wsID, err := uuid.Parse(wsHeader); err == nil {
		return wsID
	}
	if userID, ok := middleware.GetUserID(c); ok && userID != uuid.Nil {
		return userID
	}
	return uuid.New()
}

// -----------------------------------------------------------------------------
// WORKFLOW CRUD
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) List(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	search := c.Query("search")
	category := c.Query("category")
	status := c.Query("status")

	workflows, err := h.wfService.ListWorkflows(c.Request.Context(), wsID, search, category, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, workflows)
}

func (h *WorkflowHandler) Create(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	var req models.CreateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wf, err := h.wfService.CreateWorkflow(c.Request.Context(), userID, wsID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, wf)
}

func (h *WorkflowHandler) Get(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	wf, err := h.wfService.GetWorkflow(c.Request.Context(), id, wsID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	c.JSON(http.StatusOK, wf)
}

func (h *WorkflowHandler) Update(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	var req models.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wf, err := h.wfService.UpdateWorkflow(c.Request.Context(), id, wsID, userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, wf)
}

func (h *WorkflowHandler) Delete(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	if err := h.wfService.DeleteWorkflow(c.Request.Context(), id, wsID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "workflow deleted successfully"})
}

func (h *WorkflowHandler) Duplicate(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	wf, err := h.wfService.DuplicateWorkflow(c.Request.Context(), id, wsID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, wf)
}

// -----------------------------------------------------------------------------
// EXECUTION & TESTING
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) Trigger(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	var req struct {
		DocumentID *uuid.UUID             `json:"documentId"`
		Context    map[string]interface{} `json:"context"`
	}
	_ = c.ShouldBindJSON(&req)

	ex, err := h.wfService.TriggerWorkflow(c.Request.Context(), id, wsID, req.DocumentID, models.TriggerManual, req.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, ex)
}

func (h *WorkflowHandler) DryRun(c *gin.Context) {
	var req models.DryRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.wfService.DryRun(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *WorkflowHandler) Bulk(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	var req models.BulkExecutionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ex, err := h.wfService.ExecuteBulk(c.Request.Context(), id, wsID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, ex)
}

// -----------------------------------------------------------------------------
// VERSIONS
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) ListVersions(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	versions, err := h.wfService.ListVersions(c.Request.Context(), id, wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, versions)
}

func (h *WorkflowHandler) RestoreVersion(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	versionNum, err := strconv.Atoi(c.Param("version"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid version number"})
		return
	}

	wf, err := h.wfService.RestoreVersion(c.Request.Context(), id, wsID, userID, versionNum)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, wf)
}

// -----------------------------------------------------------------------------
// EXECUTIONS HISTORY & RETRY
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) ListExecutions(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var wfIDPtr *uuid.UUID
	if wfIDStr := c.Param("id"); wfIDStr != "" {
		if wfID, err := uuid.Parse(wfIDStr); err == nil {
			wfIDPtr = &wfID
		}
	} else if qWfIDStr := c.Query("workflowId"); qWfIDStr != "" {
		if wfID, err := uuid.Parse(qWfIDStr); err == nil {
			wfIDPtr = &wfID
		}
	}

	executions, err := h.wfService.ListExecutions(c.Request.Context(), wsID, wfIDPtr, status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, executions)
}

func (h *WorkflowHandler) GetExecution(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid execution id"})
		return
	}

	ex, err := h.wfService.GetExecution(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "execution not found"})
		return
	}

	c.JSON(http.StatusOK, ex)
}

func (h *WorkflowHandler) RetryExecution(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid execution id"})
		return
	}

	ex, err := h.wfService.RetryExecution(c.Request.Context(), id, wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, ex)
}

func (h *WorkflowHandler) CancelExecution(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid execution id"})
		return
	}

	if err := h.wfService.CancelExecution(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "execution cancelled"})
}

// -----------------------------------------------------------------------------
// APPROVALS
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) ListApprovals(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	status := c.Query("status")

	approvals, err := h.wfService.ListApprovals(c.Request.Context(), wsID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, approvals)
}

func (h *WorkflowHandler) DecideApproval(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid approval id"})
		return
	}

	var req models.SubmitApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.wfService.DecideApproval(c.Request.Context(), id, userID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "approval decision recorded successfully"})
}

// -----------------------------------------------------------------------------
// SCHEDULES
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) GetSchedule(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	sch, err := h.wfService.GetSchedule(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"schedule": nil})
		return
	}

	c.JSON(http.StatusOK, sch)
}

func (h *WorkflowHandler) SaveSchedule(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	var req models.SaveScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sch, err := h.wfService.SaveSchedule(c.Request.Context(), id, wsID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sch)
}

// -----------------------------------------------------------------------------
// ANALYTICS & TEMPLATES
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) GetAnalytics(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	analytics, err := h.wfService.GetAnalytics(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *WorkflowHandler) GetTemplates(c *gin.Context) {
	templates := h.wfService.GetTemplates()
	c.JSON(http.StatusOK, templates)
}

// -----------------------------------------------------------------------------
// IMPORT / EXPORT
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) Export(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	wf, err := h.wfService.GetWorkflow(c.Request.Context(), id, wsID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	exportData := gin.H{
		"exportVersion": "1.0",
		"name":          wf.Name,
		"description":   wf.Description,
		"category":      wf.Category,
		"triggerType":   wf.TriggerType,
		"definition":    wf.Definition,
	}

	c.Header("Content-Disposition", "attachment; filename=\""+wf.Name+"-workflow.json\"")
	c.JSON(http.StatusOK, exportData)
}

func (h *WorkflowHandler) Import(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	var payload struct {
		Name        string          `json:"name"`
		Description string          `json:"description"`
		Category    string          `json:"category"`
		TriggerType string          `json:"triggerType"`
		Definition  json.RawMessage `json:"definition"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.Name == "" {
		payload.Name = "Imported Workflow"
	}
	if payload.TriggerType == "" {
		payload.TriggerType = models.TriggerManual
	}

	wf, err := h.wfService.CreateWorkflow(c.Request.Context(), userID, wsID, models.CreateWorkflowRequest{
		Name:        payload.Name,
		Description: payload.Description,
		Category:    payload.Category,
		TriggerType: payload.TriggerType,
		Definition:  payload.Definition,
		IsActive:    false, // Default draft on import
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, wf)
}

// -----------------------------------------------------------------------------
// PUBLIC WEBHOOK TRIGGER
// -----------------------------------------------------------------------------

func (h *WorkflowHandler) WebhookTrigger(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing webhook token"})
		return
	}

	wf, err := h.wfService.GetWorkflowByWebhook(c.Request.Context(), token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid or inactive webhook endpoint"})
		return
	}

	var payload map[string]interface{}
	_ = c.ShouldBindJSON(&payload)
	if payload == nil {
		payload = make(map[string]interface{})
	}

	ex, err := h.wfService.TriggerWorkflow(c.Request.Context(), wf.ID, wf.WorkspaceID, nil, models.TriggerWebhook, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message":     "webhook accepted and queued",
		"executionId": ex.ID,
		"status":      ex.Status,
	})
}
