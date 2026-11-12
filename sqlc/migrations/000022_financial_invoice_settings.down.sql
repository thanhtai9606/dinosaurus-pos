DELETE FROM settings WHERE key IN (
    'currency',
    'tax_rate',
    'service_charge_rate',
    'tax_enabled',
    'receipt_header',
    'receipt_footer',
    'invoice_prefix',
    'show_tax_on_receipt',
    'invoice_legal_text'
);
