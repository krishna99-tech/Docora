package config

import (
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv               string
	AppPort              string
	DatabaseURL          string
	JWTSecret            string
	AccessTokenTTL       time.Duration
	RefreshTokenTTL      time.Duration
	DocumentStorageDriver string
	DocumentStoragePath  string
	PDFRenderer          string
	ChromeBin            string
	FrontendURL          string
}

func LoadConfig() (*Config, error) {
	// Try loading .env from current dir or parent dirs
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	appEnv := getEnv("APP_ENV", "development")
	appPort := getEnv("APP_PORT", "8087")
	dbURL := getEnv("DATABASE_URL", "postgres://docora_user:docora_secure_password_123@localhost:5432/docora_db?sslmode=disable")
	jwtSecret := getEnv("JWT_SECRET", "super_secret_jwt_key_docora_receipt_platform_min_32_chars!")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:3005")

	accessTTLStr := getEnv("AUTH_ACCESS_TOKEN_TTL", "15m")
	accessTTL, err := time.ParseDuration(accessTTLStr)
	if err != nil {
		accessTTL = 15 * time.Minute
	}

	refreshTTLStr := getEnv("AUTH_REFRESH_TOKEN_TTL", "168h")
	refreshTTL, err := time.ParseDuration(refreshTTLStr)
	if err != nil {
		refreshTTL = 168 * time.Hour
	}

	storageDriver := getEnv("DOCUMENT_STORAGE_DRIVER", "local")
	storagePath := getEnv("DOCUMENT_STORAGE_PATH", "./storage")
	if !filepath.IsAbs(storagePath) {
		absPath, err := filepath.Abs(storagePath)
		if err == nil {
			storagePath = absPath
		}
	}

	pdfRenderer := getEnv("PDF_RENDERER", "chromedp")
	chromeBin := getEnv("CHROME_BIN", "")

	return &Config{
		AppEnv:               appEnv,
		AppPort:              appPort,
		DatabaseURL:          dbURL,
		JWTSecret:            jwtSecret,
		AccessTokenTTL:       accessTTL,
		RefreshTokenTTL:      refreshTTL,
		DocumentStorageDriver: storageDriver,
		DocumentStoragePath:  storagePath,
		PDFRenderer:          pdfRenderer,
		ChromeBin:            chromeBin,
		FrontendURL:          frontendURL,
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

func GetEnvInt(key string, defaultVal int) int {
	if val, ok := os.LookupEnv(key); ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}
