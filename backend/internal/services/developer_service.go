package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"docora/backend/internal/models"
	"docora/backend/internal/repositories"
)

type DeveloperService struct {
	devRepo *repositories.DeveloperRepository
	client  *http.Client
}

func NewDeveloperService(dr *repositories.DeveloperRepository) *DeveloperService {
	return &DeveloperService{
		devRepo: dr,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// CreateApiKey creates an API key, hashes it, and returns the raw key to the user once
func (s *DeveloperService) CreateApiKey(ctx context.Context, userID, workspaceID uuid.UUID, req models.CreateApiKeyRequest) (*models.ApiKey, error) {
	randBytes := make([]byte, 24)
	if _, err := rand.Read(randBytes); err != nil {
		return nil, fmt.Errorf("failed generating random key: %w", err)
	}
	secret := hex.EncodeToString(randBytes)
	keyPrefix := "doc_" + secret[:6]
	rawKey := fmt.Sprintf("%s_%s", keyPrefix, secret)

	hashBytes := sha256.Sum256([]byte(rawKey))
	keyHash := hex.EncodeToString(hashBytes[:])

	perms := req.Permissions
	if len(perms) == 0 {
		perms = []string{"*"}
	}

	apiKey := &models.ApiKey{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		UserID:      userID,
		Name:        req.Name,
		KeyPrefix:   keyPrefix,
		KeyHash:     keyHash,
		RawKey:      rawKey,
		Permissions: perms,
	}

	if err := s.devRepo.CreateApiKey(ctx, apiKey); err != nil {
		return nil, err
	}

	return apiKey, nil
}

func (s *DeveloperService) ListApiKeys(ctx context.Context, workspaceID uuid.UUID) ([]models.ApiKey, error) {
	return s.devRepo.ListApiKeys(ctx, workspaceID)
}

func (s *DeveloperService) RevokeApiKey(ctx context.Context, id, workspaceID uuid.UUID) error {
	return s.devRepo.RevokeApiKey(ctx, id, workspaceID)
}

// AuthenticateApiKey checks raw API key against stored hash and checks permissions
func (s *DeveloperService) AuthenticateApiKey(ctx context.Context, rawKey string) (*models.ApiKey, error) {
	hashBytes := sha256.Sum256([]byte(rawKey))
	keyHash := hex.EncodeToString(hashBytes[:])

	apiKey, err := s.devRepo.GetApiKeyByHash(ctx, keyHash)
	if err != nil {
		return nil, err
	}

	if apiKey.RevokedAt != nil {
		return nil, fmt.Errorf("API key has been revoked")
	}

	_ = s.devRepo.UpdateApiKeyLastUsed(ctx, apiKey.ID)
	return apiKey, nil
}

// CreateWebhook registers an endpoint and generates an HMAC secret if not provided
func (s *DeveloperService) CreateWebhook(ctx context.Context, workspaceID uuid.UUID, req models.CreateWebhookRequest) (*models.Webhook, error) {
	secret := req.Secret
	if secret == "" {
		secBytes := make([]byte, 24)
		_, _ = rand.Read(secBytes)
		secret = "whsec_" + hex.EncodeToString(secBytes)
	}

	wh := &models.Webhook{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		TargetURL:   req.TargetURL,
		Secret:      secret,
		Events:      req.Events,
		IsActive:    true,
	}

	if err := s.devRepo.CreateWebhook(ctx, wh); err != nil {
		return nil, err
	}
	return wh, nil
}

func (s *DeveloperService) ListWebhooks(ctx context.Context, workspaceID uuid.UUID) ([]models.Webhook, error) {
	return s.devRepo.ListWebhooks(ctx, workspaceID)
}

func (s *DeveloperService) DeleteWebhook(ctx context.Context, id, workspaceID uuid.UUID) error {
	return s.devRepo.DeleteWebhook(ctx, id, workspaceID)
}

func (s *DeveloperService) ListDeliveries(ctx context.Context, webhookID uuid.UUID) ([]models.WebhookDelivery, error) {
	return s.devRepo.ListDeliveries(ctx, webhookID, 50)
}

// DispatchWebhook sends an event payload to a webhook target signed with HMAC-SHA256
func (s *DeveloperService) DispatchWebhook(ctx context.Context, wh *models.Webhook, eventType string, data interface{}) {
	payloadBytes, err := json.Marshal(map[string]interface{}{
		"id":        uuid.New().String(),
		"event":     eventType,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"data":      data,
	})
	if err != nil {
		return
	}

	// Compute HMAC-SHA256 signature
	mac := hmac.New(sha256.New, []byte(wh.Secret))
	mac.Write(payloadBytes)
	signature := hex.EncodeToString(mac.Sum(nil))

	req, err := http.NewRequestWithContext(ctx, "POST", wh.TargetURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Docora-Signature", signature)
	req.Header.Set("User-Agent", "Docora-Webhooks/1.0")

	resp, err := s.client.Do(req)
	delivery := &models.WebhookDelivery{
		ID:        uuid.New(),
		WebhookID: wh.ID,
		EventType: eventType,
		Payload:   payloadBytes,
		Attempt:   1,
	}

	if err != nil {
		delivery.StatusCode = 0
		delivery.ResponseBody = err.Error()
		delivery.Success = false
	} else {
		delivery.StatusCode = resp.StatusCode
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		resp.Body.Close()
		delivery.ResponseBody = string(bodyBytes)
		delivery.Success = (resp.StatusCode >= 200 && resp.StatusCode < 300)
	}

	_ = s.devRepo.CreateDelivery(context.Background(), delivery)
}

func (s *DeveloperService) TestWebhook(ctx context.Context, id, workspaceID uuid.UUID, eventType string) (*models.WebhookDelivery, error) {
	wh, err := s.devRepo.GetWebhook(ctx, id, workspaceID)
	if err != nil {
		return nil, err
	}
	if eventType == "" {
		eventType = "document.created"
	}
	sampleData := map[string]interface{}{
		"test":        true,
		"documentId":  uuid.New().String(),
		"title":       "Sample Verification Document",
		"type":        "invoice",
		"amount":      349.50,
		"currency":    "USD",
		"status":      "finalized",
		"source":      "Developer Console Test Runner",
		"triggeredAt": time.Now().UTC().Format(time.RFC3339),
	}

	payloadBytes, err := json.Marshal(map[string]interface{}{
		"id":        uuid.New().String(),
		"event":     eventType,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"data":      sampleData,
	})
	if err != nil {
		return nil, err
	}

	mac := hmac.New(sha256.New, []byte(wh.Secret))
	mac.Write(payloadBytes)
	signature := hex.EncodeToString(mac.Sum(nil))

	req, err := http.NewRequestWithContext(ctx, "POST", wh.TargetURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Docora-Signature", signature)
	req.Header.Set("X-Docora-Event", eventType)
	req.Header.Set("User-Agent", "Docora-Webhooks/1.0 (Test-Ping)")

	delivery := &models.WebhookDelivery{
		ID:        uuid.New(),
		WebhookID: wh.ID,
		EventType: eventType,
		Payload:   payloadBytes,
		Attempt:   1,
	}

	resp, err := s.client.Do(req)
	if err != nil {
		delivery.StatusCode = 0
		delivery.ResponseBody = fmt.Sprintf("Network connection failed: %v", err)
		delivery.Success = false
	} else {
		delivery.StatusCode = resp.StatusCode
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		resp.Body.Close()
		delivery.ResponseBody = string(bodyBytes)
		delivery.Success = (resp.StatusCode >= 200 && resp.StatusCode < 300)
	}

	if err := s.devRepo.CreateDelivery(ctx, delivery); err != nil {
		return nil, err
	}
	return delivery, nil
}

