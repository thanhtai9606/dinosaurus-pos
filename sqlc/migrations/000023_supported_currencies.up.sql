INSERT INTO settings (key, value, description) VALUES
(
  'supported_currencies',
  '[{"code":"IDR","label":"IDR (Rp)","locale":"id-ID","fraction_digits":0},{"code":"VND","label":"VND (₫)","locale":"vi-VN","fraction_digits":0},{"code":"USD","label":"USD ($)","locale":"en-US","fraction_digits":2}]',
  'JSON array of enabled currencies for POS display and financial settings (code, label, locale, fraction_digits)'
)
ON CONFLICT (key) DO NOTHING;
