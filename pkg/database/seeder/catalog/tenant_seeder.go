package catalog

import (
	cloudflarer2 "dinosaurus-pos/pkg/cloudflare-r2"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/database"
	"dinosaurus-pos/pkg/logger"
	"context"

	"github.com/google/uuid"
)

// TenantCatalogSeeder seeds demo catalog for a new tenant.
type TenantCatalogSeeder struct {
	db  *database.TenantDB
	r2  cloudflarer2.IR2
	log logger.ILogger
}

func NewTenantCatalogSeeder(db *database.TenantDB, r2 cloudflarer2.IR2, log logger.ILogger) *TenantCatalogSeeder {
	return &TenantCatalogSeeder{db: db, r2: r2, log: log}
}

func (t *TenantCatalogSeeder) SeedDemoCatalog(ctx context.Context, tenantID uuid.UUID, market, vertical string) error {
	ctx = tenant.WithID(ctx, tenantID)
	_, err := SeedDemoCatalog(ctx, t.db, t.r2, t.log, market, vertical)
	return err
}
