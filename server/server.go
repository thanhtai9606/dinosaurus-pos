package server

import (
	"dinosaurus-pos/config"
	"dinosaurus-pos/internal/activitylog"
	activitylog_repo "dinosaurus-pos/internal/activitylog/repository"
	"dinosaurus-pos/internal/cancellation_reasons"
	cancellation_reasons_repo "dinosaurus-pos/internal/cancellation_reasons/repository"
	"dinosaurus-pos/internal/categories"
	categories_repo "dinosaurus-pos/internal/categories/repository"
	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/store"
	"dinosaurus-pos/internal/customers"
	customers_repo "dinosaurus-pos/internal/customers/repository"
	"dinosaurus-pos/internal/customergroups"
	customergroups_repo "dinosaurus-pos/internal/customergroups/repository"
	"dinosaurus-pos/internal/stockreceipts"
	sr_repo "dinosaurus-pos/internal/stockreceipts/repository"
	"dinosaurus-pos/internal/suppliers"
	suppliers_repo "dinosaurus-pos/internal/suppliers/repository"
	"dinosaurus-pos/internal/supplierdebts"
	sd_debts_repo "dinosaurus-pos/internal/supplierdebts/repository"
	"dinosaurus-pos/internal/customerdebts"
	cd_debts_repo "dinosaurus-pos/internal/customerdebts/repository"
	"dinosaurus-pos/internal/orders"
	orders_repo "dinosaurus-pos/internal/orders/repository"
	"dinosaurus-pos/internal/payment_methods"
	payment_methods_repo "dinosaurus-pos/internal/payment_methods/repository"
	"dinosaurus-pos/internal/printer"
	"dinosaurus-pos/internal/products"
	products_repo "dinosaurus-pos/internal/products/repository"
	"dinosaurus-pos/internal/platform"
	"dinosaurus-pos/internal/promotions"
	promotions_repo "dinosaurus-pos/internal/promotions/repository"
	"dinosaurus-pos/internal/report"
	report_repo "dinosaurus-pos/internal/report/repository"
	"dinosaurus-pos/internal/settings"
	settings_repo "dinosaurus-pos/internal/settings/repository"
	"dinosaurus-pos/internal/shift"
	shift_repo "dinosaurus-pos/internal/shift/repository"
	"dinosaurus-pos/internal/tenants"
	"dinosaurus-pos/internal/user"
	user_repo "dinosaurus-pos/internal/user/repository"
	"dinosaurus-pos/pkg/cache"
	cloudflarer2 "dinosaurus-pos/pkg/cloudflare-r2"
	"dinosaurus-pos/pkg/database"
	"dinosaurus-pos/pkg/database/seeder/catalog"
	"dinosaurus-pos/pkg/escpos"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/payment"
	"dinosaurus-pos/pkg/productsearch"
	"dinosaurus-pos/pkg/utils"
	"dinosaurus-pos/pkg/validator"
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"dinosaurus-pos/internal/common/middleware"
	ws "dinosaurus-pos/internal/websocket"

	swagger "github.com/gofiber/contrib/v3/swaggo"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	fiberlog "github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/joho/godotenv"

	_ "embed"
	"html/template"

	"dinosaurus-pos/sqlc/migrations"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

//go:embed swagger_script.js
var swaggerScript string

type App struct {
	Config          *config.AppConfig
	Logger          logger.ILogger
	DB              database.IDatabase
	FiberApp        *fiber.App
	JWT             utils.Manager
	Store           store.Store
	Validator       validator.Validator
	MidtransService payment.IMidtrans
	R2              cloudflarer2.IR2
	Cache           *shift.Cache
	RedisCache      cache.Cache
	Redis           *redis.Client
	PoolRouter      *database.PoolRouter
}

type AppContainer struct {
	AuthHandler               user.IAuthHandler
	UserHandler               user.IUsrHandler
	CategoryHandler           categories.ICtgHandler
	CustomerHandler           customers.ICustomerHandler
	CustomerGroupHandler      customergroups.ICustomerGroupHandler
	SupplierHandler           suppliers.ISupplierHandler
	StockReceiptHandler       stockreceipts.IStockReceiptHandler
	SupplierDebtHandler       supplierdebts.ISupplierDebtHandler
	CustomerDebtHandler       customerdebts.ICustomerDebtHandler
	ProductHandler            products.IPrdHandler
	OrderHandler              orders.IOrderHandler
	PaymentMethodHandler      payment_methods.IPaymentMethodHandler
	CancellationReasonHandler cancellation_reasons.ICancellationReasonHandler
	ReportHandler             report.IRptHandler
	PromotionHandler          promotions.IPromotionHandler
	ActivityLogHandler        *activitylog.ActivityLogHandler
	SettingsHandler           *settings.SettingsHandler
	PrinterHandler            *printer.PrinterHandler
	ShiftHandler              shift.Handler
	TenantHandler             *tenants.Handler
	PlatformHandler           *platform.Handler
	ShiftRepo                 shift_repo.Querier
	ShiftService              shift.Service
	WSHub                     *ws.Hub
	UserRepo                  user_repo.Querier
	CategoryRepo              categories_repo.Querier
	PaymentMethodRepo         payment_methods_repo.Querier
	CancellationReasonRepo    cancellation_reasons_repo.Querier
}

func InitApp() *App {
	// Load fills unset vars only so make dev / Docker env overrides .env (e.g. DB_HOST).
	if err := godotenv.Load(); err != nil {
		if os.Getenv("APP_ENV") != "production" {
			log.Println("Warning: .env file not found or could not be loaded")
		}
	}

	cfg := config.Load()
	log := logger.New(cfg)

	db, err := database.NewDatabase(cfg, log, migrations.FS)
	if err != nil {
		log.Fatalf("Failed to initialize PostgreSQL: %v", err)
	}

	jwtManager := utils.NewJWTManager(cfg)

	store := store.New(db.GetPool())
	val := validator.NewValidator()

	fiberApp := fiber.New(fiber.Config{
		AppName:         cfg.Server.AppName,
		ErrorHandler:    CustomErrorHandler(log),
		StructValidator: val,
	})

	// Global Middlewares
	fiberApp.Use(recover.New())
	fiberApp.Use(middleware.NewSentryMiddleware())
	midtransService := payment.NewMidtransService(cfg, log)

	log.Infof("Initializing R2 Storage with Bucket: %s", cfg.CloudflareR2.Bucket)
	newR2, err := cloudflarer2.NewCloudflareR2(cfg, log)
	if err != nil {
		log.Errorf("Failed to initialize Cloudflare R2: %v", err)
	} else {
		log.Info("Successfully initialized Cloudflare R2 storage")
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Host + ":" + cfg.Redis.Port,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	redisCache := cache.NewRedisCache(rdb)
	shiftCache := shift.NewCache(redisCache)

	return &App{
		Config:          cfg,
		Logger:          log,
		DB:              db,
		FiberApp:        fiberApp,
		JWT:             jwtManager,
		Store:           store,
		Validator:       val,
		MidtransService: midtransService,
		R2:              newR2,
		Cache:           shiftCache,
		RedisCache:      redisCache,
		Redis:           rdb,
	}
}

func BuildAppContainer(app *App) *AppContainer {
	wsHub := ws.InitHub()

	pool := app.DB.GetPool()
	tenantRepo := tenants.NewRepository(pool)
	poolRouter := database.NewPoolRouter(pool, app.Logger, tenantRepo.RoutingForTenant)
	app.PoolRouter = poolRouter
	tenantDB := database.NewRoutedTenantDB(poolRouter)
	platformRepo := platform.NewRepository(pool)
	platformSvc := platform.NewService(platformRepo, tenantRepo, pool, poolRouter)
	platformOverviewCache := platform.NewOverviewCache(app.RedisCache)
	platformHandler := platform.NewHandler(platformSvc, app.Logger, platformOverviewCache)
	platformAudit := platform.NewRecorder(platformRepo)

	// Activity Log IActivityService
	activityLogRepo := activitylog_repo.New(tenantDB)
	activityService := activitylog.NewActivityService(activityLogRepo, app.Logger)
	activityLogHandler := activitylog.NewActivityLogHandler(activityService, app.Logger)

	// User Module
	userAvatarRepo := user.NewAuthRepo(app.Logger, app.R2)
	userRepo := user_repo.New(pool)
	customerGroupRepo := customergroups_repo.New(tenantDB)
	customerGroupService := customergroups.NewService(customerGroupRepo, app.Logger)
	customerGroupHandler := customergroups.NewHandler(customerGroupService, app.Logger)

	tenantCatalogSeeder := catalog.NewTenantCatalogSeeder(tenantDB, app.R2, app.Logger)
	tenantService := tenants.NewService(tenantRepo, userRepo, app.Logger, customerGroupService, tenantCatalogSeeder)
	tenantLookupCache := tenants.NewLookupCache(app.RedisCache)
	tenantHandler := tenants.NewHandler(tenantRepo, tenantService, app.Logger, platformAudit, tenantLookupCache, platformOverviewCache)
	userService := user.NewUsrService(userRepo, tenantRepo, app.Logger, activityService, userAvatarRepo)
	userHandler := user.NewUsrHandler(userService, app.Logger, app.Validator)

	// Auth Module (Merged into user domain)
	authService := user.NewAuthService(userRepo, tenantRepo, app.Logger, app.JWT, userAvatarRepo, activityService)
	authHandler := user.NewAuthHandler(authService, app.Logger, app.Validator, app.Config, platformAudit)

	// Category Module
	categoryRepo := categories_repo.New(tenantDB)
	categoryService := categories.NewCtgService(categoryRepo, app.Logger, activityService)
	categoryHandler := categories.NewCtgHandler(categoryService, app.Logger)

	// Customer Module
	customerRepo := customers_repo.New(tenantDB)
	customerService := customers.NewCustomerService(customerRepo, app.Logger)
	customerHandler := customers.NewCustomerHandler(customerService, app.Logger)

	// Supplier Module
	supplierRepo := suppliers_repo.New(tenantDB)
	supplierService := suppliers.NewSupplierService(supplierRepo, app.Logger)
	supplierHandler := suppliers.NewSupplierHandler(supplierService, app.Logger)

	// Stock receipt Module
	stockReceiptRepo := sr_repo.New(tenantDB)
	stockReceiptService := stockreceipts.NewStockReceiptService(stockReceiptRepo, app.Store, app.Logger)
	stockReceiptHandler := stockreceipts.NewStockReceiptHandler(stockReceiptService, app.Logger)

	supplierDebtRepo := sd_debts_repo.New(tenantDB)
	supplierDebtService := supplierdebts.NewSupplierDebtService(supplierDebtRepo, app.Store, app.Logger)
	supplierDebtHandler := supplierdebts.NewSupplierDebtHandler(supplierDebtService, app.Logger)

	customerDebtRepo := cd_debts_repo.New(tenantDB)
	customerDebtService := customerdebts.NewCustomerDebtService(customerDebtRepo, app.Store, app.Logger)
	customerDebtHandler := customerdebts.NewCustomerDebtHandler(customerDebtService, app.Logger)

	productListCache := products.NewListCache(app.RedisCache)

	// Product search (Meilisearch)
	var productIndexer productsearch.Indexer = productsearch.NoopIndexer{}
	if app.Config.Meili.Enabled {
		productIndexer = productsearch.NewMeiliIndexer(productsearch.MeiliConfig{
			Host:    app.Config.Meili.Host,
			APIKey:  app.Config.Meili.APIKey,
			Index:   app.Config.Meili.Index,
			Enabled: true,
		})
		if err := productIndexer.EnsureIndex(context.Background()); err != nil {
			app.Logger.Warnf("Meilisearch index setup failed: %v", err)
		} else if app.Config.Meili.AutoReindex {
			go func() {
				reindexCtx := context.Background()
				allTenants, err := tenantRepo.ListAll(reindexCtx)
				if err != nil {
					app.Logger.Warnf("Meilisearch auto-reindex: list tenants: %v", err)
					return
				}
				var tenantIDs []uuid.UUID
				for _, t := range allTenants {
					if t.IsActive {
						tenantIDs = append(tenantIDs, t.ID)
					}
				}
				svc := products.NewPrdService(app.Store, products_repo.New(tenantDB), app.Logger, products.NewProductImageRepository(app.R2, app.Logger), activityService, productIndexer, productListCache)
				if n, err := svc.ReindexProductSearchAllTenants(reindexCtx, tenantIDs); err != nil {
					app.Logger.Warnf("Meilisearch auto-reindex failed: %v", err)
				} else {
					app.Logger.Infof("Meilisearch indexed %d products", n)
				}
			}()
		}
	}

	// Product Module
	prdRepo := products.NewProductImageRepository(app.R2, app.Logger)
	productsRepo := products_repo.New(tenantDB)
	prdService := products.NewPrdService(app.Store, productsRepo, app.Logger, prdRepo, activityService, productIndexer, productListCache)
	prdHandler := products.NewPrdHandler(prdService, app.Logger)

	// Shift Module Repo
	shiftRepo := shift_repo.New(tenantDB)

	// Settings Module (needed by orders & printer)
	settingsRepo := settings_repo.New(tenantDB)
	settingsService := settings.NewSettingsService(app.Store, activityService, settingsRepo, app.R2, app.Logger)
	settingsHandler := settings.NewSettingsHandler(settingsService, app.Logger)

	// Order & Payment Module
	ordersRepo := orders_repo.New(tenantDB)
	orderService := orders.NewOrderService(app.Store, ordersRepo, productsRepo, app.MidtransService, activityService, settingsService, app.Logger, wsHub)
	orderHandler := orders.NewOrderHandler(orderService, app.Logger)

	// Payment Method Module
	paymentMethodRepo := payment_methods_repo.New(tenantDB)
	paymentMethodService := payment_methods.NewPaymentMethodService(paymentMethodRepo, app.Logger)
	paymentMethodHandler := payment_methods.NewPaymentMethodHandler(paymentMethodService, app.Logger)

	// Cancellation Reason Module
	cancellationRepo := cancellation_reasons_repo.New(tenantDB)
	cancellationReasonService := cancellation_reasons.NewCancellationReasonService(cancellationRepo, app.Logger)
	cancellationReasonHandler := cancellation_reasons.NewCancellationReasonHandler(cancellationReasonService, app.Logger)

	// report module
	reportRepo := report_repo.New(tenantDB)
	reportService := report.NewRptService(app.Store, reportRepo, activityService, app.Logger, app.RedisCache)
	reportHandler := report.NewRptHandler(reportService, app.Logger)

	// Promotion Module
	promotionsRepo := promotions_repo.New(tenantDB)
	promotionService := promotions.NewPromotionService(app.Store, promotionsRepo, app.Logger, activityService)
	promotionHandler := promotions.NewPromotionHandler(promotionService, app.Logger)

	// Printer Module
	printerService := printer.NewPrinterService(orderService, settingsService, paymentMethodService, userRepo, app.Logger, escpos.NewPrinter)
	printerHandler := printer.NewPrinterHandler(printerService)

	// Shift Module
	shiftService := shift.NewService(shiftRepo, app.Logger, app.Cache)
	shiftHandler := shift.NewHandler(shiftService, app.Logger)

	return &AppContainer{
		AuthHandler:               authHandler,
		UserHandler:               userHandler,
		CategoryHandler:           categoryHandler,
		CustomerHandler:           customerHandler,
		CustomerGroupHandler:      customerGroupHandler,
		SupplierHandler:           supplierHandler,
		StockReceiptHandler:       stockReceiptHandler,
		SupplierDebtHandler:       supplierDebtHandler,
		CustomerDebtHandler:       customerDebtHandler,
		ProductHandler:            prdHandler,
		OrderHandler:              orderHandler,
		PaymentMethodHandler:      paymentMethodHandler,
		CancellationReasonHandler: cancellationReasonHandler,
		ReportHandler:             reportHandler,
		PromotionHandler:          promotionHandler,
		ActivityLogHandler:        activityLogHandler,
		SettingsHandler:           settingsHandler,
		PrinterHandler:            printerHandler,
		ShiftHandler:              shiftHandler,
		TenantHandler:             tenantHandler,
		PlatformHandler:           platformHandler,
		ShiftRepo:                 shiftRepo,
		ShiftService:              shiftService,
		WSHub:                     wsHub,
		UserRepo:                  userRepo,
		CategoryRepo:              categoryRepo,
		PaymentMethodRepo:         paymentMethodRepo,
		CancellationReasonRepo:    cancellationRepo,
	}
}

func StartServer(app *App) {
	SetupMiddleware(app)
	container := BuildAppContainer(app)

	SetupCron(app, container)
	SetupRoutes(app, container)

	app.Logger.Infof("Starting app on port %s...", app.Config.Server.Port)
	if err := app.FiberApp.Listen(":" + app.Config.Server.Port); err != nil {
		app.Logger.Fatalf("Error starting app: %v", err)
	}
}

func SetupMiddleware(app *App) {
	origins := strings.TrimSpace(app.Config.Server.CorsAllowOrigins)

	if origins != "" {
		app.FiberApp.Use(cors.New(cors.Config{
			AllowOrigins:     strings.Split(origins, ","),
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			ExposeHeaders:    []string{"Content-Length", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers", "Access-Control-Allow-Methods"},
			AllowCredentials: true,
			MaxAge:           300,
		}))
	}
	app.FiberApp.Use(fiberlog.New())
	app.FiberApp.Use(recover.New())

	app.FiberApp.Get("/swagger/*", swagger.New(
		swagger.Config{
			URL:            "/swagger/doc.json",
			CustomScript:   template.JS(swaggerScript),
			ShowExtensions: true,
		}))

	app.Logger.Infof("Swagger UI available at http://localhost:%s/swagger/index.html", app.Config.Server.Port)
}

func Cleanup(app *App) {
	if app.PoolRouter != nil {
		app.PoolRouter.CloseDedicated()
	}
	if app.DB != nil {
		app.DB.Close()
	}
}

func WaitForShutdown(app *App) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	app.Logger.Info("Shutting down app...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.FiberApp.ShutdownWithContext(ctx); err != nil {
		app.Logger.Fatalf("Server shutdown failed: %v", err)
	}
}

func CustomErrorHandler(logger logger.ILogger) fiber.ErrorHandler {
	return func(c fiber.Ctx, err error) error {
		logger.Errorf("Error 1: %v", err)

		var e *fiber.Error
		if errors.As(err, &e) {
			logger.Errorf("Fiber error 1: %v", e)
			return c.Status(e.Code).JSON(common.ErrorResponse{
				Message: e.Message,
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{
			Message: "Internal Server Error",
		})
	}
}
