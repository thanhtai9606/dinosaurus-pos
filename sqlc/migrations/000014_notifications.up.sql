CREATE TYPE notification_channel_type AS ENUM (
    'email',
    'msteams_webhook',
    'telegram',
    'sms'
);

CREATE TYPE notification_delivery_status AS ENUM (
    'sent',
    'failed'
);

CREATE TABLE notification_event_types (
    code VARCHAR(64) PRIMARY KEY,
    label VARCHAR(120) NOT NULL,
    description TEXT
);

INSERT INTO notification_event_types (code, label, description) VALUES
    ('order.created', 'Đơn hàng mới', 'Khi tạo đơn bán mới'),
    ('order.cancelled', 'Hủy đơn', 'Khi đơn bị hủy'),
    ('stock.low', 'Tồn kho thấp', 'Khi số lượng tồn dưới ngưỡng'),
    ('supplier_debt.created', 'Công nợ NCC', 'Khi phát sinh công nợ nhà cung cấp'),
    ('customer_debt.created', 'Công nợ khách', 'Khi phát sinh công nợ khách hàng'),
    ('stock_receipt.completed', 'Hoàn tất nhập kho', 'Khi phiếu nhập được hoàn tất');

CREATE TABLE notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(120) NOT NULL,
    channel_type notification_channel_type NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_channels_tenant ON notification_channels (tenant_id);
CREATE UNIQUE INDEX idx_notification_channels_tenant_name ON notification_channels (tenant_id, name);

CREATE TABLE notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(64) NOT NULL REFERENCES notification_event_types(code),
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, event_type, channel_id)
);

CREATE INDEX idx_notification_subscriptions_event ON notification_subscriptions (tenant_id, event_type) WHERE enabled = true;

CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    event_type VARCHAR(64) NOT NULL,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status notification_delivery_status NOT NULL,
    error_text TEXT,
    payload_summary VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_deliveries_tenant_created ON notification_deliveries (tenant_id, created_at DESC);

CREATE TRIGGER trg_notification_channels_set_tenant
    BEFORE INSERT ON notification_channels
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

CREATE TRIGGER trg_notification_subscriptions_set_tenant
    BEFORE INSERT ON notification_subscriptions
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

CREATE TRIGGER trg_notification_deliveries_set_tenant
    BEFORE INSERT ON notification_deliveries
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_channels
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));

ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_subscriptions
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_deliveries
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));

INSERT INTO settings (tenant_id, key, value, description)
SELECT t.id, 'notifications', '{"stock_low_threshold":5}', 'Notification module: global thresholds'
FROM tenants t
ON CONFLICT (tenant_id, key) DO NOTHING;