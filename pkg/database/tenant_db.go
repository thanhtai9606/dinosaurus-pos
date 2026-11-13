package database

import (
	"POS-kasir/internal/tenant"
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantDB implements sqlc DBTX: each operation acquires a connection and sets app.tenant_id for RLS.
type TenantDB struct {
	pool   *pgxpool.Pool
	router *PoolRouter
}

func NewTenantDB(pool *pgxpool.Pool) *TenantDB {
	return &TenantDB{pool: pool}
}

// NewRoutedTenantDB routes business queries to shared or dedicated pools via PoolRouter.
func NewRoutedTenantDB(router *PoolRouter) *TenantDB {
	return &TenantDB{router: router}
}

func (t *TenantDB) poolFor(ctx context.Context) *pgxpool.Pool {
	if t.router != nil {
		return t.router.PoolForContext(ctx)
	}
	return t.pool
}

func (t *TenantDB) applyTenant(ctx context.Context, conn *pgx.Conn) error {
	tid, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil
	}
	// Session-level: autocommit runs set_config and DML as separate tx; is_local=true would not apply.
	_, err := conn.Exec(ctx, `SELECT set_config('app.tenant_id', $1, false)`, tid.String())
	return err
}

func (t *TenantDB) resetTenant(ctx context.Context, conn *pgx.Conn) {
	_, _ = conn.Exec(ctx, `SELECT set_config('app.tenant_id', '', false)`)
}

func (t *TenantDB) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	conn, err := t.poolFor(ctx).Acquire(ctx)
	if err != nil {
		return pgconn.CommandTag{}, err
	}
	defer func() {
		t.resetTenant(ctx, conn.Conn())
		conn.Release()
	}()
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		return pgconn.CommandTag{}, err
	}
	return conn.Exec(ctx, sql, args...)
}

func (t *TenantDB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	conn, err := t.poolFor(ctx).Acquire(ctx)
	if err != nil {
		return nil, err
	}
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		conn.Release()
		return nil, err
	}
	rows, err := conn.Query(ctx, sql, args...)
	if err != nil {
		t.resetTenant(ctx, conn.Conn())
		conn.Release()
		return nil, err
	}
	return &tenantRows{rows: rows, conn: conn, pool: t, ctx: ctx}, nil
}

func (t *TenantDB) CopyFrom(ctx context.Context, tableName pgx.Identifier, columnNames []string, rowSrc pgx.CopyFromSource) (int64, error) {
	conn, err := t.poolFor(ctx).Acquire(ctx)
	if err != nil {
		return 0, err
	}
	defer func() {
		t.resetTenant(ctx, conn.Conn())
		conn.Release()
	}()
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		return 0, err
	}
	return conn.CopyFrom(ctx, tableName, columnNames, rowSrc)
}

func (t *TenantDB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	conn, err := t.poolFor(ctx).Acquire(ctx)
	if err != nil {
		return errRow{err: err}
	}
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		conn.Release()
		return errRow{err: err}
	}
	return &tenantRow{pool: t, ctx: ctx, conn: conn, row: conn.QueryRow(ctx, sql, args...)}
}

type tenantRows struct {
	rows pgx.Rows
	conn *pgxpool.Conn
	pool *TenantDB
	ctx  context.Context
}

func (r *tenantRows) Close() {
	r.rows.Close()
	if r.pool != nil {
		r.pool.resetTenant(r.ctx, r.conn.Conn())
	}
	r.conn.Release()
}
func (r *tenantRows) Err() error                                   { return r.rows.Err() }
func (r *tenantRows) CommandTag() pgconn.CommandTag                { return r.rows.CommandTag() }
func (r *tenantRows) FieldDescriptions() []pgconn.FieldDescription { return r.rows.FieldDescriptions() }
func (r *tenantRows) Next() bool                                   { return r.rows.Next() }
func (r *tenantRows) Scan(dest ...any) error                       { return r.rows.Scan(dest...) }
func (r *tenantRows) Values() ([]any, error)                       { return r.rows.Values() }
func (r *tenantRows) RawValues() [][]byte                          { return r.rows.RawValues() }
func (r *tenantRows) Conn() *pgx.Conn                              { return r.rows.Conn() }

type tenantRow struct {
	pool *TenantDB
	ctx  context.Context
	conn *pgxpool.Conn
	row  pgx.Row
	done bool
}

func (r *tenantRow) Scan(dest ...any) error {
	err := r.row.Scan(dest...)
	if !r.done {
		r.done = true
		if r.pool != nil {
			r.pool.resetTenant(r.ctx, r.conn.Conn())
		}
		r.conn.Release()
	}
	return err
}

type errRow struct{ err error }

func (e errRow) Scan(dest ...any) error { return e.err }
