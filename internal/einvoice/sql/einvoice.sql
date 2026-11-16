-- name: GetEInvoiceByOrderID :one
SELECT * FROM e_invoices WHERE order_id = $1;

-- name: CountEInvoices :one
SELECT COUNT(*)::int FROM e_invoices;

-- name: CreateEInvoice :one
INSERT INTO e_invoices (
    order_id, invoice_no, buyer_name, buyer_tax_code, total_amount, status, payload_json
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;