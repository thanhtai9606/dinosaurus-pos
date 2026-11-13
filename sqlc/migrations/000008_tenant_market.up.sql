ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS market_code VARCHAR(8) NOT NULL DEFAULT 'vn',
    ADD COLUMN IF NOT EXISTS business_vertical VARCHAR(32) NOT NULL DEFAULT 'multi';

UPDATE tenants
SET market_code = 'vn',
    business_vertical = 'multi'
WHERE code = 'default';
