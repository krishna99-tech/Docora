package handlers

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"docora/backend/internal/middleware"
	"docora/backend/internal/services"
)

type PDFToolsHandler struct {
	toolsService *services.PDFToolsService
}

func NewPDFToolsHandler(ts *services.PDFToolsService) *PDFToolsHandler {
	return &PDFToolsHandler{toolsService: ts}
}

func (h *PDFToolsHandler) getWorkspaceID(c *gin.Context) uuid.UUID {
	wsHeader := c.GetHeader("X-Workspace-ID")
	if wsID, err := uuid.Parse(wsHeader); err == nil {
		return wsID
	}
	if uid, ok := middleware.GetUserID(c); ok {
		return uid
	}
	return uuid.New()
}

func (h *PDFToolsHandler) Merge(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "multipart form expected"})
		return
	}

	files := form.File["files"]
	if len(files) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least 2 PDF files required for merge"})
		return
	}

	var readers []io.Reader
	var filenames []string
	for _, fh := range files {
		f, err := fh.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed opening uploaded file"})
			return
		}
		defer f.Close()
		readers = append(readers, f)
		filenames = append(filenames, fh.Filename)
	}

	job, outBytes, err := h.toolsService.MergePDFs(c.Request.Context(), userID, wsID, readers, filenames)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if c.Query("download") == "true" {
		c.Header("Content-Disposition", `attachment; filename="merged.pdf"`)
		c.Data(http.StatusOK, "application/pdf", outBytes)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job":     job,
		"message": "PDFs merged successfully",
	})
}

func (h *PDFToolsHandler) Compress(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PDF file required"})
		return
	}
	defer file.Close()

	job, outBytes, err := h.toolsService.CompressPDF(c.Request.Context(), userID, wsID, file, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if c.Query("download") == "true" {
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="compressed-%s"`, header.Filename))
		c.Data(http.StatusOK, "application/pdf", outBytes)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job":          job,
		"originalSize": header.Size,
		"compressedSize": len(outBytes),
		"savedBytes":   header.Size - int64(len(outBytes)),
	})
}

func (h *PDFToolsHandler) Rotate(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PDF file required"})
		return
	}
	defer file.Close()

	angleStr := c.DefaultPostForm("angle", "90")
	angle, _ := strconv.Atoi(angleStr)

	var pages []string
	pagesStr := c.PostForm("pages")
	if pagesStr != "" {
		for _, p := range strings.Split(pagesStr, ",") {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				pages = append(pages, trimmed)
			}
		}
	}

	outBytes, err := h.toolsService.RotatePDF(c.Request.Context(), userID, wsID, file, angle, pages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="rotated-%s"`, header.Filename))
	c.Data(http.StatusOK, "application/pdf", outBytes)
}

func (h *PDFToolsHandler) Watermark(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PDF file required"})
		return
	}
	defer file.Close()

	text := c.DefaultPostForm("text", "CONFIDENTIAL")
	opacityStr := c.DefaultPostForm("opacity", "0.3")
	opacity, _ := strconv.ParseFloat(opacityStr, 64)

	outBytes, err := h.toolsService.WatermarkPDF(c.Request.Context(), userID, wsID, file, text, opacity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="watermarked-%s"`, header.Filename))
	c.Data(http.StatusOK, "application/pdf", outBytes)
}

func (h *PDFToolsHandler) PageNumbers(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PDF file required"})
		return
	}
	defer file.Close()

	position := c.DefaultPostForm("position", "bottom-right")
	outBytes, err := h.toolsService.PageNumbersPDF(c.Request.Context(), userID, wsID, file, position)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="numbered-%s"`, header.Filename))
	c.Data(http.StatusOK, "application/pdf", outBytes)
}

func (h *PDFToolsHandler) ImagesToPDF(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	wsID := h.getWorkspaceID(c)

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "multipart form expected"})
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one image required"})
		return
	}

	var readers []io.Reader
	var exts []string
	for _, fh := range files {
		f, err := fh.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed opening uploaded image"})
			return
		}
		defer f.Close()
		readers = append(readers, f)
		exts = append(exts, strings.ToLower(filepath.Ext(fh.Filename)))
	}

	outBytes, err := h.toolsService.ImagesToPDF(c.Request.Context(), userID, wsID, readers, exts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="images_converted.pdf"`)
	c.Data(http.StatusOK, "application/pdf", outBytes)
}

func (h *PDFToolsHandler) Metadata(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PDF file required"})
		return
	}
	defer file.Close()

	meta, err := h.toolsService.GetMetadata(c.Request.Context(), file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, meta)
}

func (h *PDFToolsHandler) ListJobs(c *gin.Context) {
	wsID := h.getWorkspaceID(c)
	jobs, err := h.toolsService.ListJobs(c.Request.Context(), wsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, jobs)
}
