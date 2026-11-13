# POS Kasir - Development Makefile
# Usage: make <command>
# Pattern aligned with go-pos; adapted for infra compose + local Go/web dev.

.PHONY: help dev dev-setup dev-apps dev-backend dev-frontend dev-local dev-stop \
	prod up down restart build rebuild start stop \
	dev-infra dev-infra-down \
	create-demo-users list-users create-admin remove-data backup restore db-shell db-reset \
	logs logs-db status clean \
	migrate-version migrate-up migrate-down migrate-down-one migrate-down-all migrate-force migrate-create \
	migrate-all-databases sqlc-generate seed swag \
	test test-integration lint format deps install \
	docker-be docker-be-down

.DEFAULT_GOAL := help

GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m

COMPOSE_INFRA := docker-compose.infra.yml
COMPOSE_PROD := docker-compose.yml

MIGRATE ?= migrate
MIGRATIONS_PATH := ./sqlc/migrations

-include .env

DB_PUBLISH_PORT ?= 5433
# Migrations/cli từ máy host → Docker Postgres (published port)
LOCAL_DB_URL := postgres://$(DB_USER):$(DB_PASSWORD)@localhost:$(DB_PUBLISH_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)
DB_URL := postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)

## Help
help:
	@echo "$(BLUE)POS Kasir — Available Make Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Local development (no app Docker image):$(NC)"
	@echo "  make dev-setup      - First run: infra + migrate + seed"
	@echo "  make dev-apps       - Backend (air/go) + frontend (pnpm) — infra already up"
	@echo "  make dev-backend    - API only on :8080"
	@echo "  make dev-frontend   - Vite only on :5173 (proxies /api → :8080)"
	@echo "  make dev            - Same as: infra up + dev-apps (+ seed if empty DB)"
	@echo "  make dev-local      - Alias for dev-apps"
	@echo "  make dev-stop       - Free ports :8080 (API) and :5173 (Vite)"
	@echo ""
	@echo "$(GREEN)Infrastructure:$(NC)"
	@echo "  make up             - Postgres, Redis, MinIO (docker-compose.infra.yml)"
	@echo "  make down           - Stop infra (+ prod stack if running)"
	@echo ""
	@echo "$(GREEN)Production Docker (optional):$(NC)"
	@echo "  make prod           - Build & run app image + infra (docker-compose.yml)"
	@echo "  make restart        - down + up (infra)"
	@echo "  make build          - Build production images"
	@echo "  make rebuild        - Build production images without cache"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make migrate-up     - Apply all migrations (uses Docker if migrate CLI missing)"
	@echo "  make migrate-down-all - Roll back all migrations"
	@echo "  make migrate-create name=<name> - New migration file"
	@echo "  make seed           - Run Go seeder"
	@echo "  make create-demo-users - Seed + print demo accounts"
	@echo "  make list-users     - List users in Postgres"
	@echo "  make create-admin   - Interactive admin user"
	@echo "  make remove-data    - Truncate data (DESTRUCTIVE)"
	@echo "  make backup         - SQL backup to backups/"
	@echo "  make restore        - Restore from backups/"
	@echo "  make db-shell       - psql shell"
	@echo "  make db-reset       - migrate down all, up, seed"
	@echo "  make migrate-all-databases - Shared DB + every TENANT_DSN_* in .env"
	@echo ""
	@echo "$(GREEN)Code generation:$(NC)"
	@echo "  make sqlc-generate  - sqlc generate"
	@echo "  make swag           - Swagger + web API client"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make logs           - Follow infra compose logs"
	@echo "  make logs-db        - Postgres logs only"
	@echo "  make status         - Container / service overview"
	@echo "  make clean          - Remove compose volumes (confirm)"
	@echo "  make test           - go test + web vitest"
	@echo "  make lint           - go vet"
	@echo "  make format         - gofmt on Go sources"
	@echo "  make deps           - go mod tidy + web install"
	@echo ""
	@echo "$(YELLOW)Quick start: make dev (infra + backend + frontend)$(NC)"

## Development

dev:
	@./scripts/dev.sh

dev-setup:
	@./scripts/dev-setup.sh

