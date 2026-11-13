package main

import (
	"POS-kasir/config"
	cancellation_reasons_repo "POS-kasir/internal/cancellation_reasons/repository"
	categories_repo "POS-kasir/internal/categories/repository"
	payment_methods_repo "POS-kasir/internal/payment_methods/repository"
	user_repo "POS-kasir/internal/user/repository"
	cloudflarer2 "POS-kasir/pkg/cloudflare-r2"
	"POS-kasir/internal/tenant"
	"POS-kasir/internal/tenants"
	"POS-kasir/pkg/database"
	"POS-kasir/pkg/database/seeder"
	"POS-kasir/pkg/logger"
	"POS-kasir/sqlc/migrations"
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	envFile := ".env"
	if len(os.Args) > 1 {
		envFile = os.Args[1]
	}

	err := godotenv.Load(envFile)
	if err != nil {
		log.Printf("Warning: Error loading %s file: %v", envFile, err)
	}

	cfg := config.Load()

	ctx := context.Background()

	logr := logger.New(cfg)

	db, err := database.NewDatabase(cfg, logr, migrations.FS)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	pool := db.GetPool()
	tenantRepo := tenants.NewRepository(pool)
	if err := tenantRepo.EnsureDefaultTenant(ctx); err != nil {
		log.Fatalf("Failed to ensure default tenant: %v", err)
	}

	tenantDB := database.NewTenantDB(pool)
	ctx = tenant.WithID(ctx, tenant.DefaultTenantID)

	r2Client, err := cloudflarer2.NewCloudflareR2(cfg, logr)
	if err != nil {
		log.Printf("Failed to initialize R2 client (images will not be uploaded): %v", err)
	}

	userRepo := user_repo.New(pool)
	catRepo := categories_repo.New(tenantDB)
	paymentMethodRepo := payment_methods_repo.New(tenantDB)
	cancelRepo := cancellation_reasons_repo.New(tenantDB)

	if err := seeder.RunSeeders(ctx, tenantDB, userRepo, catRepo, paymentMethodRepo, cancelRepo, r2Client, logr); err != nil {
		log.Fatalf("Seeding failed: %v", err)
	}

	if err := tenantRepo.AssignAllUsersToDefault(ctx); err != nil {
		log.Fatalf("Failed to assign users to default tenant: %v", err)
	}

	log.Println("Seeding completed successfully.")
}
