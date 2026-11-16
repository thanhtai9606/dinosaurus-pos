ALTER TYPE notification_channel_type ADD VALUE IF NOT EXISTS 'firebase';

CREATE TYPE notification_device_platform AS ENUM ('web', 'android', 'ios');

CREATE TYPE notification_report_period AS ENUM ('daily', 'monthly', 'yearly');

INSERT INTO notification_event_types (code, label, description) VALUES
    ('report.daily', 'Báo cáo ngày', 'Tổng hợp kinh doanh theo ngày (email)'),
    ('report.monthly', 'Báo cáo tháng', 'Tổng hợp kinh doanh theo tháng (email)'),
    ('report.yearly', 'Báo cáo năm', 'Tổng hợp kinh doanh theo năm (email)')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE notification_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform notification_device_platform NOT NULL DEFAULT 'web',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, token)
);

CREATE INDEX idx_notification_device_tokens_user ON notification_device_tokens (tenant_id, user_id);

CREATE TABLE notification_report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period notification_report_period NOT NULL,
    period_key VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, period, period_key)
);

CREATE INDEX idx_notification_report_runs_tenant ON notification_report_runs (tenant_id, created_at DESC);

CREATE TRIGGER trg_notification_device_tokens_set_tenant
    BEFORE INSERT ON notification_device_tokens
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

CREATE TRIGGER trg_notification_report_runs_set_tenant
    BEFORE INSERT ON notification_report_runs
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

ALTER TABLE notification_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_device_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_device_tokens
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));

ALTER TABLE notification_report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_report_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_report_runs
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));