dev-apps dev-local:
	@./scripts/dev-apps.sh

dev-backend:
	@./scripts/run-backend.sh

dev-frontend:
	@./scripts/run-frontend.sh

dev-stop:
	@echo "$(YELLOW)Stopping local dev listeners on :8080 and :5173...$(NC)"
	@if command -v lsof >/dev/null 2>&1; then \
		lsof -i :8080 -t 2>/dev/null | xargs -r kill -TERM 2>/dev/null || true; \
		lsof -i :5173 -t 2>/dev/null | xargs -r kill -TERM 2>/dev/null || true; \
		sleep 1; \
		if lsof -i :8080 -t >/dev/null 2>&1; then echo "$(RED)Port 8080 still in use — try: kill \$$(lsof -t -i :8080)$(NC)"; \
		else echo "$(GREEN)✅ Port 8080 free$(NC)"; fi; \
	else \
		echo "$(YELLOW)lsof not found; stop backend/frontend manually$(NC)"; \
	fi

prod:
	@echo "$(GREEN)🚀 Starting production stack...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ .env missing. Copy from .env.example$(NC)"; \
		exit 1; \
	fi
	@docker compose -f $(COMPOSE_PROD) up -d --build
	@echo "$(GREEN)✅ Production stack started.$(NC)"
	@echo "$(BLUE)App: http://localhost:$${APP_PORT:-8080}$(NC)"

up dev-infra start:
	@echo "$(GREEN)⬆️  Starting infrastructure...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)📝 Creating .env from .env.example...$(NC)"; \
		cp .env.example .env; \
	fi
	@docker compose -f $(COMPOSE_INFRA) up -d
	@echo "$(GREEN)✅ Postgres, Redis, MinIO running.$(NC)"
	@echo "$(YELLOW)Set DB_HOST=localhost in .env for local Go/web dev.$(NC)"

down dev-infra-down stop:
	@echo "$(YELLOW)⬇️  Stopping stacks...$(NC)"
	@docker compose -f $(COMPOSE_INFRA) down
	@docker compose -f $(COMPOSE_PROD) down 2>/dev/null || true
	@echo "$(GREEN)✅ Stopped.$(NC)"

restart: down up

build:
	@echo "$(GREEN)🔨 Building production images...$(NC)"
	@docker compose -f $(COMPOSE_PROD) build
	@echo "$(GREEN)✅ Build finished.$(NC)"

rebuild:
	@docker compose -f $(COMPOSE_PROD) build --no-cache

# Legacy targets (no docker-compose.backend.yml in this repo)
docker-be:
	@echo "$(YELLOW)⚠️  Use 'make prod' for containerized app, or 'make up' + go run ./cmd/app locally.$(NC)"

docker-be-down: down

## Migrations & generation

migrate-version:
	@./scripts/run-migrate.sh version

migrate-up:
	@./scripts/run-migrate.sh up

migrate-down:
	@./scripts/run-migrate.sh down

migrate-down-one:
	@./scripts/run-migrate.sh down 1

migrate-down-all:
	@./scripts/run-migrate.sh down -all

migrate-force:
	@if [ -z "$(version)" ]; then \
		echo "$(RED)Error: version= required. Example: make migrate-force version=22$(NC)"; \
		exit 1; \
	fi
	@./scripts/run-migrate.sh force $(version)

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "$(RED)Error: name= required. Example: make migrate-create name=add_foo$(NC)"; \
		exit 1; \
	fi
	$(MIGRATE) create -ext sql -dir $(MIGRATIONS_PATH) -seq $(name)

sqlc-generate:
	sqlc generate -f sqlc/sqlc.yaml

