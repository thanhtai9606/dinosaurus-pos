-- Rebrand defaults + VND as default currency for new deployments upgrading from IDR-only seed.

UPDATE settings
SET value = 'Dinosaurus POS'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND key = 'app_name'
  AND (value ILIKE '%kasir%' OR value = 'POS Kasir');

UPDATE settings
SET value = '© Dinosaurus POS'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND key = 'footer_text'
  AND value ILIKE '%kasir%';

UPDATE settings
SET value = 'VND'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND key = 'currency'
  AND value = 'IDR';

INSERT INTO settings (tenant_id, key, value, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'supported_currencies',
  '[{"code":"VND","label":"VND (₫)","locale":"vi-VN","fraction_digits":0},{"code":"IDR","label":"IDR (Rp)","locale":"id-ID","fraction_digits":0},{"code":"USD","label":"USD ($)","locale":"en-US","fraction_digits":2}]',
  NOW()
)
ON CONFLICT (tenant_id, key) DO NOTHING;
