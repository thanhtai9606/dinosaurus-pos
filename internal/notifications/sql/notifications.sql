-- name: ListNotificationEventTypes :many
SELECT code, label, description FROM notification_event_types ORDER BY code;

-- name: ListNotificationChannels :many
SELECT id, tenant_id, name, channel_type, config_json, enabled, created_at, updated_at
FROM notification_channels
ORDER BY name;

-- name: GetNotificationChannelByID :one
SELECT id, tenant_id, name, channel_type, config_json, enabled, created_at, updated_at
FROM notification_channels
WHERE id = $1;

-- name: CreateNotificationChannel :one
INSERT INTO notification_channels (name, channel_type, config_json, enabled)
VALUES ($1, $2, $3, $4)
RETURNING id, tenant_id, name, channel_type, config_json, enabled, created_at, updated_at;

-- name: UpdateNotificationChannel :one
UPDATE notification_channels
SET name = $2, config_json = $3, enabled = $4, updated_at = NOW()
WHERE id = $1
RETURNING id, tenant_id, name, channel_type, config_json, enabled, created_at, updated_at;

-- name: DeleteNotificationChannel :exec
DELETE FROM notification_channels WHERE id = $1;

-- name: ListSubscriptionsByUser :many
SELECT id, tenant_id, user_id, event_type, channel_id, enabled, created_at, updated_at
FROM notification_subscriptions
WHERE user_id = $1;

-- name: ListEnabledSubscriptionsForEvent :many
SELECT ns.id, ns.tenant_id, ns.user_id, ns.event_type, ns.channel_id, ns.enabled, ns.created_at, ns.updated_at,
       nc.channel_type, nc.config_json, nc.name AS channel_name,
       u.email AS user_email,
       u.phone AS user_phone
FROM notification_subscriptions ns
JOIN notification_channels nc ON nc.id = ns.channel_id AND nc.enabled = true
JOIN users u ON u.id = ns.user_id
WHERE ns.event_type = $1 AND ns.enabled = true;

-- name: UpsertNotificationSubscription :one
INSERT INTO notification_subscriptions (user_id, event_type, channel_id, enabled)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, event_type, channel_id) DO UPDATE
SET enabled = EXCLUDED.enabled, updated_at = NOW()
RETURNING id, tenant_id, user_id, event_type, channel_id, enabled, created_at, updated_at;

-- name: DeleteUserSubscriptions :exec
DELETE FROM notification_subscriptions WHERE user_id = $1;

-- name: InsertNotificationDelivery :one
INSERT INTO notification_deliveries (event_type, channel_id, user_id, status, error_text, payload_summary)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, tenant_id, event_type, channel_id, user_id, status, error_text, payload_summary, created_at;

-- name: ListNotificationDeliveries :many
SELECT id, tenant_id, event_type, channel_id, user_id, status, error_text, payload_summary, created_at
FROM notification_deliveries
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountNotificationDeliveries :one
SELECT COUNT(*)::int FROM notification_deliveries;

-- name: UpsertNotificationDeviceToken :one
INSERT INTO notification_device_tokens (user_id, token, platform, last_seen_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (user_id, token) DO UPDATE
SET platform = EXCLUDED.platform, last_seen_at = NOW()
RETURNING id, tenant_id, user_id, token, platform, last_seen_at, created_at;

-- name: DeleteNotificationDeviceToken :exec
DELETE FROM notification_device_tokens
WHERE user_id = $1 AND token = $2;

-- name: ListDeviceTokensByUser :many
SELECT id, tenant_id, user_id, token, platform, last_seen_at, created_at
FROM notification_device_tokens
WHERE user_id = $1;

-- name: InsertNotificationReportRun :one
INSERT INTO notification_report_runs (period, period_key)
VALUES ($1, $2)
ON CONFLICT (tenant_id, period, period_key) DO NOTHING
RETURNING id, tenant_id, period, period_key, created_at;

-- name: ListEnabledEmailChannels :many
SELECT id, tenant_id, name, channel_type, config_json, enabled, created_at, updated_at
FROM notification_channels
WHERE enabled = true AND channel_type = 'email'
ORDER BY created_at
LIMIT 10;