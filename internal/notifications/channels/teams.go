package channels

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"dinosaurus-pos/internal/notifications/channelconfig"
)

func NewTeamsSender(cfg channelconfig.TeamsWebhookConfig) Sender {
	return &teamsSender{cfg: cfg, client: &http.Client{Timeout: 15 * time.Second}}
}

type teamsSender struct {
	cfg    channelconfig.TeamsWebhookConfig
	client *http.Client
}

func (s *teamsSender) Send(ctx context.Context, msg Message) error {
	url := strings.TrimSpace(s.cfg.WebhookURL)
	if url == "" {
		return fmt.Errorf("teams webhook url required")
	}
	text := msg.Body
	if text == "" {
		text = msg.Subject
	}
	payload, err := json.Marshal(map[string]string{"text": text})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("teams webhook returned %d", res.StatusCode)
	}
	return nil
}