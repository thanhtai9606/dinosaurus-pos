DELETE FROM settings WHERE key = 'notifications';

DROP TABLE IF EXISTS notification_deliveries;
DROP TABLE IF EXISTS notification_subscriptions;
DROP TABLE IF EXISTS notification_channels;
DROP TABLE IF EXISTS notification_event_types;
DROP TYPE IF EXISTS notification_delivery_status;
DROP TYPE IF EXISTS notification_channel_type;