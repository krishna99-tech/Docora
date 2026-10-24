package tests

import (
	"bytes"
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/config"
	"docora/backend/internal/models"
	"docora/backend/internal/pdf"
	"docora/backend/internal/services"
	"docora/backend/internal/storage"
)

func TestLocalStorageOperations(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "docora-storage-test-*")
	if err != nil {
		t.Fatalf("failed creating temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	store, err := storage.NewLocalStorage(tempDir)
	if err != nil {
		t.Fatalf("failed initializing local storage: %v", err)
	}

	ctx := context.Background()
	testData := []byte("%PDF-1.4 sample pdf content for unit testing")
	testKey := "users/123/receipts/REC-00001.pdf"

	// 1. Save
	info, err := store.Save(ctx, testKey, bytes.NewReader(testData))
	if err != nil {
		t.Fatalf("failed saving file: %v", err)
	}
	if info.Size != int64(len(testData)) {
		t.Errorf("expected size %d, got %d", len(testData), info.Size)
	}
	if info.SHA256 == "" {
		t.Errorf("expected non-empty SHA256 checksum")
	}

	// 2. Exists
	exists, err := store.Exists(ctx, testKey)
	if err != nil || !exists {
		t.Errorf("expected file to exist, got exists=%v err=%v", exists, err)
	}

	// 3. Open & Read
	reader, err := store.Open(ctx, testKey)
	if err != nil {
		t.Fatalf("failed opening stored file: %v", err)
	}
	var readBuf bytes.Buffer
	_, _ = readBuf.ReadFrom(reader)
	_ = reader.Close()

	if !bytes.Equal(readBuf.Bytes(), testData) {
		t.Errorf("read content does not match original data")
	}

	// 4. Path traversal attempt must be rejected
	_, err = store.Save(ctx, "../../../evil.txt", bytes.NewReader(testData))
	if err == nil {
		t.Errorf("expected error on path traversal attempt, got nil")
	}

	// 5. Delete
	err = store.Delete(ctx, testKey)
	if err != nil {
		t.Errorf("failed deleting file: %v", err)
	}
	exists, _ = store.Exists(ctx, testKey)
	if exists {
		t.Errorf("file should not exist after deletion")
	}
}

func TestAuthTokenValidation(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:      "test-secret-key-minimum-32-chars-long!",
		AccessTokenTTL: 15 * time.Minute,
	}

	authSvc := services.NewAuthService(nil, cfg)

	// Test invalid token
	_, err := authSvc.ValidateAccessToken("invalid.token.string")
	if err == nil {
		t.Errorf("expected error for invalid token, got nil")
	}
}

func TestFallbackPDFGeneration(t *testing.T) {
	renderer := pdf.NewRenderer("", 10*time.Second)

	doc := &models.Document{
		ID:             uuid.New(),
		DocumentNumber: "REC-00042",
		DocumentType:   models.TypeReceipt,
		Title:          "Retail Purchase Receipt",
		Status:         models.StatusDraft,
		Currency:       "USD",
		TotalMinor:     12500,
		AmountPaidMinor: 12500,
		BalanceMinor:   0,
		IssueDate:      time.Now(),
	}

	data := &pdf.RenderData{
		Document:        doc,
		BusinessProfile: &models.BusinessProfile{BusinessName: "Acme Enterprises"},
		PageSize:        "A4",
	}

	pdfBytes, err := renderer.Render(context.Background(), data)
	if err != nil {
		t.Fatalf("failed generating PDF: %v", err)
	}

	if len(pdfBytes) < 50 {
		t.Fatalf("generated PDF too small: %d bytes", len(pdfBytes))
	}

	// Standard PDF must start with %PDF-
	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		t.Errorf("generated output is not a valid PDF header: %s", string(pdfBytes[:10]))
	}
}
