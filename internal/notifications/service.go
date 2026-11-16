package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/notifications/channelconfig"
	notif_repo "dinosaurus-pos/internal/notifications/repository"
	settings_repo "dinosaurus-pos/internal/settings/repository"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
)

const settingKeyNotifications = "notifications"

type INotificationService interface {
	ListEventTypes(ctx context.Context) ([]EventTypeResponse, error)
	ListChannels(ctx context.Context) ([]ChannelResponse, error)
	GetChannel(ctx context.Context, id uuid.UUID) (ChannelResponse, error)
	CreateChannel(ctx context.Context, req CreateChannelRequest) (ChannelResponse, error)
	UpdateChannel(ctx context.Context, id uuid.UUID, req UpdateChannelRequest) (ChannelResponse, error)
	DeleteChannel(ctx context.Context, id uuid.UUID) error
	TestChannel(ctx context.Context, id uuid.UUID, actorEmail string) error
	GetMySubscriptions(ctx context.Context, userID uuid.UUID) ([]SubscriptionResponse, error)
	UpdateMySubscriptions(ctx context.Context, userID uuid.UUID, req UpdateSubscriptionsRequest) ([]SubscriptionResponse, error)
	ListDeliveries(ctx context.Context, page, limit int) (*ListDeliveriesResponse, error)
	GetTenantConfig(ctx context.Context) (TenantConfigResponse, error)
	UpdateTenantConfig(ctx context.Context, req UpdateTenantConfigRequest) (TenantConfigResponse, error)
	PublishAsync(ctx context.Context, eventType, subject, body string)
	StockLowThreshold(ctx context.Context) int
}

type Service struct {
	repo         notif_repo.Querier
	settingsRepo settings_repo.Querier
	dispatcher   *Dispatcher
	log          logger.ILogger
	testMu       sync.Mutex
	testCounts   map[uuid.UUID][]time.Time
}

func NewService(
	repo notif_repo.Querier,
	settingsRepo settings_repo.Querier,
	log logger.ILogger,
) INotificationService {
	d := NewDispatcher(repo, log)
	return &Service{
		repo:         repo,
		settingsRepo: settingsRepo,
		dispatcher:   d,
		log:          log,
		testCounts:   make(map[uuid.UUID][]time.Time),
	}
}

func (s *Service) ListEventTypes(ctx context.Context) ([]EventTypeResponse, error) {
	rows, err := s.repo.ListNotificationEventTypes(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]EventTypeResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, EventTypeResponse{Code: r.Code, Label: r.Label, Description: r.Description})
	}
	return out, nil
}

func (s *Service) ListChannels(ctx context.Context) ([]ChannelResponse, error) {
	rows, err := s.repo.ListNotificationChannels(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]ChannelResponse, 0, len(rows))
	for _, row := range rows {
		masked, err := channelconfig.MaskConfigForResponse(string(row.ChannelType), row.ConfigJson)
		if err != nil {
			masked = row.ConfigJson
		}
		out = append(out, toChannelResponse(row, masked))
	}
	return out, nil
}

func (s *Service) GetChannel(ctx context.Context, id uuid.UUID) (ChannelResponse, error) {
	row, err := s.repo.GetNotificationChannelByID(ctx, id)
	if err != nil {
		return ChannelResponse{}, common.ErrNotFound
	}
	masked, _ := channelconfig.MaskConfigForResponse(string(row.ChannelType), row.ConfigJson)
	return toChannelResponse(row, masked), nil
}

func (s *Service) CreateChannel(ctx context.Context, req CreateChannelRequest) (ChannelResponse, error) {
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	chType := notif_repo.NotificationChannelType(req.ChannelType)
	row, err := s.repo.CreateNotificationChannel(ctx, notif_repo.CreateNotificationChannelParams{
		Name:        req.Name,
		ChannelType: chType,
		ConfigJson:  []byte(req.Config),
		Enabled:     enabled,
	})
	if err != nil {
		return ChannelResponse{}, err
	}
	masked, _ := channelconfig.MaskConfigForResponse(string(row.ChannelType), row.ConfigJson)
	return toChannelResponse(row, masked), nil
}

func (s *Service) UpdateChannel(ctx context.Context, id uuid.UUID, req UpdateChannelRequest) (ChannelResponse, error) {
	existing, err := s.repo.GetNotificationChannelByID(ctx, id)
	if err != nil {
		return ChannelResponse{}, common.ErrNotFound
	}
	merged, err := channelconfig.MergeConfigJSON(string(existing.ChannelType), []byte(req.Config), existing.ConfigJson)
	if err != nil {
		return ChannelResponse{}, fmt.Errorf("%w: invalid config", common.ErrBadRequest)
	}
	enabled := existing.Enabled
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	row, err := s.repo.UpdateNotificationChannel(ctx, notif_repo.UpdateNotificationChannelParams{
		ID:         id,
		Name:       req.Name,
		ConfigJson: merged,
		Enabled:    enabled,
	})
	if err != nil {
		return ChannelResponse{}, err
	}
	masked, _ := channelconfig.MaskConfigForResponse(string(row.ChannelType), row.ConfigJson)
	return toChannelResponse(row, masked), nil
}

func (s *Service) DeleteChannel(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.GetNotificationChannelByID(ctx, id); err != nil {
		return common.ErrNotFound
	}
	return s.repo.DeleteNotificationChannel(ctx, id)
}

func (s *Service) TestChannel(ctx context.Context, id uuid.UUID, actorEmail string) error {
	tid, _ := tenant.IDFromContext(ctx)
	if err := s.checkTestRateLimit(tid); err != nil {
		return err
	}
	ch, err := s.repo.GetNotificationChannelByID(ctx, id)
	if err != nil {
		return common.ErrNotFound
	}
	return s.dispatcher.SendTest(ctx, ch, actorEmail)
}

