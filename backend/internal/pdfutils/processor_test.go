package pdfutils

import (
	"context"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

func createTestPNG(t *testing.T, path string) {
	img := image.NewRGBA(image.Rect(0, 0, 100, 100))
	for x := 0; x < 100; x++ {
		for y := 0; y < 100; y++ {
			img.Set(x, y, color.RGBA{R: 50, G: 100, B: 150, A: 255})
		}
	}
	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("failed to create temp png: %v", err)
	}
	defer f.Close()
	if err := png.Encode(f, img); err != nil {
		t.Fatalf("failed to encode png: %v", err)
	}
}

func TestProcessorOperations(t *testing.T) {
	ctx := context.Background()
	proc := NewProcessor()
	tempDir := t.TempDir()

	// 1. Create two test images and convert to PDF
	img1 := filepath.Join(tempDir, "img1.png")
	img2 := filepath.Join(tempDir, "img2.png")
	createTestPNG(t, img1)
	createTestPNG(t, img2)

	pdf1 := filepath.Join(tempDir, "doc1.pdf")
	err := proc.ImagesToPDF(ctx, []string{img1}, pdf1)
	if err != nil {
		t.Fatalf("ImagesToPDF failed: %v", err)
	}

	pdf2 := filepath.Join(tempDir, "doc2.pdf")
	err = proc.ImagesToPDF(ctx, []string{img2}, pdf2)
	if err != nil {
		t.Fatalf("ImagesToPDF failed: %v", err)
	}

	// 2. Test GetPDFMetadata
	meta, err := proc.GetPDFMetadata(ctx, pdf1)
	if err != nil {
		t.Fatalf("GetPDFMetadata failed: %v", err)
	}
	if meta.PageCount != 1 {
		t.Errorf("expected 1 page, got %d", meta.PageCount)
	}

	// 3. Test MergePDFs
	mergedPdf := filepath.Join(tempDir, "merged.pdf")
	err = proc.MergePDFs(ctx, []string{pdf1, pdf2}, mergedPdf)
	if err != nil {
		t.Fatalf("MergePDFs failed: %v", err)
	}

	mergedMeta, err := proc.GetPDFMetadata(ctx, mergedPdf)
	if err != nil {
		t.Fatalf("GetPDFMetadata on merged failed: %v", err)
	}
	if mergedMeta.PageCount != 2 {
		t.Errorf("expected 2 pages in merged PDF, got %d", mergedMeta.PageCount)
	}

	// 4. Test AddWatermark
	watermarkedPdf := filepath.Join(tempDir, "watermarked.pdf")
	err = proc.AddWatermark(ctx, mergedPdf, watermarkedPdf, "VERIFIED", 0.4, nil)
	if err != nil {
		t.Fatalf("AddWatermark failed: %v", err)
	}

	// 5. Test AddPageNumbers
	numberedPdf := filepath.Join(tempDir, "numbered.pdf")
	err = proc.AddPageNumbers(ctx, watermarkedPdf, numberedPdf, "bottom-right")
	if err != nil {
		t.Fatalf("AddPageNumbers failed: %v", err)
	}

	// 6. Test RotatePages
	rotatedPdf := filepath.Join(tempDir, "rotated.pdf")
	err = proc.RotatePages(ctx, numberedPdf, rotatedPdf, 90, []string{"1"})
	if err != nil {
		t.Fatalf("RotatePages failed: %v", err)
	}

	// 7. Test CompressPDF
	compressedPdf := filepath.Join(tempDir, "compressed.pdf")
	err = proc.CompressPDF(ctx, rotatedPdf, compressedPdf)
	if err != nil {
		t.Fatalf("CompressPDF failed: %v", err)
	}
}
