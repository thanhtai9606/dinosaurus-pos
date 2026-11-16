ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_cash BOOLEAN NOT NULL DEFAULT false;

UPDATE payment_methods SET is_cash = true
WHERE LOWER(name) IN ('cash', 'tunai', 'tiền mặt', 'tien mat');

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_shift_paid ON orders (tenant_id, shift_id)
    WHERE shift_id IS NOT NULL AND status <> 'cancelled';