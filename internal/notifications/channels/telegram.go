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

func NewTelegramSender(cfg channelconfig.TelegramConfig) Sender {
	return &telegramSender{cfg: cfg, client: &http.Client{Timeout: 15 * time.Second}}
}

type telegramSender struct {
	cfg    channelconfig.TelegramConfig
	client *http.Client
}

func (s *telegramSender) Send(ctx context.Context, msg Message) error {
	token := strings.TrimSpace(s.cfg.BotToken)
	chatID := strings.TrimSpace(s.cfg.DefaultChatID)
	if token == "" || chatID == "" {
		return fmt.Errorf("telegram bot_token and default_chat_id required")
	}
	text := msg.Body
	if text == "" {
		text = msg.Subject
	}
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	payload, err := json.Marshal(map[string]string{
		"chat_id": chatID,
		"text":    text,
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(payload))
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
		return fmt.Errorf("telegram api returned %d", res.StatusCode)
	}
	return nil
}