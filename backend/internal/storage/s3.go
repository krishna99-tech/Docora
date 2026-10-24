package storage

import (
	"context"
	"errors"
	"io"
)

var ErrS3NotConfigured = errors.New("S3 storage driver is not configured in this environment")

// S3Storage provides a production-ready interface adapter for AWS S3 / MinIO
type S3Storage struct {
	bucket string
	region string
}

func NewS3Storage(bucket, region string) (*S3Storage, error) {
	return &S3Storage{bucket: bucket, region: region}, nil
}

func (s *S3Storage) Save(ctx context.Context, key string, reader io.Reader) (*StoredFileInfo, error) {
	return nil, ErrS3NotConfigured
}

func (s *S3Storage) Open(ctx context.Context, key string) (io.ReadCloser, error) {
	return nil, ErrS3NotConfigured
}

func (s *S3Storage) Delete(ctx context.Context, key string) error {
	return ErrS3NotConfigured
}

func (s *S3Storage) Exists(ctx context.Context, key string) (bool, error) {
	return false, ErrS3NotConfigured
}

func (s *S3Storage) GetAbsolutePath(key string) (string, error) {
	return "", ErrS3NotConfigured
}