func (s *Service) checkTestRateLimit(tenantID uuid.UUID) error {
	s.testMu.Lock()
	defer s.testMu.Unlock()
	now := time.Now()
	window := now.Add(-time.Minute)
	history := s.testCounts[tenantID]
	filtered := history[:0]
	for _, t := range history {
		if t.After(window) {
			filtered = append(filtered, t)
		}
	}
	if len(filtered) >= 5 {
		return fmt.Errorf("%w: test send rate limit exceeded", common.ErrBadRequest)
	}
	filtered = append(filtered, now)
	s.testCounts[tenantID] = filtered
	return nil
}

func (s *Service) GetMySubscriptions(ctx context.Context, userID uuid.UUID) ([]SubscriptionResponse, error) {
	subs, err := s.repo.ListSubscriptionsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	channels, _ := s.repo.ListNotificationChannels(ctx)
	chName := map[uuid.UUID]string{}
	for _, ch := range channels {
		chName[ch.ID] = ch.Name
	}
	out := make([]SubscriptionResponse, 0, len(subs))
	for _, sub := range subs {
		out = append(out, SubscriptionResponse{
			EventType:   sub.EventType,
			ChannelID:   sub.ChannelID.String(),
			ChannelName: chName[sub.ChannelID],
			Enabled:     sub.Enabled,
		})
	}
	return out, nil
}

func (s *Service) UpdateMySubscriptions(ctx context.Context, userID uuid.UUID, req UpdateSubscriptionsRequest) ([]SubscriptionResponse, error) {
	for _, item := range req.Items {
		chID, err := uuid.Parse(item.ChannelID)
		if err != nil {
			return nil, fmt.Errorf("%w: invalid channel_id", common.ErrBadRequest)
		}
		if _, err := s.repo.GetNotificationChannelByID(ctx, chID); err != nil {
			return nil, fmt.Errorf("%w: channel not found", common.ErrBadRequest)
		}
		_, err = s.repo.UpsertNotificationSubscription(ctx, notif_repo.UpsertNotificationSubscriptionParams{
			UserID:    userID,
			EventType: item.EventType,
			ChannelID: chID,
			Enabled:   item.Enabled,
		})
		if err != nil {
			return nil, err
		}
	}
	return s.GetMySubscriptions(ctx, userID)
}

func (s *Service) ListDeliveries(ctx context.Context, page, limit int) (*ListDeliveriesResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	total, err := s.repo.CountNotificationDeliveries(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := s.repo.ListNotificationDeliveries(ctx, notif_repo.ListNotificationDeliveriesParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}
	items := make([]DeliveryResponse, 0, len(rows))
	for _, r := range rows {
		var chID *uuid.UUID
		if r.ChannelID.Valid {
			id := uuid.UUID(r.ChannelID.Bytes)
			chID = &id
		}
		var uID *uuid.UUID
		if r.UserID.Valid {
			id := uuid.UUID(r.UserID.Bytes)
			uID = &id
		}
		items = append(items, DeliveryResponse{
			ID:             r.ID,
			EventType:      r.EventType,
			ChannelID:      chID,
			UserID:         uID,
			Status:         string(r.Status),
			ErrorText:      r.ErrorText,
			PayloadSummary: r.PayloadSummary,
			CreatedAt:      r.CreatedAt.Time,
		})
	}
	return &ListDeliveriesResponse{
		Items: items,
		Total: total,
	}, nil
}

func (s *Service) GetTenantConfig(ctx context.Context) (TenantConfigResponse, error) {
	cfg, err := s.loadTenantConfig(ctx)
	if err != nil {
		return TenantConfigResponse{StockLowThreshold: 5}, nil
	}
	return cfg, nil
}

func (s *Service) UpdateTenantConfig(ctx context.Context, req UpdateTenantConfigRequest) (TenantConfigResponse, error) {
	payload, err := json.Marshal(TenantNotificationConfig{StockLowThreshold: req.StockLowThreshold})
	if err != nil {
		return TenantConfigResponse{}, err
	}
	_, err = s.settingsRepo.UpsertSetting(ctx, settings_repo.UpsertSettingParams{
		Key:   settingKeyNotifications,
		Value: string(payload),
	})
	if err != nil {
		return TenantConfigResponse{}, err
	}
	return TenantConfigResponse{StockLowThreshold: req.StockLowThreshold}, nil
}

func (s *Service) loadTenantConfig(ctx context.Context) (TenantConfigResponse, error) {
	row, err := s.settingsRepo.GetSettingByKey(ctx, settingKeyNotifications)
	if err != nil {
		return TenantConfigResponse{}, err
	}
	var cfg TenantNotificationConfig
	if err := json.Unmarshal([]byte(row.Value), &cfg); err != nil {
		return TenantConfigResponse{}, err
	}
	return TenantConfigResponse{StockLowThreshold: cfg.StockLowThreshold}, nil
}

func (s *Service) StockLowThreshold(ctx context.Context) int {
	cfg, err := s.loadTenantConfig(ctx)
	if err != nil || cfg.StockLowThreshold <= 0 {
		return 5
	}
	return cfg.StockLowThreshold
}

func (s *Service) PublishAsync(parentCtx context.Context, eventType, subject, body string) {
	tenantID, _ := tenant.IDFromContext(parentCtx)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if tenantID != uuid.Nil {
			ctx = tenant.WithID(ctx, tenantID)
		}
		s.dispatcher.Publish(ctx, DispatchEvent{
			EventType: eventType,
			Subject:   subject,
			Body:      body,
		})
	}()
}

var _ INotificationService = (*Service)(nil)