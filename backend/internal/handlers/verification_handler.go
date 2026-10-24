package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/services"
)

type VerificationHandler struct {
	verService *services.VerificationService
}

func NewVerificationHandler(vs *services.VerificationService) *VerificationHandler {
	return &VerificationHandler{verService: vs}
}

// CheckIntegrity performs cryptographic SHA-256 byte comparison on the stored document PDF
func (h *VerificationHandler) CheckIntegrity(c *gin.Context) {
	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	result, err := h.verService.CheckDocumentIntegrity(c.Request.Context(), userID, docID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// PublicVerify displays non-sensitive verified metadata and integrity status
func (h *VerificationHandler) PublicVerify(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "verification token required"})
		return
	}

	info, err := h.verService.GetPublicVerification(c.Request.Context(), token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid or unknown verification token"})
		return
	}

	c.JSON(http.StatusOK, info)
}
