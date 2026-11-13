package database

import (
	"context"
	"fmt"
	"os"
	"sync"

	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantRouting describes where a tenant's business data lives.
type TenantRouting struct {
	DataPlane      string // shared | dedicated
	DatabaseDSNKey string // env var name, e.g. TENANT_DSN_ACME
}

type TenantRoutingLookup func(ctx context.Context, tenantID uuid.UUID) (TenantRouting, error)

// PoolRouter returns the pgx pool for the current request tenant (shared or dedicated DSN).
type PoolRouter struct {
	shared    *pgxpool.Pool
	log       logger.ILogger
	lookup    TenantRoutingLookup
	dedicated sync.Map // env key -> *pgxpool.Pool
}

func NewPoolRouter(shared *pgxpool.Pool, log logger.ILogger, lookup TenantRoutingLookup) *PoolRouter {
	return &PoolRouter{shared: shared, log: log, lookup: lookup}
}

func (r *PoolRouter) SharedPool() *pgxpool.Pool {
	return r.shared
}

func (r *PoolRouter) PoolForContext(ctx context.Context) *pgxpool.Pool {
	tid, ok := tenant.IDFromContext(ctx)
	if !ok || r.lookup == nil {
		return r.shared
	}
	route, err := r.lookup(ctx, tid)
	if err != nil {
		r.log.Warnf("PoolRouter: lookup failed for tenant %s: %v", tid, err)
		return r.shared
	}
	if route.DataPlane != "dedicated" || route.DatabaseDSNKey == "" {
		return r.shared
	}
	if p, ok := r.dedicated.Load(route.DatabaseDSNKey); ok {
		return p.(*pgxpool.Pool)
	}
	dsn := os.Getenv(route.DatabaseDSNKey)
	if dsn == "" {
		r.log.Errorf("PoolRouter: missing env %s for dedicated tenant %s", route.DatabaseDSNKey, tid)
		return r.shared
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		r.log.Errorf("PoolRouter: connect %s: %v", route.DatabaseDSNKey, err)
		return r.shared
	}
	actual, loaded := r.dedicated.LoadOrStore(route.DatabaseDSNKey, pool)
	if loaded {
		pool.Close()
		return actual.(*pgxpool.Pool)
	}
	r.log.Infof("PoolRouter: opened dedicated pool for env key %s", route.DatabaseDSNKey)
	return pool
}

func (r *PoolRouter) DedicatedPoolCount() int {
	n := 0
	r.dedicated.Range(func(_, _ any) bool {
		n++
		return true
	})
	return n
}

// CloseDedicated closes cached dedicated pools (app shutdown).
func (r *PoolRouter) CloseDedicated() {
	r.dedicated.Range(func(key, value any) bool {
		if p, ok := value.(*pgxpool.Pool); ok {
			p.Close()
		}
		return true
	})
}

// RegisterDedicatedFromEnv pre-warms a pool from an env var (optional at startup).
func (r *PoolRouter) RegisterDedicatedFromEnv(ctx context.Context, envKey string) error {
	dsn := os.Getenv(envKey)
	if dsn == "" {
		return fmt.Errorf("env %s not set", envKey)
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return err
	}
	r.dedicated.Store(envKey, pool)
	return nil
}
