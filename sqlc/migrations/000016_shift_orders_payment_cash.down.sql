DROP INDEX IF EXISTS idx_orders_shift_paid;
ALTER TABLE orders DROP COLUMN IF EXISTS shift_id;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS is_cash;