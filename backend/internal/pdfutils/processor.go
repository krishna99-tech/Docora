package pdfutils

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
	"docora/backend/internal/models"
)

type Processor struct{}

func NewProcessor() *Processor {
	return &Processor{}
}

// MergePDFs concatenates multiple input PDF files into one output PDF
func (p *Processor) MergePDFs(ctx context.Context, inputPaths []string, outputPath string) error {
	if len(inputPaths) < 2 {
		return fmt.Errorf("at least 2 PDF files are required for merging")
	}

	conf := model.NewDefaultConfiguration()
	err := api.MergeCreateFile(ctx, inputPaths, outputPath, false, conf)
	if err != nil {
		return fmt.Errorf("failed to merge PDFs: %w", err)
	}
	return nil
}

// SplitPDF splits a PDF into parts with a given span of pages (e.g. 1 page per file)
func (p *Processor) SplitPDF(ctx context.Context, inputPath, outputDir string, span int) ([]string, error) {
	if span <= 0 {
		span = 1
	}

	conf := model.NewDefaultConfiguration()
	err := api.SplitFile(ctx, inputPath, outputDir, span, conf)
	if err != nil {
		return nil, fmt.Errorf("failed to split PDF: %w", err)
	}

	// Collect generated files in outputDir
	entries, err := os.ReadDir(outputDir)
	if err != nil {
		return nil, err
	}

	var generated []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(strings.ToLower(entry.Name()), ".pdf") {
			generated = append(generated, filepath.Join(outputDir, entry.Name()))
		}
	}
	return generated, nil
}

// CompressPDF optimizes a PDF to reduce its file size
func (p *Processor) CompressPDF(ctx context.Context, inputPath, outputPath string) error {
	conf := model.NewDefaultConfiguration()
	conf.Optimize = true
	conf.OptimizeResourceDicts = true
	conf.OptimizeDuplicateContentStreams = true

	err := api.OptimizeFile(ctx, inputPath, outputPath, conf, nil)
	if err != nil {
		return fmt.Errorf("failed to compress PDF: %w", err)
	}
	return nil
}

// ExtractPages extracts selected pages (e.g. "1", "1-3", "2,4-6") into an output file
func (p *Processor) ExtractPages(ctx context.Context, inputPath, outputPath string, selectedPages []string) error {
	conf := model.NewDefaultConfiguration()
	err := api.CollectFile(ctx, inputPath, outputPath, selectedPages, conf)
	if err != nil {
		return fmt.Errorf("failed to extract pages: %w", err)
	}
	return nil
}

// RotatePages rotates selected pages (or all pages) clockwise by rotation degrees (90, 180, 270)
func (p *Processor) RotatePages(ctx context.Context, inputPath, outputPath string, rotation int, selectedPages []string) error {
	if rotation%90 != 0 {
		return fmt.Errorf("rotation angle must be a multiple of 90 degrees")
	}

	conf := model.NewDefaultConfiguration()
	err := api.RotateFile(ctx, inputPath, outputPath, rotation, selectedPages, conf)
	if err != nil {
		return fmt.Errorf("failed to rotate pages: %w", err)
	}
	return nil
}

// ReorderPages arranges pages into a specified order
func (p *Processor) ReorderPages(ctx context.Context, inputPath, outputPath string, pageOrder []string) error {
	conf := model.NewDefaultConfiguration()
	err := api.CollectFile(ctx, inputPath, outputPath, pageOrder, conf)
	if err != nil {
		return fmt.Errorf("failed to reorder pages: %w", err)
	}
	return nil
}

// DeletePages removes specified pages from the PDF
func (p *Processor) DeletePages(ctx context.Context, inputPath, outputPath string, pagesToDelete []string) error {
	conf := model.NewDefaultConfiguration()
	err := api.RemovePagesFile(ctx, inputPath, outputPath, pagesToDelete, conf)
	if err != nil {
		return fmt.Errorf("failed to remove pages: %w", err)
	}
	return nil
}

