package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	userIDVal, _ := c.Get("userId")
	if uid, ok := userIDVal.(uuid.UUID); ok {
		return uid
	}
	return uuid.New()
}

func (h *WorkflowHandler) List(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	workflows, err := h.wfService.ListWorkflows(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, workflows)
}

func (h *WorkflowHandler) Create(c *gin.Context) {
	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
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

	ex, err := h.wfService.TriggerWorkflow(c.Request.Context(), id, wsID, req.DocumentID, req.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, ex)
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
	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

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
