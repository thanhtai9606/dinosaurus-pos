package notifications

import (
	"encoding/json"
	"time"

	notif_repo "dinosaurus-pos/internal/notifications/repository"

	"github.com/google/uuid"
)

type EventTypeResponse struct {
	Code        string  `json:"code"`
	Label       string  `json:"label"`
	Description *string `json:"description,omitempty"`
}

type ChannelResponse struct {
	ID          uuid.UUID       `json:"id"`
	Name        string          `json:"name"`
	ChannelType string          `json:"channel_type"`
	Config      json.RawMessage `json:"config"`
	Enabled     bool            `json:"enabled"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type CreateChannelRequest struct {
	Name        string          `json:"name" validate:"required,max=120"`
	ChannelType string          `json:"channel_type" validate:"required,oneof=email msteams_webhook telegram sms"`
	Config      json.RawMessage `json:"config" validate:"required"`
	Enabled     *bool           `json:"enabled"`
}

type UpdateChannelRequest struct {
	Name    string          `json:"name" validate:"required,max=120"`
	Config  json.RawMessage `json:"config" validate:"required"`
	Enabled *bool           `json:"enabled"`
}

type SubscriptionItem struct {
	EventType string `json:"event_type" validate:"required"`
	ChannelID string `json:"channel_id" validate:"required,uuid"`
	Enabled   bool   `json:"enabled"`
}

type UpdateSubscriptionsRequest struct {
	Items []SubscriptionItem `json:"items" validate:"required,dive"`
}

type SubscriptionResponse struct {
	EventType   string `json:"event_type"`
	ChannelID   string `json:"channel_id"`
	ChannelName string `json:"channel_name,omitempty"`
	Enabled     bool   `json:"enabled"`
}

type DeliveryResponse struct {
	ID             uuid.UUID  `json:"id"`
	EventType      string     `json:"event_type"`
	ChannelID      *uuid.UUID `json:"channel_id,omitempty"`
	UserID         *uuid.UUID `json:"user_id,omitempty"`
	Status         string     `json:"status"`
	ErrorText      *string    `json:"error_text,omitempty"`
	PayloadSummary *string    `json:"payload_summary,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type ListDeliveriesResponse struct {
	Items []DeliveryResponse `json:"items"`
	Total int32              `json:"total"`
}

type TenantConfigResponse struct {
	StockLowThreshold int `json:"stock_low_threshold"`
}

type UpdateTenantConfigRequest struct {
	StockLowThreshold int `json:"stock_low_threshold" validate:"required,min=0"`
}

func toChannelResponse(row notif_repo.NotificationChannel, masked []byte) ChannelResponse {
	var created, updated time.Time
	if row.CreatedAt.Valid {
		created = row.CreatedAt.Time
	}
	if row.UpdatedAt.Valid {
		updated = row.UpdatedAt.Time
	}
	return ChannelResponse{
		ID:          row.ID,
		Name:        row.Name,
		ChannelType: string(row.ChannelType),
		Config:      masked,
		Enabled:     row.Enabled,
		CreatedAt:   created,
		UpdatedAt:   updated,
	}
}