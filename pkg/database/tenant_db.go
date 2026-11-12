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
	pool *pgxpool.Pool
}

func NewTenantDB(pool *pgxpool.Pool) *TenantDB {
	return &TenantDB{pool: pool}
}

func (t *TenantDB) applyTenant(ctx context.Context, conn *pgx.Conn) error {
	tid, ok := tenant.IDFromContext(ctx)
	if !ok {
		return nil
	}
	_, err := conn.Exec(ctx, `SELECT set_config('app.tenant_id', $1, true)`, tid.String())
	return err
}

func (t *TenantDB) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	conn, err := t.pool.Acquire(ctx)
	if err != nil {
		return pgconn.CommandTag{}, err
	}
	defer conn.Release()
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		return pgconn.CommandTag{}, err
	}
	return conn.Exec(ctx, sql, args...)
}

func (t *TenantDB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	conn, err := t.pool.Acquire(ctx)
	if err != nil {
		return nil, err
	}
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		conn.Release()
		return nil, err
	}
	rows, err := conn.Query(ctx, sql, args...)
	if err != nil {
		conn.Release()
		return nil, err
	}
	return &tenantRows{rows: rows, conn: conn}, nil
}

func (t *TenantDB) CopyFrom(ctx context.Context, tableName pgx.Identifier, columnNames []string, rowSrc pgx.CopyFromSource) (int64, error) {
	conn, err := t.pool.Acquire(ctx)
	if err != nil {
		return 0, err
	}
	defer conn.Release()
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		return 0, err
	}
	return conn.CopyFrom(ctx, tableName, columnNames, rowSrc)
}

func (t *TenantDB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	conn, err := t.pool.Acquire(ctx)
	if err != nil {
		return errRow{err: err}
	}
	if err := t.applyTenant(ctx, conn.Conn()); err != nil {
		conn.Release()
		return errRow{err: err}
	}
	return &tenantRow{conn: conn, row: conn.QueryRow(ctx, sql, args...)}
}

type tenantRows struct {
	rows pgx.Rows
	conn *pgxpool.Conn
}

func (r *tenantRows) Close()                                       { r.rows.Close(); r.conn.Release() }
func (r *tenantRows) Err() error                                   { return r.rows.Err() }
func (r *tenantRows) CommandTag() pgconn.CommandTag                { return r.rows.CommandTag() }
func (r *tenantRows) FieldDescriptions() []pgconn.FieldDescription { return r.rows.FieldDescriptions() }
func (r *tenantRows) Next() bool                                   { return r.rows.Next() }
func (r *tenantRows) Scan(dest ...any) error                       { return r.rows.Scan(dest...) }
func (r *tenantRows) Values() ([]any, error)                       { return r.rows.Values() }
func (r *tenantRows) RawValues() [][]byte                          { return r.rows.RawValues() }
func (r *tenantRows) Conn() *pgx.Conn                              { return r.rows.Conn() }

type tenantRow struct {
	conn *pgxpool.Conn
	row  pgx.Row
	done bool
}

func (r *tenantRow) Scan(dest ...any) error {
	err := r.row.Scan(dest...)
	if !r.done {
		r.done = true
		r.conn.Release()
	}
	return err
}

type errRow struct{ err error }

func (e errRow) Scan(dest ...any) error { return e.err }
