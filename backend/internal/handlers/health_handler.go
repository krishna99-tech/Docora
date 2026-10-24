package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"docora/backend/internal/repositories"
	"docora/backend/internal/storage"
)

type HealthHandler struct {
	db      *repositories.DB
	storage storage.Storage
}

func NewHealthHandler(db *repositories.DB, storage storage.Storage) *HealthHandler {
	return &HealthHandler{db: db, storage: storage}
}

// Healthz returns basic liveness
func (h *HealthHandler) Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// Readyz verifies database connectivity and storage readiness
func (h *HealthHandler) Readyz(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	dbStatus := "connected"
	if h.db != nil && h.db.Pool != nil {
		if err := h.db.Pool.Ping(ctx); err != nil {
			dbStatus = "disconnected"
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":    "unavailable",
				"database":  dbStatus,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			return
		}
	}

	storageStatus := "ready"
	if h.storage != nil {
		// Verify storage can be accessed
		_, _ = h.storage.Exists(ctx, "healthcheck.tmp")
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "ready",
		"database":  dbStatus,
		"storage":   storageStatus,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
