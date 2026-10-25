package handlers

import (
	"net/http"

	"docora/backend/internal/models"
	"docora/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FolderHandler struct {
	folderService *services.FolderService
}

func NewFolderHandler(folderService *services.FolderService) *FolderHandler {
	return &FolderHandler{folderService: folderService}
}

func (h *FolderHandler) List(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	folders, err := h.folderService.ListFolders(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, folders)
}

func (h *FolderHandler) Create(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var req models.CreateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	folder, err := h.folderService.CreateFolder(c.Request.Context(), wsID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, folder)
}

func (h *FolderHandler) Update(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	folderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid folder id"})
		return
	}
	var req models.UpdateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.folderService.UpdateFolder(c.Request.Context(), wsID, folderID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "folder updated successfully"})
}

func (h *FolderHandler) Delete(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	folderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid folder id"})
		return
	}
	if err := h.folderService.DeleteFolder(c.Request.Context(), wsID, folderID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "folder deleted successfully"})
}

func (h *FolderHandler) Move(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var req models.MoveDocumentsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.folderService.MoveDocuments(c.Request.Context(), wsID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "documents moved successfully"})
}

func (h *FolderHandler) Tag(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var req models.TagDocumentsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.folderService.TagDocuments(c.Request.Context(), wsID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "documents tagged successfully"})
}

func (h *FolderHandler) Archive(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var req models.ArchiveDocumentsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.folderService.ArchiveDocuments(c.Request.Context(), wsID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "documents archive status updated"})
}

func (h *FolderHandler) Compliance(c *gin.Context) {
	wsIDVal, _ := c.Get("workspaceId")
	wsID, ok := wsIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var req models.ComplianceSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.folderService.ApplyCompliance(c.Request.Context(), wsID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "compliance settings applied"})
}
