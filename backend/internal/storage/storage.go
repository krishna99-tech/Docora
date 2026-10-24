package storage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
)

var (
	ErrNotFound = errors.New("file not found")
	ErrInvalidKey = errors.New("invalid storage key")
)

type StoredFileInfo struct {
	Key      string
	Size     int64
	SHA256   string
	MimeType string
}

// Storage abstracts persistent file storage (local filesystem or S3)
type Storage interface {
	Save(ctx context.Context, key string, reader io.Reader) (*StoredFileInfo, error)
	Open(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	GetAbsolutePath(key string) (string, error)
}

func ComputeSHA256(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}