seed:
	@DB_HOST=localhost DB_PORT=$(DB_PUBLISH_PORT) REDIS_HOST=localhost \
		R2_ENDPOINT=$${R2_ENDPOINT:-http://localhost:9000} R2_USE_SSL=false \
		R2_ACCESS_KEY=$${R2_ACCESS_KEY:-minioadmin} R2_SECRET_KEY=$${R2_SECRET_KEY:-minioadmin} \
		APP_ENV=development go run ./cmd/seeder/main.go

swag:
	@echo "$(GREEN)Generating Swagger and web API client...$(NC)"
	@swag init -g ./cmd/app/main.go -o ./docs --parseDependency --parseInternal
	@swag init -g ./cmd/app/main.go -o web/api-docs --parseDependency --parseInternal --outputTypes json
	@cd web && pnpm run api:gen && pnpm run rbac:gen

## Database maintenance

create-demo-users:
	@./scripts/create-demo-users.sh

list-users:
	@echo "$(GREEN)👥 Users in $(DB_NAME):$(NC)"
	@if [ -z "$$(docker ps -q -f name=pos-postgres)" ]; then \
		echo "$(RED)❌ Run 'make up' first.$(NC)"; \
		exit 1; \
	fi
	@docker exec pos-postgres psql -U $(DB_USER) -d $(DB_NAME) -c \
		"SELECT id, username, email, role, is_active, created_at FROM users ORDER BY role, username;"

create-admin:
	@./scripts/create-admin.sh

remove-data:
	@./scripts/remove-data.sh

backup:
	@./scripts/backup.sh

restore:
	@./scripts/restore.sh

db-shell:
	@echo "$(GREEN)🐘 PostgreSQL shell ($(DB_NAME))$(NC)"
	@if [ -z "$$(docker ps -q -f name=pos-postgres)" ]; then \
		echo "$(RED)❌ Run 'make up' first.$(NC)"; \
		exit 1; \
	fi
	@docker exec -it pos-postgres psql -U $(DB_USER) -d $(DB_NAME)

db-reset:
	@./scripts/db-reset.sh

## Logs & status

logs:
	@docker compose -f $(COMPOSE_INFRA) logs -f

logs-db:
	@docker compose -f $(COMPOSE_INFRA) logs -f postgres

status:
	@echo "$(GREEN)📊 Service status$(NC)"
	@echo ""
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" -f name=pos- || echo "No pos-* containers"
	@echo ""
	@if [ -n "$$(docker ps -q -f name=pos-postgres)" ]; then echo "✅ Postgres"; else echo "❌ Postgres"; fi
	@if [ -n "$$(docker ps -q -f name=pos-redis)" ]; then echo "✅ Redis"; else echo "❌ Redis"; fi
	@if [ -n "$$(docker ps -q -f name=pos-minio)" ]; then echo "✅ MinIO"; else echo "❌ MinIO"; fi
	@if [ -n "$$(docker ps -q -f name=pos-kasir)" ]; then echo "✅ App (prod)"; else echo "— App (run locally or make prod)"; fi

clean:
	@echo "$(RED)⚠️  Removes infra/prod volumes. Type YES to continue.$(NC)"
	@read confirmation; \
	if [ "$$confirmation" = "YES" ]; then \
		docker compose -f $(COMPOSE_INFRA) down -v; \
		docker compose -f $(COMPOSE_PROD) down -v 2>/dev/null || true; \
		echo "$(GREEN)✅ Volumes removed.$(NC)"; \
	else \
		echo "$(BLUE)Cancelled.$(NC)"; \
	fi

## Tooling

test:
	@echo "$(GREEN)🧪 Backend tests$(NC)"
	@go test ./...
	@echo ""
	@echo "$(GREEN)🧪 Frontend tests$(NC)"
	@cd web && pnpm test

test-integration:
	@echo "$(GREEN)🧪 RLS integration tests (Postgres required)$(NC)"
	@INTEGRATION_TEST=1 go test -tags=integration ./pkg/database/ -count=1 -v

migrate-all-databases:
	@bash ./scripts/migrate-all-databases.sh

lint:
	@echo "$(GREEN)🔍 go vet$(NC)"
	@go vet ./...

format:
	@echo "$(GREEN)✨ gofmt$(NC)"
	@gofmt -w $$(find . -name '*.go' -not -path './web/*' -not -path './.git/*')

deps install:
	@echo "$(GREEN)📦 go mod tidy$(NC)"
	@go mod tidy
	@echo "$(GREEN)📦 web dependencies$(NC)"
	@cd web && pnpm install
