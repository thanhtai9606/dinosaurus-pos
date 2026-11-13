//go:build integration

package database_test

import (
	"context"
	"os"
	"testing"

	"POS-kasir/internal/tenant"
	"POS-kasir/pkg/database"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func requireIntegrationDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	if os.Getenv("INTEGRATION_TEST") == "" {
		t.Skip("set INTEGRATION_TEST=1 to run RLS integration tests")
	}
	host := envOr("INTEGRATION_DB_HOST", "127.0.0.1")
	port := envOr("DB_PUBLISH_PORT", "5433")
	user := envOr("DB_USER", "pos_user")
	pass := envOr("DB_PASSWORD", "pos_password")
	name := envOr("DB_NAME", "pos_kasir")
	dsn := "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + name + "?sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	var bypassRLS bool
	if err := pool.QueryRow(context.Background(),
		`SELECT COALESCE(rolbypassrls, false) FROM pg_roles WHERE rolname = current_user`,
	).Scan(&bypassRLS); err != nil {
		t.Fatalf("role check: %v", err)
	}
	if bypassRLS {
		t.Skip("current DB user bypasses RLS (e.g. Docker POSTGRES_USER superuser); use a NOSUPERUSER app role in production — see docs/MULTITENANT_OPS.md")
	}
	return pool
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func TestRLS_OrdersIsolatedByTenant(t *testing.T) {
	pool := requireIntegrationDB(t)
	defer pool.Close()

	tenantA := tenant.DefaultTenantID
	tenantB := uuid.MustParse("00000000-0000-0000-0000-000000000099")

	ctxA := tenant.WithID(context.Background(), tenantA)
	ctxNoTenant := context.Background()

	var countA int
	connA, err := pool.Acquire(ctxA)
	if err != nil {
		t.Fatal(err)
	}
	defer connA.Release()
	_, _ = connA.Exec(ctxA, `SELECT set_config('app.tenant_id', $1, false)`, tenantA.String())
	if err := connA.QueryRow(ctxA, `SELECT count(*)::int FROM orders`).Scan(&countA); err != nil {
		t.Fatalf("count tenant A: %v", err)
	}

	connB, err := pool.Acquire(ctxNoTenant)
	if err != nil {
		t.Fatal(err)
	}
	defer connB.Release()
	_, _ = connB.Exec(ctxNoTenant, `SELECT set_config('app.tenant_id', $1, false)`, tenantB.String())
	var countB int
	err = connB.QueryRow(ctxNoTenant, `SELECT count(*)::int FROM orders`).Scan(&countB)
	if err != nil {
		t.Fatalf("count tenant B: %v", err)
	}

	// Without tenant set, RLS should hide rows (policy uses app.tenant_id).
	connNil, err := pool.Acquire(ctxNoTenant)
	if err != nil {
		t.Fatal(err)
	}
	defer connNil.Release()
	_, _ = connNil.Exec(ctxNoTenant, `SELECT set_config('app.tenant_id', '', false)`)
	var countNil int
	_ = connNil.QueryRow(ctxNoTenant, `SELECT count(*)::int FROM orders`).Scan(&countNil)

	t.Logf("orders count default=%d other=%d unset=%d", countA, countB, countNil)

	if countA > 0 && countB != 0 {
		t.Errorf("RLS: default tenant has %d orders but unknown tenant sees %d (want 0)", countA, countB)
	}
	if countNil > 0 && countA > 0 && countNil == countA {
		t.Error("expected empty or filtered result when app.tenant_id unset")
	}

	// TenantDB wrapper sets config per call.
	tdb := database.NewTenantDB(pool)
	var viaDB int
	row := tdb.QueryRow(ctxA, `SELECT count(*)::int FROM orders`)
	if err := row.Scan(&viaDB); err != nil {
		t.Fatalf("TenantDB count: %v", err)
	}
	if countA > 0 && viaDB != countA {
		t.Errorf("TenantDB count %d != manual %d", viaDB, countA)
	}
}
