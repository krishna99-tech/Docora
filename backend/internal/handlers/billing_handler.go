package handlers

import (
	"net/http"

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

func (h *BillingHandler) GetStatus(c *gin.Context) {
	wsIDVal, exists := c.Get("workspaceId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace context required"})
		return
	}
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
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
	wsIDVal, exists := c.Get("workspaceId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace context required"})
		return
	}
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
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
	wsIDVal, exists := c.Get("workspaceId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace context required"})
		return
	}
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}

	invoices, err := h.billingService.ListInvoices(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, invoices)
}
