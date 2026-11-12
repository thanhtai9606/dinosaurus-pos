package products

import (
	cloudflarer2 "POS-kasir/pkg/cloudflare-r2"
	"POS-kasir/pkg/logger"
	"context"
	"fmt"
	"strings"
)

type ProductImageRepository struct {
	r2  cloudflarer2.IR2
	log logger.ILogger
}

func (p ProductImageRepository) UploadImage(ctx context.Context, filename string, data []byte) (string, error) {
	if p.r2 == nil {
		p.log.Errorf("UploadImage | R2 storage is not initialized")
		return "", nil // or error, but let's avoid panic
	}
	url, err := p.r2.UploadFile(ctx, filename, data, "image/jpeg")
	if err != nil {
		p.log.Errorf("Failed to upload product image to R2: %v", err)
		return "", err
	}
	return url, nil
}

func (p ProductImageRepository) PrdImageLink(ctx context.Context, prdID string, image string) (string, error) {
	p.log.Infof("PrdImageLink called for product %s with image %s", prdID, image)
	if image == "" {
		return "", nil
	}
	if strings.HasPrefix(image, "http://") || strings.HasPrefix(image, "https://") {
		return image, nil
	}

	if p.r2 == nil {
		p.log.Warnf("PrdImageLink | R2 storage is not initialized")
		return "", fmt.Errorf("object storage not configured")
	}

	url, err := p.r2.GetFileShareLink(ctx, image)
	if err != nil {
		p.log.Errorf("Failed to get product image link from R2: %v", err)
		return "", err
	}
	if url == "" {
		return "", fmt.Errorf("empty share link for %q", image)
	}
	return url, nil
}

type IProductImageRepository interface {
	UploadImage(ctx context.Context, filename string, data []byte) (string, error)
	PrdImageLink(ctx context.Context, prdID string, image string) (string, error)
}

func NewProductImageRepository(r2 cloudflarer2.IR2, log logger.ILogger) IProductImageRepository {
	return &ProductImageRepository{
		r2:  r2,
		log: log,
	}
}
