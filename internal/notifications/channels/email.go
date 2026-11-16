package channels

import (
	"context"
	"fmt"
	"net/smtp"
	"strings"

	"dinosaurus-pos/internal/notifications/channelconfig"
)

func NewEmailSender(cfg channelconfig.EmailConfig) Sender {
	return &emailSender{cfg: cfg}
}

type emailSender struct {
	cfg channelconfig.EmailConfig
}

func (s *emailSender) Send(ctx context.Context, msg Message) error {
	_ = ctx
	to := strings.TrimSpace(msg.ToEmail)
	if to == "" {
		return fmt.Errorf("email recipient required")
	}
	from := strings.TrimSpace(s.cfg.From)
	if from == "" {
		return fmt.Errorf("email from address required")
	}
	host := strings.TrimSpace(s.cfg.Host)
	port := s.cfg.Port
	if port <= 0 {
		port = 587
	}
	addr := fmt.Sprintf("%s:%d", host, port)
	subject := msg.Subject
	if subject == "" {
		subject = "Notification"
	}
	body := strings.TrimSpace(msg.Body)
	if body == "" {
		body = subject
	}
	headers := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n",
		from, to, subject)
	payload := []byte(headers + body)
	var auth smtp.Auth
	if strings.TrimSpace(s.cfg.Username) != "" {
		auth = smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, host)
	}
	return smtp.SendMail(addr, auth, from, []string{to}, payload)
}