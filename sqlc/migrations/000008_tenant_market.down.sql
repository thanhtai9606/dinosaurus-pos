ALTER TABLE tenants
    DROP COLUMN IF EXISTS business_vertical,
    DROP COLUMN IF EXISTS market_code;
