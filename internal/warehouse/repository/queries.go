package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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

type Warehouse struct {
	ID         uuid.UUID `json:"id"`
	TenantID   uuid.UUID `json:"tenant_id"`
	Code       string    `json:"code"`
	Name       string    `json:"name"`
	IsDefault  bool      `json:"is_default"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type WarehouseStock struct {
	ID          uuid.UUID `json:"id"`
	TenantID    uuid.UUID `json:"tenant_id"`
	WarehouseID uuid.UUID `json:"warehouse_id"`
	ProductID   uuid.UUID `json:"product_id"`
	Quantity    int32     `json:"quantity"`
	MinStock    int32     `json:"min_stock"`
}

type WarehouseStockRow struct {
	WarehouseStock
	ProductName string  `json:"product_name"`
	Code        *string `json:"code"`
	Sku         *string `json:"sku"`
	Unit        string  `json:"unit"`
}

func scanWarehouse(row pgx.Row) (Warehouse, error) {
	var w Warehouse
	err := row.Scan(&w.ID, &w.TenantID, &w.Code, &w.Name, &w.IsDefault, &w.IsActive, &w.CreatedAt, &w.UpdatedAt)
	return w, err
}

func (q *Queries) CreateWarehouse(ctx context.Context, tenantID uuid.UUID, code, name string, isDefault, isActive bool) (Warehouse, error) {
	const sql = `INSERT INTO warehouses (tenant_id, code, name, is_default, is_active)
VALUES ($1,$2,$3,$4,$5)
RETURNING id, tenant_id, code, name, is_default, is_active, created_at, updated_at`
	return scanWarehouse(q.db.QueryRow(ctx, sql, tenantID, code, name, isDefault, isActive))
}

func (q *Queries) GetWarehouseByID(ctx context.Context, tenantID, id uuid.UUID) (Warehouse, error) {
	const sql = `SELECT id, tenant_id, code, name, is_default, is_active, created_at, updated_at
FROM warehouses WHERE id=$1 AND tenant_id=$2`
	return scanWarehouse(q.db.QueryRow(ctx, sql, id, tenantID))
}

func (q *Queries) GetDefaultWarehouse(ctx context.Context, tenantID uuid.UUID) (Warehouse, error) {
	const sql = `SELECT id, tenant_id, code, name, is_default, is_active, created_at, updated_at
FROM warehouses WHERE tenant_id=$1 AND is_default=true AND is_active=true ORDER BY created_at ASC LIMIT 1`
	return scanWarehouse(q.db.QueryRow(ctx, sql, tenantID))
}

func (q *Queries) ListWarehouses(ctx context.Context, tenantID uuid.UUID, limit, offset int32, search *string, activeOnly bool) ([]Warehouse, error) {
	const sql = `SELECT id, tenant_id, code, name, is_default, is_active, created_at, updated_at FROM warehouses
WHERE tenant_id=$3
  AND ($4::bool IS NOT TRUE OR is_active=true)
  AND ($5::text IS NULL OR name ILIKE '%'||$5||'%' OR code ILIKE '%'||$5||'%')
ORDER BY is_default DESC, name ASC LIMIT $1 OFFSET $2`
	rows, err := q.db.Query(ctx, sql, limit, offset, tenantID, activeOnly, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Warehouse
	for rows.Next() {
		w, err := scanWarehouse(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

func (q *Queries) CountWarehouses(ctx context.Context, tenantID uuid.UUID, search *string, activeOnly bool) (int64, error) {
	const sql = `SELECT COUNT(*) FROM warehouses
WHERE tenant_id=$3
  AND ($2::bool IS NOT TRUE OR is_active=true)
  AND ($1::text IS NULL OR name ILIKE '%'||$1||'%' OR code ILIKE '%'||$1||'%')`
	var n int64
	err := q.db.QueryRow(ctx, sql, search, activeOnly, tenantID).Scan(&n)
	return n, err
}

func (q *Queries) UpdateWarehouse(ctx context.Context, tenantID, id uuid.UUID, code, name string, isDefault, isActive bool) (Warehouse, error) {
	const sql = `UPDATE warehouses SET code=$3,name=$4,is_default=$5,is_active=$6,updated_at=NOW()
WHERE id=$1 AND tenant_id=$2
RETURNING id, tenant_id, code, name, is_default, is_active, created_at, updated_at`
	return scanWarehouse(q.db.QueryRow(ctx, sql, id, tenantID, code, name, isDefault, isActive))
}

func (q *Queries) ClearDefaultWarehouse(ctx context.Context, tenantID uuid.UUID) error {
	_, err := q.db.Exec(ctx, `UPDATE warehouses SET is_default=false, updated_at=NOW() WHERE tenant_id=$1 AND is_default=true`, tenantID)
	return err
}

func (q *Queries) WarehouseHasPositiveStock(ctx context.Context, warehouseID uuid.UUID) (bool, error) {
	var exists bool
	err := q.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM warehouse_stock WHERE warehouse_id=$1 AND quantity > 0)`, warehouseID).Scan(&exists)
	return exists, err
}

