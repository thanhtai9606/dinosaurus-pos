DROP TABLE IF EXISTS customer_debt_payments;
DROP TABLE IF EXISTS customer_debts;
DROP TABLE IF EXISTS supplier_debt_payments;
DROP TABLE IF EXISTS supplier_debts;

ALTER TABLE stock_receipts
    DROP COLUMN IF EXISTS amount_paid,
    DROP COLUMN IF EXISTS payment_mode;

DROP TYPE IF EXISTS stock_receipt_payment_mode;
DROP TYPE IF EXISTS debt_status;
