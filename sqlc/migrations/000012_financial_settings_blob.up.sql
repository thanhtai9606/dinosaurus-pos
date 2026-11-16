-- Consolidate scattered financial settings keys into one JSON document per tenant.

WITH legacy AS (
  SELECT
    tenant_id,
    MAX(CASE WHEN key = 'currency' THEN value END) AS currency,
    MAX(CASE WHEN key = 'tax_rate' THEN value END) AS tax_rate,
    MAX(CASE WHEN key = 'service_charge_rate' THEN value END) AS service_charge_rate,
    MAX(CASE WHEN key = 'tax_enabled' THEN value END) AS tax_enabled,
    MAX(CASE WHEN key = 'supported_currencies' THEN value END) AS supported_currencies,
    MAX(CASE WHEN key = 'pos_quick_cash' THEN value END) AS pos_quick_cash
  FROM settings
  WHERE key IN (
    'currency', 'tax_rate', 'service_charge_rate', 'tax_enabled',
    'supported_currencies', 'pos_quick_cash'
  )
  GROUP BY tenant_id
),
defaults AS (
  SELECT
    tenant_id,
    COALESCE(NULLIF(currency, ''), 'VND') AS currency,
    COALESCE(NULLIF(tax_rate, ''), '11') AS tax_rate,
    COALESCE(NULLIF(service_charge_rate, ''), '0') AS service_charge_rate,
    COALESCE(NULLIF(tax_enabled, ''), 'true') AS tax_enabled,
    COALESCE(
      NULLIF(supported_currencies, ''),
      '[{"code":"VND","label":"VND (₫)","locale":"vi-VN","fraction_digits":0},{"code":"IDR","label":"IDR (Rp)","locale":"id-ID","fraction_digits":0},{"code":"USD","label":"USD ($)","locale":"en-US","fraction_digits":2}]'
    ) AS supported_currencies,
    COALESCE(
      NULLIF(pos_quick_cash, ''),
      '{"retail":[10000,20000,50000,100000,200000],"stock_receipt":[100000,200000,500000,1000000,2000000,5000000]}'
    ) AS pos_quick_cash
  FROM legacy
)
INSERT INTO settings (tenant_id, key, value, updated_at)
SELECT
  tenant_id,
  'financial',
  json_build_object(
    'currency', currency,
    'tax_rate', tax_rate::double precision,
    'service_charge_rate', service_charge_rate::double precision,
    'tax_enabled', CASE WHEN lower(tax_enabled) IN ('true', '1', 'yes') THEN true ELSE false END,
    'available_currencies', supported_currencies::json,
    'pos_quick_cash', pos_quick_cash::json
  )::text,
  NOW()
FROM defaults
ON CONFLICT (tenant_id, key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

DELETE FROM settings
WHERE key IN (
  'currency', 'tax_rate', 'service_charge_rate', 'tax_enabled',
  'supported_currencies', 'pos_quick_cash'
);