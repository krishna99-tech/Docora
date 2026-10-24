package verification

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/skip2/go-qrcode"
)

type Verifier struct {
	baseURL string
}

func NewVerifier(baseURL string) *Verifier {
	if baseURL == "" {
		baseURL = "http://localhost:3005"
	}
	return &Verifier{baseURL: baseURL}
}

// GenerateVerificationToken generates a high-entropy unguessable token
func (v *Verifier) GenerateVerificationToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	return "docv_" + hex.EncodeToString(b), nil
}

// GenerateQRCodePNG generates a PNG byte slice for a QR code pointing to the public verification URL
func (v *Verifier) GenerateQRCodePNG(verificationToken string) ([]byte, string, error) {
	verificationURL := fmt.Sprintf("%s/verify/%s", v.baseURL, verificationToken)
	qrBytes, err := qrcode.Encode(verificationURL, qrcode.Medium, 256)
	if err != nil {
		return nil, "", fmt.Errorf("failed to encode QR code: %w", err)
	}
	return qrBytes, verificationURL, nil
}

// ComputePDFHash calculates the authentic SHA-256 hex digest of exact PDF bytes
func (v *Verifier) ComputePDFHash(pdfBytes []byte) string {
	hash := sha256.Sum256(pdfBytes)
	return hex.EncodeToString(hash[:])
}

// VerifyIntegrity compares the stored expected hash against the recomputed hash of actual PDF bytes
func (v *Verifier) VerifyIntegrity(storedExpectedHash string, actualPDFBytes []byte) bool {
	if storedExpectedHash == "" || len(actualPDFBytes) == 0 {
		return false
	}
	actualHash := v.ComputePDFHash(actualPDFBytes)
	return actualHash == storedExpectedHash
}
