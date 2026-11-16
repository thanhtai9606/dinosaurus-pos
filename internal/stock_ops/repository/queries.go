package repository

import (
	"context"
	"time"

	products_repo "dinosaurus-pos/internal/products/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type DBTX interface {
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
}

type Queries struct {
	db DBTX
}

func New(db DBTX) *Queries {
	return &Queries{db: db}
}

type StockDocStatus string

const (
	StockDocStatusDraft     StockDocStatus = "draft"
	StockDocStatusCompleted StockDocStatus = "completed"
	StockDocStatusCancelled StockDocStatus = "cancelled"
)

type StockTakeStatus string

const (
	StockTakeStatusDraft    StockTakeStatus = "draft"
	StockTakeStatusCounting StockTakeStatus = "counting"
	StockTakeStatusPosted   StockTakeStatus = "posted"
	StockTakeStatusCancelled StockTakeStatus = "cancelled"
)

type StockAdjustment struct {
	ID          uuid.UUID
	TenantID    uuid.UUID
	DocNo       string
	WarehouseID uuid.UUID
	Status      StockDocStatus
	Reason      products_repo.StockChangeType
	Note        *string
	CreatedBy   pgtype.UUID
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CompletedAt pgtype.Timestamptz
}

type StockAdjustmentRow struct {
	StockAdjustment
	WarehouseName string
}

type StockAdjustmentItem struct {
	ID            uuid.UUID
	AdjustmentID  uuid.UUID
	ProductID     uuid.UUID
	QuantityDelta int32
	Note          *string
	CreatedAt     time.Time
}

type StockAdjustmentItemRow struct {
	StockAdjustmentItem
	ProductName string
	Code        *string
	Sku         *string
}

type StockTransfer struct {
	ID              uuid.UUID
	TenantID        uuid.UUID
	DocNo           string
	FromWarehouseID uuid.UUID
	ToWarehouseID   uuid.UUID
	Status          StockDocStatus
	Note            *string
	CreatedBy       pgtype.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CompletedAt     pgtype.Timestamptz
}

type StockTransferRow struct {
	StockTransfer
	FromWarehouseName string
	ToWarehouseName   string
}

type StockTransferItem struct {
	ID         uuid.UUID
	TransferID uuid.UUID
	ProductID  uuid.UUID
	Quantity   int32
	CreatedAt  time.Time
}

type StockTransferItemRow struct {
	StockTransferItem
	ProductName string
	Code        *string
	Sku         *string
}

type StockTake struct {
	ID          uuid.UUID
	TenantID    uuid.UUID
	DocNo       string
	WarehouseID uuid.UUID
	Status      StockTakeStatus
	Note        *string
	CreatedBy   pgtype.UUID
	CreatedAt   time.Time
	UpdatedAt   time.Time
	PostedAt    pgtype.Timestamptz
}

type StockTakeRow struct {
	StockTake
	WarehouseName string
}

