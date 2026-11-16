DELETE FROM settings WHERE key = 'financial';

INSERT INTO settings (tenant_id, key, value, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'currency', 'VND', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'tax_rate', '11', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'service_charge_rate', '0', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'tax_enabled', 'true', NOW()),
  (
    '00000000-0000-0000-0000-000000000001',
    'supported_currencies',
    '[{"code":"VND","label":"VND (₫)","locale":"vi-VN","fraction_digits":0},{"code":"IDR","label":"IDR (Rp)","locale":"id-ID","fraction_digits":0},{"code":"USD","label":"USD ($)","locale":"en-US","fraction_digits":2}]',
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'pos_quick_cash',
    '{"retail":[10000,20000,50000,100000,200000],"stock_receipt":[100000,200000,500000,1000000,2000000,5000000]}',
    NOW()
  )
ON CONFLICT (tenant_id, key) DO NOTHING;