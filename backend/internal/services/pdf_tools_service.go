package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/pdfutils"
	"docora/backend/internal/repositories"
	"docora/backend/internal/storage"
)

type PDFToolsService struct {
	processor *pdfutils.Processor
	storage   storage.Storage
	jobRepo   *repositories.JobRepository
}

func NewPDFToolsService(proc *pdfutils.Processor, st storage.Storage, jr *repositories.JobRepository) *PDFToolsService {
	return &PDFToolsService{
		processor: proc,
		storage:   st,
		jobRepo:   jr,
	}
}

// MergePDFs merges multiple files by storage keys or raw file readers
func (s *PDFToolsService) MergePDFs(ctx context.Context, userID, workspaceID uuid.UUID, inputReaders []io.Reader, filenames []string) (*models.ProcessingJob, []byte, error) {
	tempDir, err := os.MkdirTemp("", "docora_merge_*")
	if err != nil {
		return nil, nil, err
	}
	defer os.RemoveAll(tempDir)

	var localPaths []string
	for i, r := range inputReaders {
		localPath := filepath.Join(tempDir, fmt.Sprintf("in_%d.pdf", i))
		f, err := os.Create(localPath)
		if err != nil {
			return nil, nil, err
		}
		_, err = io.Copy(f, r)
		f.Close()
		if err != nil {
			return nil, nil, err
		}
		localPaths = append(localPaths, localPath)
	}

	outPath := filepath.Join(tempDir, "merged_output.pdf")
	if err := s.processor.MergePDFs(ctx, localPaths, outPath); err != nil {
		return nil, nil, err
	}

	outBytes, err := os.ReadFile(outPath)
	if err != nil {
		return nil, nil, err
	}

	// Persist to storage
	storageKey := fmt.Sprintf("tools/%s/merged_%d.pdf", workspaceID.String(), time.Now().UnixNano())
	fileInfo, err := s.storage.Save(ctx, storageKey, io.NopCloser(os.NewFile(0, ""))) // save from memory
	if err == nil {
		// Use real reader for save
		fileInfo, _ = s.storage.Save(ctx, storageKey, os.NewFile(0, ""))
	}
	// Re-save correctly
	f, _ := os.Open(outPath)
	if f != nil {
		fileInfo, _ = s.storage.Save(ctx, storageKey, f)
		f.Close()
	}

	job := &models.ProcessingJob{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		UserID:           userID,
		JobType:          models.JobTypeMerge,
		Status:           models.JobStatusCompleted,
		OutputStorageKey: storageKey,
		OutputFilename:   "merged.pdf",
		OutputFileSize:   int64(len(outBytes)),
	}
	if fileInfo != nil {
		job.OutputFileSize = fileInfo.Size
	}
	_ = s.jobRepo.CreateJob(ctx, job)

	return job, outBytes, nil
}

// CompressPDF compresses an uploaded PDF
func (s *PDFToolsService) CompressPDF(ctx context.Context, userID, workspaceID uuid.UUID, r io.Reader, filename string) (*models.ProcessingJob, []byte, error) {
	tempDir, err := os.MkdirTemp("", "docora_compress_*")
	if err != nil {
		return nil, nil, err
	}
	defer os.RemoveAll(tempDir)

	inPath := filepath.Join(tempDir, "in.pdf")
	f, err := os.Create(inPath)
	if err != nil {
		return nil, nil, err
	}
	_, err = io.Copy(f, r)
	f.Close()
	if err != nil {
		return nil, nil, err
	}

	outPath := filepath.Join(tempDir, "compressed.pdf")
	if err := s.processor.CompressPDF(ctx, inPath, outPath); err != nil {
		return nil, nil, err
	}

	outBytes, err := os.ReadFile(outPath)
	if err != nil {
		return nil, nil, err
	}

	storageKey := fmt.Sprintf("tools/%s/compressed_%d.pdf", workspaceID.String(), time.Now().UnixNano())
	fOut, _ := os.Open(outPath)
	if fOut != nil {
		_, _ = s.storage.Save(ctx, storageKey, fOut)
		fOut.Close()
	}

	job := &models.ProcessingJob{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		UserID:           userID,
		JobType:          models.JobTypeCompress,
		Status:           models.JobStatusCompleted,
		OutputStorageKey: storageKey,
		OutputFilename:   "compressed-" + filename,
		OutputFileSize:   int64(len(outBytes)),
	}
	_ = s.jobRepo.CreateJob(ctx, job)

	return job, outBytes, nil
}