type StockTakeItem struct {
	ID          uuid.UUID
	StockTakeID uuid.UUID
	ProductID   uuid.UUID
	SystemQty   int32
	CountedQty  pgtype.Int4
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type StockTakeItemRow struct {
	StockTakeItem
	ProductName string
	Code        *string
	Sku         *string
}

type StockMovementRow struct {
	ID             uuid.UUID
	ProductID      uuid.UUID
	WarehouseID    pgtype.UUID
	ChangeAmount   int32
	PreviousStock  int32
	CurrentStock   int32
	ChangeType     products_repo.StockChangeType
	ReferenceID    pgtype.UUID
	Note           *string
	CreatedAt      time.Time
	ProductName    string
	Code           *string
	WarehouseName  *string
}

func scanAdjustment(row pgx.Row) (StockAdjustment, error) {
	var a StockAdjustment
	err := row.Scan(
		&a.ID, &a.TenantID, &a.DocNo, &a.WarehouseID, &a.Status, &a.Reason, &a.Note,
		&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt, &a.CompletedAt,
	)
	return a, err
}

func (q *Queries) CountStockAdjustmentsOnDate(ctx context.Context, day time.Time) (int32, error) {
	var n int32
	err := q.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM stock_adjustments WHERE created_at::date = $1::date`, day).Scan(&n)
	return n, err
}

func (q *Queries) CreateStockAdjustment(ctx context.Context, tenantID uuid.UUID, docNo string, warehouseID uuid.UUID, reason products_repo.StockChangeType, note *string, createdBy pgtype.UUID) (StockAdjustment, error) {
	const sql = `INSERT INTO stock_adjustments (tenant_id, doc_no, warehouse_id, status, reason, note, created_by)
VALUES ($1, $2, $3, 'draft', $4, $5, $6)
RETURNING id, tenant_id, doc_no, warehouse_id, status, reason, note, created_by, created_at, updated_at, completed_at`
	return scanAdjustment(q.db.QueryRow(ctx, sql, tenantID, docNo, warehouseID, reason, note, createdBy))
}

func (q *Queries) GetStockAdjustmentByID(ctx context.Context, id uuid.UUID) (StockAdjustmentRow, error) {
	const sql = `SELECT sa.id, sa.tenant_id, sa.doc_no, sa.warehouse_id, sa.status, sa.reason, sa.note, sa.created_by, sa.created_at, sa.updated_at, sa.completed_at, w.name AS warehouse_name
FROM stock_adjustments sa
JOIN warehouses w ON w.id = sa.warehouse_id
WHERE sa.id = $1`
	var r StockAdjustmentRow
	err := q.db.QueryRow(ctx, sql, id).Scan(
		&r.ID, &r.TenantID, &r.DocNo, &r.WarehouseID, &r.Status, &r.Reason, &r.Note,
		&r.CreatedBy, &r.CreatedAt, &r.UpdatedAt, &r.CompletedAt, &r.WarehouseName,
	)
	return r, err
}

func (q *Queries) ListStockAdjustments(ctx context.Context, limit, offset int32, status *StockDocStatus, warehouseID *uuid.UUID) ([]StockAdjustmentRow, error) {
	const sql = `SELECT sa.id, sa.tenant_id, sa.doc_no, sa.warehouse_id, sa.status, sa.reason, sa.note, sa.created_by, sa.created_at, sa.updated_at, sa.completed_at, w.name AS warehouse_name
FROM stock_adjustments sa
JOIN warehouses w ON w.id = sa.warehouse_id
WHERE ($3::stock_doc_status IS NULL OR sa.status = $3)
  AND ($4::uuid IS NULL OR sa.warehouse_id = $4)
ORDER BY sa.created_at DESC
LIMIT $1 OFFSET $2`
	rows, err := q.db.Query(ctx, sql, limit, offset, status, warehouseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockAdjustmentRow
	for rows.Next() {
		var r StockAdjustmentRow
		if err := rows.Scan(
			&r.ID, &r.TenantID, &r.DocNo, &r.WarehouseID, &r.Status, &r.Reason, &r.Note,
			&r.CreatedBy, &r.CreatedAt, &r.UpdatedAt, &r.CompletedAt, &r.WarehouseName,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) CountStockAdjustments(ctx context.Context, status *StockDocStatus, warehouseID *uuid.UUID) (int64, error) {
	const sql = `SELECT COUNT(*) FROM stock_adjustments sa
WHERE ($1::stock_doc_status IS NULL OR sa.status = $1)
  AND ($2::uuid IS NULL OR sa.warehouse_id = $2)`
	var n int64
	err := q.db.QueryRow(ctx, sql, status, warehouseID).Scan(&n)
	return n, err
}

func (q *Queries) UpdateStockAdjustmentDraft(ctx context.Context, id, warehouseID uuid.UUID, reason products_repo.StockChangeType, note *string) (StockAdjustment, error) {
	const sql = `UPDATE stock_adjustments SET warehouse_id = $2, reason = $3, note = $4, updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING id, tenant_id, doc_no, warehouse_id, status, reason, note, created_by, created_at, updated_at, completed_at`
	return scanAdjustment(q.db.QueryRow(ctx, sql, id, warehouseID, reason, note))
}

func (q *Queries) CompleteStockAdjustment(ctx context.Context, id uuid.UUID) (StockAdjustment, error) {
	const sql = `UPDATE stock_adjustments SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING id, tenant_id, doc_no, warehouse_id, status, reason, note, created_by, created_at, updated_at, completed_at`
	return scanAdjustment(q.db.QueryRow(ctx, sql, id))
}

func (q *Queries) DeleteStockAdjustmentItems(ctx context.Context, adjustmentID uuid.UUID) error {
	_, err := q.db.Exec(ctx, `DELETE FROM stock_adjustment_items WHERE adjustment_id = $1`, adjustmentID)
	return err
}

func (q *Queries) InsertStockAdjustmentItem(ctx context.Context, adjustmentID, productID uuid.UUID, delta int32, note *string) (StockAdjustmentItem, error) {
	const sql = `INSERT INTO stock_adjustment_items (adjustment_id, product_id, quantity_delta, note) VALUES ($1,$2,$3,$4)
RETURNING id, adjustment_id, product_id, quantity_delta, note, created_at`
	var it StockAdjustmentItem
	err := q.db.QueryRow(ctx, sql, adjustmentID, productID, delta, note).Scan(
		&it.ID, &it.AdjustmentID, &it.ProductID, &it.QuantityDelta, &it.Note, &it.CreatedAt,
	)
	return it, err
}

func (q *Queries) ListStockAdjustmentItems(ctx context.Context, adjustmentID uuid.UUID) ([]StockAdjustmentItemRow, error) {
	const sql = `SELECT sai.id, sai.adjustment_id, sai.product_id, sai.quantity_delta, sai.note, sai.created_at, p.name, p.code, p.sku
FROM stock_adjustment_items sai
JOIN products p ON p.id = sai.product_id
WHERE sai.adjustment_id = $1
ORDER BY sai.created_at ASC`
	rows, err := q.db.Query(ctx, sql, adjustmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockAdjustmentItemRow
	for rows.Next() {
		var r StockAdjustmentItemRow
		if err := rows.Scan(&r.ID, &r.AdjustmentID, &r.ProductID, &r.QuantityDelta, &r.Note, &r.CreatedAt, &r.ProductName, &r.Code, &r.Sku); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func scanTransfer(row pgx.Row) (StockTransfer, error) {
	var t StockTransfer
	err := row.Scan(
		&t.ID, &t.TenantID, &t.DocNo, &t.FromWarehouseID, &t.ToWarehouseID, &t.Status, &t.Note,
		&t.CreatedBy, &t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
	)
	return t, err
}

func (q *Queries) CountStockTransfersOnDate(ctx context.Context, day time.Time) (int32, error) {
	var n int32
	err := q.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM stock_transfers WHERE created_at::date = $1::date`, day).Scan(&n)
	return n, err
}

