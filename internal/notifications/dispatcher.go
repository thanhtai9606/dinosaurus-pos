package notifications

import (
	"context"
	"encoding/json"
	"fmt"

	"dinosaurus-pos/internal/notifications/channelconfig"
	"dinosaurus-pos/internal/notifications/channels"
	notif_repo "dinosaurus-pos/internal/notifications/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type DispatchEvent struct {
	EventType string
	Subject   string
	Body      string
}

type Dispatcher struct {
	repo notif_repo.Querier
	log  logger.ILogger
}

func NewDispatcher(repo notif_repo.Querier, log logger.ILogger) *Dispatcher {
	return &Dispatcher{repo: repo, log: log}
}

func (d *Dispatcher) Publish(ctx context.Context, ev DispatchEvent) {
	subs, err := d.repo.ListEnabledSubscriptionsForEvent(ctx, ev.EventType)
	if err != nil {
		d.log.Warnf("notifications: list subscriptions failed: %v", err)
		return
	}
	summary := ev.Subject
	if len(summary) > 500 {
		summary = summary[:500]
	}
	for _, sub := range subs {
		d.deliverOne(ctx, ev, sub, summary)
	}
}

func (d *Dispatcher) deliverOne(ctx context.Context, ev DispatchEvent, sub notif_repo.ListEnabledSubscriptionsForEventRow, summary string) {
	sender, err := senderForType(sub.ChannelType, sub.ConfigJson)
	if err != nil {
		d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, notif_repo.NotificationDeliveryStatusFailed, err.Error(), summary)
		return
	}
	msg := channels.Message{
		Subject: ev.Subject,
		Body:    ev.Body,
		ToEmail: sub.UserEmail,
	}
	sendErr := sender.Send(ctx, msg)
	status := notif_repo.NotificationDeliveryStatusSent
	var errText *string
	if sendErr != nil {
		status = notif_repo.NotificationDeliveryStatusFailed
		s := sendErr.Error()
		errText = &s
		d.log.Warnf("notifications: send failed channel=%s event=%s: %v", sub.ChannelID, ev.EventType, sendErr)
	}
	d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, status, errPtr(sendErr), summary)
	_ = errText
}

func (d *Dispatcher) recordDelivery(ctx context.Context, eventType string, channelID, userID uuid.UUID, status notif_repo.NotificationDeliveryStatus, errMsg string, summary string) {
	var errText *string
	if errMsg != "" {
		errText = &errMsg
	}
	_, err := d.repo.InsertNotificationDelivery(ctx, notif_repo.InsertNotificationDeliveryParams{
		EventType:      eventType,
		ChannelID:      pgtype.UUID{Bytes: channelID, Valid: true},
		UserID:         pgtype.UUID{Bytes: userID, Valid: true},
		Status:         status,
		ErrorText:      errText,
		PayloadSummary: &summary,
	})
	if err != nil {
		d.log.Warnf("notifications: failed to log delivery: %v", err)
	}
}

func (d *Dispatcher) SendTest(ctx context.Context, channel notif_repo.NotificationChannel, toEmail string) error {
	sender, err := senderForType(channel.ChannelType, channel.ConfigJson)
	if err != nil {
		return err
	}
	return sender.Send(ctx, channels.Message{
		Subject: "Dinosaurus POS — test notification",
		Body:    "This is a test message from your notification channel configuration.",
		ToEmail: toEmail,
	})
}

func senderForType(channelType notif_repo.NotificationChannelType, raw []byte) (channels.Sender, error) {
	switch channelType {
	case notif_repo.NotificationChannelTypeEmail:
		var c channelconfig.EmailConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return nil, err
		}
		return channels.NewEmailSender(c), nil
	case notif_repo.NotificationChannelTypeMsteamsWebhook:
		var c channelconfig.TeamsWebhookConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return nil, err
		}
		return channels.NewTeamsSender(c), nil
	case notif_repo.NotificationChannelTypeTelegram:
		var c channelconfig.TelegramConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return nil, err
		}
		return channels.NewTelegramSender(c), nil
	case notif_repo.NotificationChannelTypeSms:
		var c channelconfig.SMSConfig
		if err := json.Unmarshal(raw, &c); err != nil {
			return nil, err
		}
		return channels.NewSMSSender(c), nil
	default:
		return nil, fmt.Errorf("unsupported channel type %s", channelType)
	}
}

func errPtr(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}