package channelconfig

import (
	"encoding/json"
	"strings"
)

const SecretMask = "********"

type EmailConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	From     string `json:"from"`
	UseTLS   bool   `json:"use_tls"`
}

type TeamsWebhookConfig struct {
	WebhookURL string `json:"webhook_url,omitempty"`
}

type TelegramConfig struct {
	BotToken      string `json:"bot_token,omitempty"`
	DefaultChatID string `json:"default_chat_id"`
}

type SMSConfig struct {
	Provider string `json:"provider"`
	APIKey   string `json:"api_key,omitempty"`
	SenderID string `json:"sender_id"`
}

func mergeStringSecret(incoming, existing string) string {
	incoming = strings.TrimSpace(incoming)
	if incoming == "" || incoming == SecretMask {
		return existing
	}
	return incoming
}

func maskEmailConfig(c EmailConfig) EmailConfig {
	if c.Password != "" {
		c.Password = SecretMask
	}
	return c
}

func maskTeamsConfig(c TeamsWebhookConfig) TeamsWebhookConfig {
	if c.WebhookURL != "" {
		c.WebhookURL = SecretMask
	}
	return c
}

func maskTelegramConfig(c TelegramConfig) TelegramConfig {
	if c.BotToken != "" {
		c.BotToken = SecretMask
	}
	return c
}

func maskSMSConfig(c SMSConfig) SMSConfig {
	if c.APIKey != "" {
		c.APIKey = SecretMask
	}
	return c
}

func MergeConfigJSON(channelType string, incoming, existing []byte) ([]byte, error) {
	switch channelType {
	case "email":
		var in, ex EmailConfig
		_ = json.Unmarshal(existing, &ex)
		if err := json.Unmarshal(incoming, &in); err != nil {
			return nil, err
		}
		ex.Host = strings.TrimSpace(in.Host)
		ex.Port = in.Port
		ex.Username = strings.TrimSpace(in.Username)
		ex.Password = mergeStringSecret(in.Password, ex.Password)
		ex.From = strings.TrimSpace(in.From)
		ex.UseTLS = in.UseTLS
		return json.Marshal(ex)
	case "msteams_webhook":
		var in, ex TeamsWebhookConfig
		_ = json.Unmarshal(existing, &ex)
		if err := json.Unmarshal(incoming, &in); err != nil {
			return nil, err
		}
		ex.WebhookURL = mergeStringSecret(in.WebhookURL, ex.WebhookURL)
		return json.Marshal(ex)
	case "telegram":
		var in, ex TelegramConfig
		_ = json.Unmarshal(existing, &ex)
		if err := json.Unmarshal(incoming, &in); err != nil {
			return nil, err
		}
		ex.BotToken = mergeStringSecret(in.BotToken, ex.BotToken)
		ex.DefaultChatID = strings.TrimSpace(in.DefaultChatID)
		return json.Marshal(ex)
	case "sms":
		var in, ex SMSConfig
		_ = json.Unmarshal(existing, &ex)
		if err := json.Unmarshal(incoming, &in); err != nil {
			return nil, err
		}
		ex.Provider = strings.TrimSpace(in.Provider)
		ex.APIKey = mergeStringSecret(in.APIKey, ex.APIKey)
		ex.SenderID = strings.TrimSpace(in.SenderID)
		return json.Marshal(ex)
	default:
		return incoming, nil
	}
}

func MaskConfigForResponse(channelType string, raw []byte) ([]byte, error) {
	switch channelType {
	case "email":
		var c EmailConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return raw, err
		}
		return json.Marshal(maskEmailConfig(c))
	case "msteams_webhook":
		var c TeamsWebhookConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return raw, err
		}
		return json.Marshal(maskTeamsConfig(c))
	case "telegram":
		var c TelegramConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return raw, err
		}
		return json.Marshal(maskTelegramConfig(c))
	case "sms":
		var c SMSConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return raw, err
		}
		return json.Marshal(maskSMSConfig(c))
	default:
		return raw, nil
	}
}