func (q *Queries) CreateStockTransfer(ctx context.Context, tenantID uuid.UUID, docNo string, fromID, toID uuid.UUID, note *string, createdBy pgtype.UUID) (StockTransfer, error) {
	const sql = `INSERT INTO stock_transfers (tenant_id, doc_no, from_warehouse_id, to_warehouse_id, status, note, created_by)
VALUES ($1,$2,$3,$4,'draft',$5,$6)
RETURNING id, tenant_id, doc_no, from_warehouse_id, to_warehouse_id, status, note, created_by, created_at, updated_at, completed_at`
	return scanTransfer(q.db.QueryRow(ctx, sql, tenantID, docNo, fromID, toID, note, createdBy))
}

func (q *Queries) GetStockTransferByID(ctx context.Context, id uuid.UUID) (StockTransferRow, error) {
	const sql = `SELECT st.id, st.tenant_id, st.doc_no, st.from_warehouse_id, st.to_warehouse_id, st.status, st.note, st.created_by, st.created_at, st.updated_at, st.completed_at,
       wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
FROM stock_transfers st
JOIN warehouses wf ON wf.id = st.from_warehouse_id
JOIN warehouses wt ON wt.id = st.to_warehouse_id
WHERE st.id = $1`
	var r StockTransferRow
	err := q.db.QueryRow(ctx, sql, id).Scan(
		&r.ID, &r.TenantID, &r.DocNo, &r.FromWarehouseID, &r.ToWarehouseID, &r.Status, &r.Note,
		&r.CreatedBy, &r.CreatedAt, &r.UpdatedAt, &r.CompletedAt, &r.FromWarehouseName, &r.ToWarehouseName,
	)
	return r, err
}

