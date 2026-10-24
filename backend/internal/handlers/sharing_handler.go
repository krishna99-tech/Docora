package handlers

import (
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/services"
	"docora/backend/internal/storage"
)

type SharingHandler struct {
	sharingService *services.SharingService
	docService     *services.DocumentService
	storage        storage.Storage
}

func NewSharingHandler(ss *services.SharingService, ds *services.DocumentService, st storage.Storage) *SharingHandler {
	return &SharingHandler{
		sharingService: ss,
		docService:     ds,
		storage:        st,
	}
}

func (h *SharingHandler) getWorkspaceID(c *gin.Context) uuid.UUID {
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

func (h *SharingHandler) Create(c *gin.Context) {
	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	wsID := h.getWorkspaceID(c)

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	var req models.CreateSharingLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	link, err := h.sharingService.CreateSharingLink(c.Request.Context(), userID, wsID, docID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, link)
}

func (h *SharingHandler) List(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	links, err := h.sharingService.ListWorkspaceLinks(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, links)
}

func (h *SharingHandler) Revoke(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sharing link id"})
		return
	}

	if err := h.sharingService.RevokeLink(c.Request.Context(), id, wsID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "sharing link revoked successfully"})
}

// Public endpoints

func (h *SharingHandler) GetPublicShareInfo(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token required"})
		return
	}

	info, err := h.sharingService.GetPublicShareInfo(c.Request.Context(), token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

func (h *SharingHandler) AccessSharedDocument(c *gin.Context) {
	token := c.Param("token")
	var req models.VerifySharePasswordRequest
	_ = c.ShouldBindJSON(&req)

	link, err := h.sharingService.AccessSharedDocument(c.Request.Context(), token, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	doc, err := h.docService.GetByID(c.Request.Context(), link.CreatedBy, link.DocumentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "shared document file not found"})
		return
	}

	if doc.StorageKey == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "document PDF file not generated"})
		return
	}

	rc, err := h.storage.Open(c.Request.Context(), doc.StorageKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "storage file not accessible"})
		return
	}
	defer rc.Close()

	pdfBytes, err := io.ReadAll(rc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed reading PDF"})
		return
	}

	if c.Query("download") == "true" {
		if !link.AllowDownload {
			c.JSON(http.StatusForbidden, gin.H{"error": "download permission not enabled for this link"})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, doc.Filename))
	} else {
		c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, doc.Filename))
	}

	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}
