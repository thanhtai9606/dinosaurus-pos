#!/usr/bin/env bash
# Start infra + backend (air) + frontend (pnpm dev). Ctrl+C stops app processes only.

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_INFRA="${COMPOSE_INFRA:-docker-compose.infra.yml}"

cd "$REPO_ROOT"

# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
	echo ""
	echo -e "${YELLOW}⏹️  Stopping backend and frontend...${NC}"
	if [[ -n "$FRONTEND_PID" ]]; then
		kill -TERM "$FRONTEND_PID" 2>/dev/null || true
		pkill -P "$FRONTEND_PID" 2>/dev/null || true
	fi
	if [[ -n "$BACKEND_PID" ]]; then
		kill -TERM "$BACKEND_PID" 2>/dev/null || true
		pkill -P "$BACKEND_PID" 2>/dev/null || true
	fi
	wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

if [[ ! -f .env ]]; then
	echo -e "${YELLOW}📝 Creating .env from .env.example...${NC}"
	cp .env.example .env
	# shellcheck source=common.sh
	source "$SCRIPT_DIR/common.sh"
fi

if ! command -v pnpm >/dev/null 2>&1; then
	echo -e "${RED}❌ pnpm not found. Install Node 22+ and enable pnpm.${NC}"
	exit 1
fi

if [[ ! -d web/node_modules ]]; then
	echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
	(cd web && pnpm install)
fi

echo -e "${GREEN}⬆️  Starting infrastructure...${NC}"
docker compose -f "$COMPOSE_INFRA" up -d --remove-orphans

echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
wait_for_postgres 60

sync_postgres_password
clear_migration_dirty_flag_if_needed
verify_host_db_connection || exit 1

# shellcheck source=dev-env.sh
source "$SCRIPT_DIR/dev-env.sh"
export_local_dev_env
APP_PORT="${APP_PORT:-8080}"

ensure_app_port_free "$APP_PORT"

echo -e "${GREEN}🚀 Starting backend and frontend...${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:${APP_PORT}"
echo -e "${BLUE}Database:${NC}  127.0.0.1:${DB_PUBLISH_PORT} (${DB_NAME} / ${DB_USER})"
echo -e "${BLUE}MinIO:${NC}      http://localhost:9001"
echo -e "${YELLOW}Press Ctrl+C to stop apps (infra keeps running; use make down to stop Docker).${NC}"
echo ""

if command -v air >/dev/null 2>&1; then
	( air 2>&1 | sed -u 's/^/[backend] /' ) &
else
	echo -e "${YELLOW}ℹ️  air not installed — using go run (no hot reload).${NC}"
	( go run ./cmd/app/main.go 2>&1 | sed -u 's/^/[backend] /' ) &
fi
BACKEND_PID=$!

echo -e "${YELLOW}⏳ Waiting for backend health...${NC}"
health_deadline=$((SECONDS + 90))
until curl -sf "http://127.0.0.1:${APP_PORT}/healthz" >/dev/null 2>&1; do
	if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
		echo -e "${RED}❌ Backend exited during startup.${NC}"
		exit 1
	fi
	if (( SECONDS > health_deadline )); then
		echo -e "${RED}❌ Backend did not become healthy on :${APP_PORT} within 90s.${NC}"
		exit 1
	fi
	sleep 1
done
echo -e "${GREEN}✅ Backend is up (/healthz).${NC}"

user_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM users;" 2>/dev/null | tr -d '[:space:]')
if [[ "${user_count:-0}" == "0" ]]; then
	echo -e "${YELLOW}📦 Database empty — running seeder...${NC}"
	( cd "$REPO_ROOT" && go run ./cmd/seeder/main.go ) 2>&1 | sed -u 's/^/[seed] /' || {
		echo -e "${RED}❌ Seeder failed. Try: make seed${NC}"
	}
fi

( cd web && exec pnpm dev 2>&1 | sed -u 's/^/[frontend] /' ) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || wait || true