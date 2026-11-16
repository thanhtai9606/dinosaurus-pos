package channels

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"dinosaurus-pos/internal/notifications/channelconfig"
)

func NewSMSSender(cfg channelconfig.SMSConfig) Sender {
	return &smsSender{cfg: cfg, client: &http.Client{Timeout: 20 * time.Second}}
}

type smsSender struct {
	cfg    channelconfig.SMSConfig
	client *http.Client
}

func (s *smsSender) Send(ctx context.Context, msg Message) error {
	to := strings.TrimSpace(msg.ToPhone)
	if to == "" {
		to = strings.TrimSpace(s.cfg.DefaultPhone)
	}
	if to == "" {
		return fmt.Errorf("sms recipient phone required (user phone or channel default_phone)")
	}
	body := strings.TrimSpace(msg.Body)
	if body == "" {
		body = strings.TrimSpace(msg.Subject)
	}
	if body == "" {
		return fmt.Errorf("sms message body required")
	}
	provider := strings.ToLower(strings.TrimSpace(s.cfg.Provider))
	switch provider {
	case "twilio":
		return s.sendTwilio(ctx, to, body)
	case "esms", "brandsms", "vn":
		return s.sendESMS(ctx, to, body)
	case "generic", "http", "":
		return s.sendGeneric(ctx, to, body)
	default:
		return s.sendGeneric(ctx, to, body)
	}
}

func (s *smsSender) sendTwilio(ctx context.Context, to, body string) error {
	sid := strings.TrimSpace(s.cfg.AccountSID)
	token := strings.TrimSpace(s.cfg.APISecret)
	if sid == "" {
		sid = strings.TrimSpace(s.cfg.APIKey)
	}
	if token == "" {
		token = strings.TrimSpace(s.cfg.APIKey)
	}
	if sid == "" || token == "" {
		return fmt.Errorf("twilio account_sid and api_secret required")
	}
	form := url.Values{}
	form.Set("To", to)
	form.Set("From", strings.TrimSpace(s.cfg.SenderID))
	form.Set("Body", body)
	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", sid)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.SetBasicAuth(sid, token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return s.do(req)
}

func (s *smsSender) sendESMS(ctx context.Context, to, body string) error {
	apiKey := strings.TrimSpace(s.cfg.APIKey)
	brand := strings.TrimSpace(s.cfg.SenderID)
	if apiKey == "" || brand == "" {
		return fmt.Errorf("esms api_key and sender_id required")
	}
	payload := map[string]string{
		"ApiKey":    apiKey,
		"SecretKey": strings.TrimSpace(s.cfg.APISecret),
		"Phone":     to,
		"Content":   body,
		"Brandname": brand,
		"SmsType":   "2",
	}
	apiURL := "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/"
	if u := strings.TrimSpace(s.cfg.BaseURL); u != "" {
		apiURL = u
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	return s.do(req)
}

func (s *smsSender) sendGeneric(ctx context.Context, to, body string) error {
	base := strings.TrimSpace(s.cfg.BaseURL)
	if base == "" {
		return fmt.Errorf("sms base_url required for generic/http provider")
	}
	payload := map[string]string{
		"to":      to,
		"from":    strings.TrimSpace(s.cfg.SenderID),
		"message": body,
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if k := strings.TrimSpace(s.cfg.APIKey); k != "" {
		req.Header.Set("Authorization", "Bearer "+k)
	}
	return s.do(req)
}

func (s *smsSender) do(req *http.Request) error {
	res, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		snippet, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return fmt.Errorf("sms api returned %d: %s", res.StatusCode, strings.TrimSpace(string(snippet)))
	}
	return nil
}