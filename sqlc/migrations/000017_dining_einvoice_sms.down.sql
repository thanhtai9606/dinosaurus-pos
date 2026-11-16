DROP TABLE IF EXISTS e_invoices;
ALTER TABLE orders DROP COLUMN IF EXISTS kitchen_status;
ALTER TABLE orders DROP COLUMN IF EXISTS dining_table_id;
DROP TABLE IF EXISTS dining_tables;
DROP TABLE IF EXISTS dining_areas;
DROP TYPE IF EXISTS kitchen_ticket_status;
DROP TYPE IF EXISTS dining_table_status;
ALTER TABLE supplier_debt_payments DROP COLUMN IF EXISTS cash_transaction_id;
ALTER TABLE users DROP COLUMN IF EXISTS phone;