func (q *Queries) ListStockTransfers(ctx context.Context, limit, offset int32, status *StockDocStatus) ([]StockTransferRow, error) {
	const sql = `SELECT st.id, st.tenant_id, st.doc_no, st.from_warehouse_id, st.to_warehouse_id, st.status, st.note, st.created_by, st.created_at, st.updated_at, st.completed_at,
       wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
FROM stock_transfers st
JOIN warehouses wf ON wf.id = st.from_warehouse_id
JOIN warehouses wt ON wt.id = st.to_warehouse_id
WHERE ($3::stock_doc_status IS NULL OR st.status = $3)
ORDER BY st.created_at DESC
LIMIT $1 OFFSET $2`
	rows, err := q.db.Query(ctx, sql, limit, offset, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockTransferRow
	for rows.Next() {
		var r StockTransferRow
		if err := rows.Scan(
			&r.ID, &r.TenantID, &r.DocNo, &r.FromWarehouseID, &r.ToWarehouseID, &r.Status, &r.Note,
			&r.CreatedBy, &r.CreatedAt, &r.UpdatedAt, &r.CompletedAt, &r.FromWarehouseName, &r.ToWarehouseName,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) CountStockTransfers(ctx context.Context, status *StockDocStatus) (int64, error) {
	const sql = `SELECT COUNT(*) FROM stock_transfers st WHERE ($1::stock_doc_status IS NULL OR st.status = $1)`
	var n int64
	err := q.db.QueryRow(ctx, sql, status).Scan(&n)
	return n, err
}

func (q *Queries) UpdateStockTransferDraft(ctx context.Context, id, fromID, toID uuid.UUID, note *string) (StockTransfer, error) {
	const sql = `UPDATE stock_transfers SET from_warehouse_id = $2, to_warehouse_id = $3, note = $4, updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING id, tenant_id, doc_no, from_warehouse_id, to_warehouse_id, status, note, created_by, created_at, updated_at, completed_at`
	return scanTransfer(q.db.QueryRow(ctx, sql, id, fromID, toID, note))
}

func (q *Queries) CompleteStockTransfer(ctx context.Context, id uuid.UUID) (StockTransfer, error) {
	const sql = `UPDATE stock_transfers SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING id, tenant_id, doc_no, from_warehouse_id, to_warehouse_id, status, note, created_by, created_at, updated_at, completed_at`
	return scanTransfer(q.db.QueryRow(ctx, sql, id))
}

func (q *Queries) DeleteStockTransferItems(ctx context.Context, transferID uuid.UUID) error {
	_, err := q.db.Exec(ctx, `DELETE FROM stock_transfer_items WHERE transfer_id = $1`, transferID)
	return err
}

func (q *Queries) InsertStockTransferItem(ctx context.Context, transferID, productID uuid.UUID, qty int32) (StockTransferItem, error) {
	const sql = `INSERT INTO stock_transfer_items (transfer_id, product_id, quantity) VALUES ($1,$2,$3)
RETURNING id, transfer_id, product_id, quantity, created_at`
	var it StockTransferItem
	err := q.db.QueryRow(ctx, sql, transferID, productID, qty).Scan(&it.ID, &it.TransferID, &it.ProductID, &it.Quantity, &it.CreatedAt)
	return it, err
}

func (q *Queries) ListStockTransferItems(ctx context.Context, transferID uuid.UUID) ([]StockTransferItemRow, error) {
	const sql = `SELECT sti.id, sti.transfer_id, sti.product_id, sti.quantity, sti.created_at, p.name, p.code, p.sku
FROM stock_transfer_items sti
JOIN products p ON p.id = sti.product_id
WHERE sti.transfer_id = $1
ORDER BY sti.created_at ASC`
	rows, err := q.db.Query(ctx, sql, transferID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockTransferItemRow
	for rows.Next() {
		var r StockTransferItemRow
		if err := rows.Scan(&r.ID, &r.TransferID, &r.ProductID, &r.Quantity, &r.CreatedAt, &r.ProductName, &r.Code, &r.Sku); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func scanStockTake(row pgx.Row) (StockTake, error) {
	var t StockTake
	err := row.Scan(
		&t.ID, &t.TenantID, &t.DocNo, &t.WarehouseID, &t.Status, &t.Note,
		&t.CreatedBy, &t.CreatedAt, &t.UpdatedAt, &t.PostedAt,
	)
	return t, err
}

func (q *Queries) CountStockTakesOnDate(ctx context.Context, day time.Time) (int32, error) {
	var n int32
	err := q.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM stock_takes WHERE created_at::date = $1::date`, day).Scan(&n)
	return n, err
}

func (q *Queries) CreateStockTake(ctx context.Context, tenantID uuid.UUID, docNo string, warehouseID uuid.UUID, note *string, createdBy pgtype.UUID) (StockTake, error) {
	const sql = `INSERT INTO stock_takes (tenant_id, doc_no, warehouse_id, status, note, created_by) VALUES ($1,$2,$3,'draft',$4,$5)
RETURNING id, tenant_id, doc_no, warehouse_id, status, note, created_by, created_at, updated_at, posted_at`
	return scanStockTake(q.db.QueryRow(ctx, sql, tenantID, docNo, warehouseID, note, createdBy))
}

func (q *Queries) GetStockTakeByID(ctx context.Context, id uuid.UUID) (StockTakeRow, error) {
	const sql = `SELECT st.id, st.tenant_id, st.doc_no, st.warehouse_id, st.status, st.note, st.created_by, st.created_at, st.updated_at, st.posted_at, w.name AS warehouse_name
FROM stock_takes st
JOIN warehouses w ON w.id = st.warehouse_id
WHERE st.id = $1`
	var r StockTakeRow
	err := q.db.QueryRow(ctx, sql, id).Scan(
		&r.ID, &r.TenantID, &r.DocNo, &r.WarehouseID, &r.Status, &r.Note,
		&r.CreatedBy, &r.CreatedAt, &r.UpdatedAt, &r.PostedAt, &r.WarehouseName,
	)
	return r, err
}

func (q *Queries) ListStockTakes(ctx context.Context, limit, offset int32, status *StockTakeStatus) ([]StockTakeRow, error) {
	const sql = `SELECT st.id, st.tenant_id, st.doc_no, st.warehouse_id, st.status, st.note, st.created_by, st.created_at, st.updated_at, st.posted_at, w.name AS warehouse_name
FROM stock_takes st
JOIN warehouses w ON w.id = st.warehouse_id
WHERE ($3::stock_take_status IS NULL OR st.status = $3)
ORDER BY st.created_at DESC
LIMIT $1 OFFSET $2`
	rows, err := q.db.Query(ctx, sql, limit, offset, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockTakeRow
	for rows.Next() {
		var r StockTakeRow
		if err := rows.Scan(
			&r.ID, &r.TenantID, &r.DocNo, &r.WarehouseID, &r.Status, &r.Note,
			&r.CreatedBy, &r.CreatedAt, &r.UpdatedAt, &r.PostedAt, &r.WarehouseName,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) CountStockTakes(ctx context.Context, status *StockTakeStatus) (int64, error) {
	const sql = `SELECT COUNT(*) FROM stock_takes st WHERE ($1::stock_take_status IS NULL OR st.status = $1)`
	var n int64
	err := q.db.QueryRow(ctx, sql, status).Scan(&n)
	return n, err
}

func (q *Queries) SetStockTakeStatus(ctx context.Context, id uuid.UUID, status StockTakeStatus) (StockTake, error) {
	const sql = `UPDATE stock_takes SET status = $2, updated_at = NOW(),
    posted_at = CASE WHEN $2::stock_take_status = 'posted' THEN NOW() ELSE posted_at END
WHERE id = $1
RETURNING id, tenant_id, doc_no, warehouse_id, status, note, created_by, created_at, updated_at, posted_at`
	return scanStockTake(q.db.QueryRow(ctx, sql, id, status))
}

func (q *Queries) UpdateStockTakeDraft(ctx context.Context, id, warehouseID uuid.UUID, note *string) (StockTake, error) {
	const sql = `UPDATE stock_takes SET warehouse_id = $2, note = $3, updated_at = NOW()
WHERE id = $1 AND status IN ('draft', 'counting')
RETURNING id, tenant_id, doc_no, warehouse_id, status, note, created_by, created_at, updated_at, posted_at`
	return scanStockTake(q.db.QueryRow(ctx, sql, id, warehouseID, note))
}

func (q *Queries) DeleteStockTakeItems(ctx context.Context, stockTakeID uuid.UUID) error {
	_, err := q.db.Exec(ctx, `DELETE FROM stock_take_items WHERE stock_take_id = $1`, stockTakeID)
	return err
}

func (q *Queries) InsertStockTakeItem(ctx context.Context, stockTakeID, productID uuid.UUID, systemQty int32, countedQty *int32) (StockTakeItem, error) {
	const sql = `INSERT INTO stock_take_items (stock_take_id, product_id, system_qty, counted_qty) VALUES ($1,$2,$3,$4)
RETURNING id, stock_take_id, product_id, system_qty, counted_qty, created_at, updated_at`
	var it StockTakeItem
	err := q.db.QueryRow(ctx, sql, stockTakeID, productID, systemQty, countedQty).Scan(
		&it.ID, &it.StockTakeID, &it.ProductID, &it.SystemQty, &it.CountedQty, &it.CreatedAt, &it.UpdatedAt,
	)
	return it, err
}

func (q *Queries) ListStockTakeItems(ctx context.Context, stockTakeID uuid.UUID) ([]StockTakeItemRow, error) {
	const sql = `SELECT sti.id, sti.stock_take_id, sti.product_id, sti.system_qty, sti.counted_qty, sti.created_at, sti.updated_at, p.name, p.code, p.sku
FROM stock_take_items sti
JOIN products p ON p.id = sti.product_id
WHERE sti.stock_take_id = $1
ORDER BY p.name ASC`
	rows, err := q.db.Query(ctx, sql, stockTakeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockTakeItemRow
	for rows.Next() {
		var r StockTakeItemRow
		if err := rows.Scan(&r.ID, &r.StockTakeID, &r.ProductID, &r.SystemQty, &r.CountedQty, &r.CreatedAt, &r.UpdatedAt, &r.ProductName, &r.Code, &r.Sku); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) ListStockMovements(ctx context.Context, limit, offset int32, productID, warehouseID *uuid.UUID, changeType *products_repo.StockChangeType, fromAt, toAt *time.Time) ([]StockMovementRow, error) {
	const sql = `SELECT sh.id, sh.product_id, sh.warehouse_id, sh.change_amount, sh.previous_stock, sh.current_stock, sh.change_type, sh.reference_id, sh.note, sh.created_at,
       p.name, p.code, w.name AS warehouse_name
FROM stock_history sh
JOIN products p ON p.id = sh.product_id
LEFT JOIN warehouses w ON w.id = sh.warehouse_id
WHERE ($3::uuid IS NULL OR sh.product_id = $3)
  AND ($4::uuid IS NULL OR sh.warehouse_id = $4)
  AND ($5::stock_change_type IS NULL OR sh.change_type = $5)
  AND ($6::timestamptz IS NULL OR sh.created_at >= $6)
  AND ($7::timestamptz IS NULL OR sh.created_at <= $7)
ORDER BY sh.created_at DESC
LIMIT $1 OFFSET $2`
	rows, err := q.db.Query(ctx, sql, limit, offset, productID, warehouseID, changeType, fromAt, toAt)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StockMovementRow
	for rows.Next() {
		var r StockMovementRow
		if err := rows.Scan(
			&r.ID, &r.ProductID, &r.WarehouseID, &r.ChangeAmount, &r.PreviousStock, &r.CurrentStock,
			&r.ChangeType, &r.ReferenceID, &r.Note, &r.CreatedAt, &r.ProductName, &r.Code, &r.WarehouseName,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) CountStockMovements(ctx context.Context, productID, warehouseID *uuid.UUID, changeType *products_repo.StockChangeType, fromAt, toAt *time.Time) (int64, error) {
	const sql = `SELECT COUNT(*) FROM stock_history sh
WHERE ($1::uuid IS NULL OR sh.product_id = $1)
  AND ($2::uuid IS NULL OR sh.warehouse_id = $2)
  AND ($3::stock_change_type IS NULL OR sh.change_type = $3)
  AND ($4::timestamptz IS NULL OR sh.created_at >= $4)
  AND ($5::timestamptz IS NULL OR sh.created_at <= $5)`
	var n int64
	err := q.db.QueryRow(ctx, sql, productID, warehouseID, changeType, fromAt, toAt).Scan(&n)
	return n, err
}