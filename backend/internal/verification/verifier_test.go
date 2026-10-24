package verification

import (
	"strings"
	"testing"
)

func TestVerifier(t *testing.T) {
	v := NewVerifier("https://docora.app")

	token, err := v.GenerateVerificationToken()
	if err != nil {
		t.Fatalf("GenerateVerificationToken failed: %v", err)
	}
	if !strings.HasPrefix(token, "docv_") {
		t.Errorf("expected token prefix docv_, got %s", token)
	}

	qrBytes, qrURL, err := v.GenerateQRCodePNG(token)
	if err != nil {
		t.Fatalf("GenerateQRCodePNG failed: %v", err)
	}
	if len(qrBytes) == 0 {
		t.Error("expected non-empty QR code bytes")
	}
	if !strings.Contains(qrURL, token) {
		t.Errorf("expected qrURL to contain token, got %s", qrURL)
	}

	samplePDFBytes := []byte("%PDF-1.7 Authentic Docora Test Payload %EOF")
	hash := v.ComputePDFHash(samplePDFBytes)
	if len(hash) != 64 {
		t.Errorf("expected 64-char sha256 hex string, got len %d", len(hash))
	}

	if !v.VerifyIntegrity(hash, samplePDFBytes) {
		t.Error("expected integrity check to pass for identical bytes")
	}

	tamperedBytes := []byte("%PDF-1.7 Tampered Payload %EOF")
	if v.VerifyIntegrity(hash, tamperedBytes) {
		t.Error("expected integrity check to fail for tampered bytes")
	}
}