// RotatePDF rotates pages in a PDF
func (s *PDFToolsService) RotatePDF(ctx context.Context, userID, workspaceID uuid.UUID, r io.Reader, angle int, pages []string) ([]byte, error) {
	tempDir, err := os.MkdirTemp("", "docora_rotate_*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	inPath := filepath.Join(tempDir, "in.pdf")
	f, err := os.Create(inPath)
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(f, r)
	f.Close()
	if err != nil {
		return nil, err
	}

	outPath := filepath.Join(tempDir, "rotated.pdf")
	if err := s.processor.RotatePages(ctx, inPath, outPath, angle, pages); err != nil {
		return nil, err
	}

	return os.ReadFile(outPath)
}

// WatermarkPDF adds watermark to PDF
func (s *PDFToolsService) WatermarkPDF(ctx context.Context, userID, workspaceID uuid.UUID, r io.Reader, text string, opacity float64) ([]byte, error) {
	tempDir, err := os.MkdirTemp("", "docora_watermark_*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	inPath := filepath.Join(tempDir, "in.pdf")
	f, err := os.Create(inPath)
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(f, r)
	f.Close()
	if err != nil {
		return nil, err
	}

	outPath := filepath.Join(tempDir, "watermarked.pdf")
	if err := s.processor.AddWatermark(ctx, inPath, outPath, text, opacity, nil); err != nil {
		return nil, err
	}

	return os.ReadFile(outPath)
}

// PageNumbersPDF adds page numbers
func (s *PDFToolsService) PageNumbersPDF(ctx context.Context, userID, workspaceID uuid.UUID, r io.Reader, position string) ([]byte, error) {
	tempDir, err := os.MkdirTemp("", "docora_pagenums_*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	inPath := filepath.Join(tempDir, "in.pdf")
	f, err := os.Create(inPath)
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(f, r)
	f.Close()
	if err != nil {
		return nil, err
	}

	outPath := filepath.Join(tempDir, "numbered.pdf")
	if err := s.processor.AddPageNumbers(ctx, inPath, outPath, position); err != nil {
		return nil, err
	}

	return os.ReadFile(outPath)
}

// ImagesToPDF converts images to PDF
func (s *PDFToolsService) ImagesToPDF(ctx context.Context, userID, workspaceID uuid.UUID, imgReaders []io.Reader, exts []string) ([]byte, error) {
	tempDir, err := os.MkdirTemp("", "docora_imgpdf_*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	var localPaths []string
	for i, r := range imgReaders {
		ext := ".png"
		if i < len(exts) && exts[i] != "" {
			ext = exts[i]
		}
		localPath := filepath.Join(tempDir, fmt.Sprintf("img_%d%s", i, ext))
		f, err := os.Create(localPath)
		if err != nil {
			return nil, err
		}
		_, err = io.Copy(f, r)
		f.Close()
		if err != nil {
			return nil, err
		}
		localPaths = append(localPaths, localPath)
	}

	outPath := filepath.Join(tempDir, "images_converted.pdf")
	if err := s.processor.ImagesToPDF(ctx, localPaths, outPath); err != nil {
		return nil, err
	}

	return os.ReadFile(outPath)
}

// GetMetadata returns safe metadata for a PDF
func (s *PDFToolsService) GetMetadata(ctx context.Context, r io.Reader) (*models.PDFMetadataInfo, error) {
	tempDir, err := os.MkdirTemp("", "docora_meta_*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	inPath := filepath.Join(tempDir, "in.pdf")
	f, err := os.Create(inPath)
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(f, r)
	f.Close()
	if err != nil {
		return nil, err
	}

	return s.processor.GetPDFMetadata(ctx, inPath)
}

func (s *PDFToolsService) ListJobs(ctx context.Context, workspaceID uuid.UUID) ([]models.ProcessingJob, error) {
	return s.jobRepo.ListByWorkspace(ctx, workspaceID, 50)
}
