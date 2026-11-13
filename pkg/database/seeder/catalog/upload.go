package catalog

import (
	cloudflarer2 "dinosaurus-pos/pkg/cloudflare-r2"
	"dinosaurus-pos/pkg/logger"
	"context"
	"fmt"
	"io"
	"net/http"
)

func uploadImageFromURL(ctx context.Context, r2Client cloudflarer2.IR2, urlStr string, folder string, id string, log logger.ILogger) *string {
	if urlStr == "" || r2Client == nil {
		if urlStr == "" {
			return nil
		}
		return &urlStr
	}

	req, err := http.NewRequestWithContext(ctx, "GET", urlStr, nil)
	if err != nil {
		log.Warnf("Failed to create request for %s: %v", urlStr, err)
		return &urlStr
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Warnf("Failed to download image from %s: %v", urlStr, err)
		return &urlStr
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Warnf("Failed to download image from %s, status: %d", urlStr, resp.StatusCode)
		return &urlStr
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Warnf("Failed to read image data from %s: %v", urlStr, err)
		return &urlStr
	}

	objectName := fmt.Sprintf("%s/%s.jpg", folder, id)
	_, err = r2Client.UploadFile(ctx, objectName, data, "image/jpeg")
	if err != nil {
		log.Warnf("Failed to upload image to object storage for %s: %v", objectName, err)
		return &urlStr
	}

	return &objectName
}
