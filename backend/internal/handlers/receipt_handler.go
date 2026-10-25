package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/middleware"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
	"docora/backend/internal/services"
)

type ReceiptHandler struct {
	docService *services.DocumentService
}

func NewReceiptHandler(docService *services.DocumentService) *ReceiptHandler {
	return &ReceiptHandler{docService: docService}
}

func (h *ReceiptHandler) Create(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreateReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation error: " + err.Error()})
		return
	}

	doc, err := h.docService.CreateReceipt(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed creating receipt: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, doc)
}

func (h *ReceiptHandler) Update(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receipt ID"})
		return
	}

	var req models.CreateReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation error: " + err.Error()})
		return
	}

	doc, err := h.docService.UpdateReceipt(c.Request.Context(), userID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed updating receipt: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, doc)
}

func (h *ReceiptHandler) List(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var filter models.DocumentListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filter parameters"})
		return
	}
	filter.Type = models.TypeReceipt

	res, err := h.docService.List(c.Request.Context(), userID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed listing receipts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *ReceiptHandler) GetByID(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receipt ID"})
		return
	}

	doc, err := h.docService.GetByID(c.Request.Context(), userID, id)
	if err != nil {
		if errors.Is(err, repositories.ErrDocumentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed retrieving receipt: " + err.Error()})
		return
	}

	if doc.DocumentType != models.TypeReceipt {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document is not a receipt"})
		return
	}

	c.JSON(http.StatusOK, doc)
}

func (h *ReceiptHandler) Preview(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receipt ID"})
		return
	}

	pdfBytes, err := h.docService.GeneratePreview(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed generating preview: " + err.Error()})
		return
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "inline; filename=preview.pdf")
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}

func (h *ReceiptHandler) Finalize(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receipt ID"})
		return
	}

	doc, err := h.docService.Finalize(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed finalizing receipt: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, doc)
}

func (h *ReceiptHandler) Cancel(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receipt ID"})
		return
	}

	if err := h.docService.Cancel(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed cancelling receipt: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receipt cancelled successfully"})
}
