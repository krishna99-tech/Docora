package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"docora/backend/internal/middleware"
	"docora/backend/internal/models"
	"docora/backend/internal/services"
)

type BusinessHandler struct {
	businessService *services.BusinessService
}

func NewBusinessHandler(businessService *services.BusinessService) *BusinessHandler {
	return &BusinessHandler{businessService: businessService}
}

func (h *BusinessHandler) GetProfile(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	profile, err := h.businessService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed retrieving business profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *BusinessHandler) UpdateProfile(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.UpdateBusinessProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation error: " + err.Error()})
		return
	}

	profile, err := h.businessService.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed updating business profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}
