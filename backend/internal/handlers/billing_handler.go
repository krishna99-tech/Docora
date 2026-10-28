package handlers

import (
	"net/http"

	"docora/backend/internal/middleware"
	"docora/backend/internal/models"
	"docora/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BillingHandler struct {
	billingService *services.BillingService
}

func NewBillingHandler(billingService *services.BillingService) *BillingHandler {
	return &BillingHandler{billingService: billingService}
}

func (h *BillingHandler) getWorkspaceID(c *gin.Context) (uuid.UUID, bool) {
	if wsID, ok := middleware.GetWorkspaceID(c); ok {
		return wsID, true
	}
	if wsHeader := c.GetHeader("X-Workspace-ID"); wsHeader != "" {
		if wsID, err := uuid.Parse(wsHeader); err == nil && wsID != uuid.Nil {
			return wsID, true
		}
	}
	if wsQuery := c.Query("workspace_id"); wsQuery != "" {
		if wsID, err := uuid.Parse(wsQuery); err == nil && wsID != uuid.Nil {
			return wsID, true
		}
	}
	if userID, ok := middleware.GetUserID(c); ok && userID != uuid.Nil {
		return userID, true
	}
	return uuid.Nil, false
}

func (h *BillingHandler) GetStatus(c *gin.Context) {
	wsID, ok := h.getWorkspaceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace context required"})
		return
	}

	status, err := h.billingService.GetBillingStatus(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, status)
}

func (h *BillingHandler) GetPlans(c *gin.Context) {
	plans := h.billingService.GetAvailablePlans()
	c.JSON(http.StatusOK, plans)
}

func (h *BillingHandler) ChangePlan(c *gin.Context) {
	wsID, ok := h.getWorkspaceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace context required"})
		return
	}

	var req models.ChangePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status, err := h.billingService.ChangePlan(c.Request.Context(), wsID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, status)
}

func (h *BillingHandler) ListInvoices(c *gin.Context) {
	wsID, ok := h.getWorkspaceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace context required"})
		return
	}

	invoices, err := h.billingService.ListInvoices(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, invoices)
}
