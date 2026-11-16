package notifications

import "context"

// EventPublisher is implemented by Service for cross-module hooks.
type EventPublisher interface {
	PublishAsync(ctx context.Context, eventType, subject, body string)
	StockLowThreshold(ctx context.Context) int
}