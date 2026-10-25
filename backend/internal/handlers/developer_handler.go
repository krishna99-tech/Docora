package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/services"
)

type DeveloperHandler struct {
	devService *services.DeveloperService
}

func NewDeveloperHandler(ds *services.DeveloperService) *DeveloperHandler {
	return &DeveloperHandler{devService: ds}
}

func (h *DeveloperHandler) getWorkspaceID(c *gin.Context) uuid.UUID {
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

// API Keys

func (h *DeveloperHandler) ListKeys(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	keys, err := h.devService.ListApiKeys(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, keys)
}

func (h *DeveloperHandler) CreateKey(c *gin.Context) {
	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	wsID := h.getWorkspaceID(c)

	var req models.CreateApiKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	key, err := h.devService.CreateApiKey(c.Request.Context(), userID, wsID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, key)
}

func (h *DeveloperHandler) RevokeKey(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid key id"})
		return
	}

	if err := h.devService.RevokeApiKey(c.Request.Context(), id, wsID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key revoked successfully"})
}

// Webhooks

func (h *DeveloperHandler) ListWebhooks(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	hooks, err := h.devService.ListWebhooks(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, hooks)
}

func (h *DeveloperHandler) CreateWebhook(c *gin.Context) {
	wsID := h.getWorkspaceID(c)

	var req models.CreateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wh, err := h.devService.CreateWebhook(c.Request.Context(), wsID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, wh)
}

func (h *DeveloperHandler) DeleteWebhook(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook id"})
		return
	}

	if err := h.devService.DeleteWebhook(c.Request.Context(), id, wsID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "webhook deleted successfully"})
}

func (h *DeveloperHandler) ListDeliveries(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook id"})
		return
	}

	deliveries, err := h.devService.ListDeliveries(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deliveries)
}

func (h *DeveloperHandler) TestWebhook(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook id"})
		return
	}

	var req struct {
		EventType string `json:"eventType"`
	}
	_ = c.ShouldBindJSON(&req)

	delivery, err := h.devService.TestWebhook(c.Request.Context(), id, wsID, req.EventType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, delivery)
}

