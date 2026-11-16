package channels

import (
	"context"
	"fmt"
	"strings"

	"firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"dinosaurus-pos/pkg/logger"
	"google.golang.org/api/option"
)

type FCMClient struct {
	client  *messaging.Client
	enabled bool
	log     logger.ILogger
}

func NewFCMClient(credentialsJSON []byte, log logger.ILogger) *FCMClient {
	out := &FCMClient{log: log}
	if len(credentialsJSON) == 0 {
		log.Warn("notifications: FCM disabled — FIREBASE_CREDENTIALS_JSON not set")
		return out
	}
	app, err := firebase.NewApp(context.Background(), nil, option.WithCredentialsJSON(credentialsJSON))
	if err != nil {
		log.Warnf("notifications: FCM init failed: %v", err)
		return out
	}
	client, err := app.Messaging(context.Background())
	if err != nil {
		log.Warnf("notifications: FCM messaging client failed: %v", err)
		return out
	}
	out.client = client
	out.enabled = true
	return out
}

func (f *FCMClient) Enabled() bool {
	return f != nil && f.enabled && f.client != nil
}

func (f *FCMClient) SendToTokens(ctx context.Context, tokens []string, msg Message) error {
	if !f.Enabled() {
		return fmt.Errorf("FCM not configured")
	}
	tokens = dedupeNonEmpty(tokens)
	if len(tokens) == 0 {
		return fmt.Errorf("no device tokens")
	}
	title := strings.TrimSpace(msg.Subject)
	if title == "" {
		title = "Dinosaurus POS"
	}
	body := strings.TrimSpace(msg.Body)
	data := msg.Data
	if data == nil {
		data = map[string]string{}
	}
	if msg.EventType != "" {
		data["event_type"] = msg.EventType
	}
	_, err := f.client.SendEachForMulticast(ctx, &messaging.MulticastMessage{
		Tokens: tokens,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
	})
	return err
}

func dedupeNonEmpty(tokens []string) []string {
	seen := make(map[string]struct{}, len(tokens))
	out := make([]string, 0, len(tokens))
	for _, t := range tokens {
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		out = append(out, t)
	}
	return out
}