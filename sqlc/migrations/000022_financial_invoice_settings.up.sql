INSERT INTO settings (key, value, description) VALUES
('currency', 'IDR', 'Default currency code for display and receipts'),
('tax_rate', '11', 'Tax rate percentage applied to order subtotal (e.g. 11 for 11%)'),
('service_charge_rate', '0', 'Service charge percentage applied to order subtotal'),
('tax_enabled', 'true', 'Whether tax is applied when creating orders'),
('receipt_header', '', 'Optional message printed at the top of receipts/invoices'),
('receipt_footer', 'Terima kasih atas kunjungan Anda.', 'Message printed at the bottom of receipts/invoices'),
('invoice_prefix', 'INV', 'Optional prefix shown before order/queue number on receipts'),
('show_tax_on_receipt', 'true', 'Show tax and service charge breakdown on printed receipts'),
('invoice_legal_text', '', 'Legal/business info on invoice (NPWP, address, etc.)')
ON CONFLICT (key) DO NOTHING;
