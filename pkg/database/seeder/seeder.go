package seeder

import (
	cancellation_reasons_repo "dinosaurus-pos/internal/cancellation_reasons/repository"
	categories_repo "dinosaurus-pos/internal/categories/repository"
	"dinosaurus-pos/internal/measurementunits"
	measurementunits_repo "dinosaurus-pos/internal/measurementunits/repository"
	payment_methods_repo "dinosaurus-pos/internal/payment_methods/repository"
	cloudflarer2 "dinosaurus-pos/pkg/cloudflare-r2"

	user_repo "dinosaurus-pos/internal/user/repository"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/database"
	"dinosaurus-pos/pkg/logger"
	"context"

	"github.com/google/uuid"
)

func RunSeeders(ctx context.Context, tenantDB *database.TenantDB, userRepo user_repo.Querier, catRepo categories_repo.Querier, pmRepo payment_methods_repo.Querier, cancelRepo cancellation_reasons_repo.Querier, r2Client cloudflarer2.IR2, log logger.ILogger) error {
	log.Info("Running seeders...")
	if err := SeedUsers(ctx, userRepo, log); err != nil {
		log.Error("Failed to seed users", "error", err)
		return err
	}

	if err := SeedCategory(ctx, catRepo, log); err != nil {
		log.Error("Failed to seed categories", "error", err)
		return err
	}

	if err := SeedPaymentMethods(ctx, pmRepo, log); err != nil {
		log.Error("Failed to seed payment methods", "error", err)
		return err
	}
	if err := SeedCancellationReasons(ctx, cancelRepo, log); err != nil {
		log.Error("Failed to seed cancellation reasons", "error", err)
		return err
	}

	tenantID, ok := tenant.IDFromContext(ctx)
	if !ok {
		tenantID = tenant.DefaultTenantID
		ctx = tenant.WithID(ctx, tenantID)
	}
	if err := seedMeasurementUnitCatalog(ctx, tenantDB, tenantID, log); err != nil {
		log.Error("Failed to seed measurement units", "error", err)
		return err
	}

	// Seed production data (products, variants, customers, promotions, orders)
	if err := SeedProductionData(ctx, tenantDB, r2Client, log); err != nil {
		log.Error("Failed to seed production data", "error", err)
		return err
	}

	log.Info("Seeders completed successfully")
	return nil
}

func seedMeasurementUnitCatalog(ctx context.Context, db *database.TenantDB, tenantID uuid.UUID, log logger.ILogger) error {
	svc := measurementunits.NewService(measurementunits_repo.New(db), log)
	return svc.SeedDefaults(ctx, tenantID)
}
