package channels

import (
	"context"
	"fmt"

	"dinosaurus-pos/internal/notifications/channelconfig"
)

func NewSMSSender(cfg channelconfig.SMSConfig) Sender {
	return &smsSender{cfg: cfg}
}

type smsSender struct {
	cfg channelconfig.SMSConfig
}

func (s *smsSender) Send(ctx context.Context, msg Message) error {
	_ = ctx
	_ = msg
	if s.cfg.Provider == "" {
		return fmt.Errorf("sms provider not configured")
	}
	return fmt.Errorf("sms delivery is not implemented yet for provider %s", s.cfg.Provider)
}