// AddWatermark adds a text watermark to selected pages (or all pages if empty)
func (p *Processor) AddWatermark(ctx context.Context, inputPath, outputPath, text string, opacity float64, selectedPages []string) error {
	if text == "" {
		text = "CONFIDENTIAL"
	}
	if opacity <= 0 || opacity > 1.0 {
		opacity = 0.3
	}

	desc := fmt.Sprintf("font:Helvetica, points:48, scale:0.7, opacity:%.2f, rot:45, color:0.5 0.5 0.5", opacity)
	conf := model.NewDefaultConfiguration()
	wm, err := api.TextWatermark(ctx, text, desc, true, false, types.POINTS, conf)
	if err != nil {
		return fmt.Errorf("failed to create watermark configuration: %w", err)
	}

	err = api.AddWatermarksFile(ctx, inputPath, outputPath, selectedPages, wm, conf)
	if err != nil {
		return fmt.Errorf("failed to add watermark to PDF: %w", err)
	}
	return nil
}

// AddPageNumbers adds page numbering in header or footer
func (p *Processor) AddPageNumbers(ctx context.Context, inputPath, outputPath string, position string) error {
	// position: "bottom-right", "bottom-center", "top-right"
	posDesc := "pos:br, off: -15 15"
	if position == "bottom-center" {
		posDesc = "pos:bc, off: 0 15"
	} else if position == "top-right" {
		posDesc = "pos:tr, off: -15 -15"
	}

	desc := fmt.Sprintf("font:Helvetica, points:9, opacity:0.8, color:0.3 0.3 0.3, %s", posDesc)
	conf := model.NewDefaultConfiguration()
	// TextWatermark with "%p of %P" gives Page X of Y
	wm, err := api.TextWatermark(ctx, "Page %p of %P", desc, true, false, types.POINTS, conf)
	if err != nil {
		return fmt.Errorf("failed to build page numbers watermark: %w", err)
	}

	err = api.AddWatermarksFile(ctx, inputPath, outputPath, nil, wm, conf)
	if err != nil {
		return fmt.Errorf("failed to add page numbers: %w", err)
	}
	return nil
}

// ImagesToPDF converts one or more images into a PDF
func (p *Processor) ImagesToPDF(ctx context.Context, imagePaths []string, outputPath string) error {
	if len(imagePaths) == 0 {
		return fmt.Errorf("at least one image is required")
	}

	conf := model.NewDefaultConfiguration()
	imp, err := api.Import("form:A4, pos:c, sc:1.0", types.POINTS)
	if err != nil {
		return fmt.Errorf("failed to configure image import: %w", err)
	}

	err = api.ImportImagesFile(ctx, imagePaths, outputPath, imp, conf)
	if err != nil {
		return fmt.Errorf("failed to convert images to PDF: %w", err)
	}
	return nil
}

// GetPDFMetadata inspects safe metadata (page count, dimensions, encryption status)
func (p *Processor) GetPDFMetadata(ctx context.Context, inputPath string) (*models.PDFMetadataInfo, error) {
	fileInfo, err := os.Stat(inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat file: %w", err)
	}

	count, err := api.PageCountFile(ctx, inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get page count: %w", err)
	}

	conf := model.NewDefaultConfiguration()
	f, err := os.Open(inputPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	info, err := api.PDFInfo(ctx, f, filepath.Base(inputPath), nil, false, conf)
	if err != nil {
		// Fallback to basic info if deep info extraction encounters unusual PDF constructs
		return &models.PDFMetadataInfo{
			PageCount:  count,
			PDFVersion: "1.7",
			FileSize:   fileInfo.Size(),
		}, nil
	}

	meta := &models.PDFMetadataInfo{
		PageCount:   count,
		PDFVersion:  info.Version,
		FileSize:    fileInfo.Size(),
		Title:       info.Title,
		Author:      info.Author,
		Subject:     info.Subject,
		Keywords:    strings.Join(info.Keywords, ", "),
		Creator:     info.Creator,
		IsEncrypted: info.Encrypted,
	}

	return meta, nil
}
