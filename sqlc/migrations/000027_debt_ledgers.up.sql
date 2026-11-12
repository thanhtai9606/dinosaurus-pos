CREATE TYPE debt_status AS ENUM ('open', 'partial', 'settled', 'void');

CREATE TYPE stock_receipt_payment_mode AS ENUM ('cash', 'credit');

ALTER TABLE stock_receipts
    ADD COLUMN payment_mode stock_receipt_payment_mode NOT NULL DEFAULT 'cash',
    ADD COLUMN amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0);

CREATE TABLE supplier_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers (id) ON DELETE RESTRICT,
    stock_receipt_id UUID UNIQUE REFERENCES stock_receipts (id) ON DELETE RESTRICT,
    reference_no VARCHAR(64) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status debt_status NOT NULL DEFAULT 'open',
    note TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT supplier_debts_paid_lte_total CHECK (amount_paid <= total_amount)
);

CREATE INDEX idx_supplier_debts_supplier_id ON supplier_debts (supplier_id);
CREATE INDEX idx_supplier_debts_status ON supplier_debts (status);
CREATE INDEX idx_supplier_debts_issued_at ON supplier_debts (issued_at);

CREATE TABLE supplier_debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_debt_id UUID NOT NULL REFERENCES supplier_debts (id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_debt_payments_debt_id ON supplier_debt_payments (supplier_debt_id);

CREATE TABLE customer_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
    order_id UUID UNIQUE REFERENCES orders (id) ON DELETE RESTRICT,
    reference_no VARCHAR(64) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status debt_status NOT NULL DEFAULT 'open',
    note TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT customer_debts_paid_lte_total CHECK (amount_paid <= total_amount)
);

CREATE INDEX idx_customer_debts_customer_id ON customer_debts (customer_id);
CREATE INDEX idx_customer_debts_status ON customer_debts (status);
CREATE INDEX idx_customer_debts_issued_at ON customer_debts (issued_at);

CREATE TABLE customer_debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_debt_id UUID NOT NULL REFERENCES customer_debts (id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_debt_payments_debt_id ON customer_debt_payments (customer_debt_id);
