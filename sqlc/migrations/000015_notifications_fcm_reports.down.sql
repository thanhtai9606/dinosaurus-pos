DROP TABLE IF EXISTS notification_report_runs;
DROP TABLE IF EXISTS notification_device_tokens;
DROP TYPE IF EXISTS notification_report_period;
DROP TYPE IF EXISTS notification_device_platform;

DELETE FROM notification_event_types WHERE code IN ('report.daily', 'report.monthly', 'report.yearly');

-- PostgreSQL cannot remove enum values from notification_channel_type without recreate; left in place on down.