func (q *Queries) DeleteWarehouse(ctx context.Context, tenantID, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, `DELETE FROM warehouses WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	return err
}

func (q *Queries) SeedDefaultWarehouse(ctx context.Context, tenantID uuid.UUID) (Warehouse, error) {
	const sql = `INSERT INTO warehouses (tenant_id, code, name, is_default, is_active)
VALUES ($1,'MAIN','Main warehouse',true,true)
ON CONFLICT (tenant_id, code) DO UPDATE SET updated_at=NOW()
RETURNING id, tenant_id, code, name, is_default, is_active, created_at, updated_at`
	return scanWarehouse(q.db.QueryRow(ctx, sql, tenantID))
}

func (q *Queries) GetWarehouseStock(ctx context.Context, warehouseID, productID uuid.UUID) (WarehouseStock, error) {
	const sql = `SELECT id, tenant_id, warehouse_id, product_id, quantity, min_stock FROM warehouse_stock
WHERE warehouse_id=$1 AND product_id=$2`
	var ws WarehouseStock
	err := q.db.QueryRow(ctx, sql, warehouseID, productID).Scan(
		&ws.ID, &ws.TenantID, &ws.WarehouseID, &ws.ProductID, &ws.Quantity, &ws.MinStock,
	)
	return ws, err
}

func (q *Queries) EnsureWarehouseStockRow(ctx context.Context, tenantID, warehouseID, productID uuid.UUID, minStock int32) (WarehouseStock, error) {
	const sql = `INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity, min_stock)
VALUES ($1,$2,$3,0,$4)
ON CONFLICT (warehouse_id, product_id) DO UPDATE SET updated_at=NOW()
RETURNING id, tenant_id, warehouse_id, product_id, quantity, min_stock`
	var ws WarehouseStock
	err := q.db.QueryRow(ctx, sql, tenantID, warehouseID, productID, minStock).Scan(
		&ws.ID, &ws.TenantID, &ws.WarehouseID, &ws.ProductID, &ws.Quantity, &ws.MinStock,
	)
	return ws, err
}

func (q *Queries) AddWarehouseStockQty(ctx context.Context, warehouseID, productID uuid.UUID, delta int32) (WarehouseStock, error) {
	const sql = `UPDATE warehouse_stock SET quantity = quantity + $3, updated_at=NOW()
WHERE warehouse_id=$1 AND product_id=$2 AND quantity + $3 >= 0
RETURNING id, tenant_id, warehouse_id, product_id, quantity, min_stock`
	var ws WarehouseStock
	err := q.db.QueryRow(ctx, sql, warehouseID, productID, delta).Scan(
		&ws.ID, &ws.TenantID, &ws.WarehouseID, &ws.ProductID, &ws.Quantity, &ws.MinStock,
	)
	return ws, err
}

func (q *Queries) SumProductStockAcrossWarehouses(ctx context.Context, productID uuid.UUID) (int32, error) {
	var total int32
	err := q.db.QueryRow(ctx, `SELECT COALESCE(SUM(quantity),0)::int FROM warehouse_stock WHERE product_id=$1`, productID).Scan(&total)
	return total, err
}

func (q *Queries) ListWarehouseStockByWarehouse(ctx context.Context, warehouseID uuid.UUID, limit, offset int32, search *string, lowStockOnly bool) ([]WarehouseStockRow, error) {
	const sql = `SELECT ws.id, ws.tenant_id, ws.warehouse_id, ws.product_id, ws.quantity, ws.min_stock,
p.name, p.code, p.sku, p.unit
FROM warehouse_stock ws
JOIN products p ON p.id=ws.product_id AND p.deleted_at IS NULL
WHERE ws.warehouse_id=$1
  AND ($4::text IS NULL OR p.name ILIKE '%'||$4||'%' OR p.code ILIKE '%'||$4||'%' OR p.sku ILIKE '%'||$4||'%')
  AND ($5::bool IS NOT TRUE OR ws.quantity <= ws.min_stock)
ORDER BY p.name ASC LIMIT $2 OFFSET $3`
	rows, err := q.db.Query(ctx, sql, warehouseID, limit, offset, search, lowStockOnly)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []WarehouseStockRow
	for rows.Next() {
		var r WarehouseStockRow
		err := rows.Scan(&r.ID, &r.TenantID, &r.WarehouseID, &r.ProductID, &r.Quantity, &r.MinStock,
			&r.ProductName, &r.Code, &r.Sku, &r.Unit)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) CountWarehouseStockByWarehouse(ctx context.Context, warehouseID uuid.UUID, search *string, lowStockOnly bool) (int64, error) {
	const sql = `SELECT COUNT(*) FROM warehouse_stock ws
JOIN products p ON p.id=ws.product_id AND p.deleted_at IS NULL
WHERE ws.warehouse_id=$1
  AND ($2::text IS NULL OR p.name ILIKE '%'||$2||'%' OR p.code ILIKE '%'||$2||'%' OR p.sku ILIKE '%'||$2||'%')
  AND ($3::bool IS NOT TRUE OR ws.quantity <= ws.min_stock)`
	var n int64
	err := q.db.QueryRow(ctx, sql, warehouseID, search, lowStockOnly).Scan(&n)
	return n, err
}