package storage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type LocalStorage struct {
	basePath string
}

func NewLocalStorage(basePath string) (*LocalStorage, error) {
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory %s: %w", basePath, err)
	}
	return &LocalStorage{basePath: basePath}, nil
}

func (l *LocalStorage) resolvePath(key string) (string, error) {
	cleanKey := filepath.Clean(key)
	if strings.HasPrefix(cleanKey, "..") || filepath.IsAbs(cleanKey) {
		return "", ErrInvalidKey
	}
	fullPath := filepath.Join(l.basePath, cleanKey)
	rel, err := filepath.Rel(l.basePath, fullPath)
	if err != nil || strings.HasPrefix(rel, "..") {
		return "", ErrInvalidKey
	}
	return fullPath, nil
}

func (l *LocalStorage) Save(ctx context.Context, key string, reader io.Reader) (*StoredFileInfo, error) {
	fullPath, err := l.resolvePath(key)
	if err != nil {
		return nil, err
	}

	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create parent dir: %w", err)
	}

	// Write to temp file first for atomic persistence
	tempFile, err := os.CreateTemp(dir, "upload-*.tmp")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	tempName := tempFile.Name()
	defer func() {
		_ = tempFile.Close()
		_ = os.Remove(tempName) // no-op if renamed
	}()

	hasher := sha256.New()
	multiWriter := io.MultiWriter(tempFile, hasher)

	written, err := io.Copy(multiWriter, reader)
	if err != nil {
		return nil, fmt.Errorf("failed writing file stream: %w", err)
	}

	if err := tempFile.Close(); err != nil {
		return nil, fmt.Errorf("failed closing temp file: %w", err)
	}

	// Rename temp file to target path
	if err := os.Rename(tempName, fullPath); err != nil {
		return nil, fmt.Errorf("failed moving file to destination: %w", err)
	}

	sha := hex.EncodeToString(hasher.Sum(nil))

	return &StoredFileInfo{
		Key:      key,
		Size:     written,
		SHA256:   sha,
		MimeType: "application/pdf",
	}, nil
}

func (l *LocalStorage) Open(ctx context.Context, key string) (io.ReadCloser, error) {
	fullPath, err := l.resolvePath(key)
	if err != nil {
		return nil, err
	}

	file, err := os.Open(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return file, nil
}

func (l *LocalStorage) Delete(ctx context.Context, key string) error {
	fullPath, err := l.resolvePath(key)
	if err != nil {
		return err
	}

	err = os.Remove(fullPath)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (l *LocalStorage) Exists(ctx context.Context, key string) (bool, error) {
	fullPath, err := l.resolvePath(key)
	if err != nil {
		return false, err
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return !info.IsDir(), nil
}

func (l *LocalStorage) GetAbsolutePath(key string) (string, error) {
	return l.resolvePath(key)
}
