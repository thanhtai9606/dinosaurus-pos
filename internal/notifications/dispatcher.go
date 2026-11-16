package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

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
	fcm  *channels.FCMClient
	log  logger.ILogger
}

func NewDispatcher(repo notif_repo.Querier, fcm *channels.FCMClient, log logger.ILogger) *Dispatcher {
	return &Dispatcher{repo: repo, fcm: fcm, log: log}
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
	reportOnlyEmail := IsReportEvent(ev.EventType)
	for _, sub := range subs {
		if reportOnlyEmail && sub.ChannelType != notif_repo.NotificationChannelTypeEmail {
			continue
		}
		d.deliverOne(ctx, ev, sub, summary)
	}
}

func (d *Dispatcher) deliverOne(ctx context.Context, ev DispatchEvent, sub notif_repo.ListEnabledSubscriptionsForEventRow, summary string) {
	if sub.ChannelType == notif_repo.NotificationChannelTypeFirebase {
		d.deliverFirebase(ctx, ev, sub, summary)
		return
	}
	sender, err := senderForType(sub.ChannelType, sub.ConfigJson)
	if err != nil {
		d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, notif_repo.NotificationDeliveryStatusFailed, err.Error(), summary)
		return
	}
	msg := channels.Message{
		Subject:   ev.Subject,
		Body:      ev.Body,
		ToEmail:   sub.UserEmail,
		EventType: ev.EventType,
	}
	if sub.ChannelType == notif_repo.NotificationChannelTypeSms {
		if sub.UserPhone != nil {
			msg.ToPhone = strings.TrimSpace(*sub.UserPhone)
		}
	}
	sendErr := sender.Send(ctx, msg)
	status := notif_repo.NotificationDeliveryStatusSent
	if sendErr != nil {
		status = notif_repo.NotificationDeliveryStatusFailed
		d.log.Warnf("notifications: send failed channel=%s event=%s: %v", sub.ChannelID, ev.EventType, sendErr)
	}
	d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, status, errPtr(sendErr), summary)
}

func (d *Dispatcher) deliverFirebase(ctx context.Context, ev DispatchEvent, sub notif_repo.ListEnabledSubscriptionsForEventRow, summary string) {
	if d.fcm == nil || !d.fcm.Enabled() {
		d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, notif_repo.NotificationDeliveryStatusFailed, "FCM not configured", summary)
		return
	}
	rows, err := d.repo.ListDeviceTokensByUser(ctx, sub.UserID)
	if err != nil {
		d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, notif_repo.NotificationDeliveryStatusFailed, err.Error(), summary)
		return
	}
	tokens := make([]string, 0, len(rows))
	for _, row := range rows {
		tokens = append(tokens, row.Token)
	}
	msg := channels.Message{
		Subject:   ev.Subject,
		Body:      ev.Body,
		EventType: ev.EventType,
		Data:      map[string]string{"event_type": ev.EventType},
	}
	sendErr := d.fcm.SendToTokens(ctx, tokens, msg)
	status := notif_repo.NotificationDeliveryStatusSent
	if sendErr != nil {
		status = notif_repo.NotificationDeliveryStatusFailed
		d.log.Warnf("notifications: FCM failed user=%s event=%s: %v", sub.UserID, ev.EventType, sendErr)
	}
	d.recordDelivery(ctx, ev.EventType, sub.ChannelID, sub.UserID, status, errPtr(sendErr), summary)
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

func (d *Dispatcher) SendTest(ctx context.Context, channel notif_repo.NotificationChannel, toEmail string, userID uuid.UUID) error {
	if channel.ChannelType == notif_repo.NotificationChannelTypeFirebase {
		if d.fcm == nil || !d.fcm.Enabled() {
			return fmt.Errorf("FCM not configured")
		}
		rows, err := d.repo.ListDeviceTokensByUser(ctx, userID)
		if err != nil {
			return err
		}
		tokens := make([]string, 0, len(rows))
		for _, row := range rows {
			tokens = append(tokens, row.Token)
		}
		return d.fcm.SendToTokens(ctx, tokens, channels.Message{
			Subject: "Dinosaurus POS — test notification",
			Body:    "This is a test push from your notification channel configuration.",
		})
	}
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

func (d *Dispatcher) SendDirectEmail(ctx context.Context, channel notif_repo.NotificationChannel, to, subject, body, htmlBody string) error {
	if channel.ChannelType != notif_repo.NotificationChannelTypeEmail {
		return fmt.Errorf("channel is not email")
	}
	sender, err := senderForType(channel.ChannelType, channel.ConfigJson)
	if err != nil {
		return err
	}
	to = strings.TrimSpace(to)
	if to == "" {
		return fmt.Errorf("recipient email required")
	}
	return sender.Send(ctx, channels.Message{Subject: subject, Body: body, HTMLBody: htmlBody, ToEmail: to})
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
	case notif_repo.NotificationChannelTypeFirebase:
		return nil, fmt.Errorf("firebase uses FCM client")
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