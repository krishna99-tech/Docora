package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"docora/backend/internal/middleware"
	"docora/backend/internal/services"
)

type DashboardHandler struct {
	dashboardService *services.DashboardService
}

func NewDashboardHandler(dashboardService *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	stats, err := h.dashboardService.GetStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed fetching dashboard stats: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) GetRecentDocuments(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit := 10
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	recent, err := h.dashboardService.GetRecentDocuments(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed fetching recent documents: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, recent)
}
