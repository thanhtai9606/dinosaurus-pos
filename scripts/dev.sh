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
DB_PUBLISH_PORT="${DB_PUBLISH_PORT:-5433}"

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
deadline=$((SECONDS + 60))
until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
	if (( SECONDS > deadline )); then
		echo -e "${RED}❌ Postgres not ready after 60s. Check: docker compose -f $COMPOSE_INFRA logs postgres${NC}"
		exit 1
	fi
	sleep 1
done

db_password="${DB_PASSWORD:-pos_password}"
esc_pass="${db_password//\'/\'\'}"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c \
	"ALTER USER \"${DB_USER}\" WITH PASSWORD '${esc_pass}';" >/dev/null

dirty=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
	"SELECT COALESCE(bool_or(dirty), false) FROM schema_migrations;" 2>/dev/null || echo "f")
if [[ "$dirty" == "t" || "$dirty" == "true" ]]; then
	echo -e "${YELLOW}⚠️  Migration dirty flag — clearing (run make db-reset if schema is broken).${NC}"
	docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
		"UPDATE schema_migrations SET dirty = false WHERE dirty = true;"
fi

if ! docker run --rm --network host -e PGPASSWORD="$db_password" postgres:15-alpine \
	psql -h 127.0.0.1 -p "$DB_PUBLISH_PORT" -U "$DB_USER" -d "$DB_NAME" -c 'SELECT 1' >/dev/null 2>&1; then
	echo -e "${RED}❌ Cannot connect to Postgres on 127.0.0.1:${DB_PUBLISH_PORT}.${NC}"
	echo -e "${YELLOW}   Set DB_PASSWORD in .env to match Docker (default: pos_password).${NC}"
	echo -e "${YELLOW}   If port 5432 on the host is another Postgres, use DB_PUBLISH_PORT=5433 and recreate: docker compose -f $COMPOSE_INFRA up -d --force-recreate postgres${NC}"
	exit 1
fi

export APP_ENV=development
export DB_HOST=localhost
export DB_PORT="$DB_PUBLISH_PORT"
export REDIS_HOST=localhost
export WEB_FRONTEND_CROSS_ORIGIN=false
export CORS_ALLOW_ORIGINS=
export R2_ENDPOINT="${R2_ENDPOINT:-http://localhost:9000}"
export R2_USE_SSL=false
export R2_ACCESS_KEY="${R2_ACCESS_KEY:-minioadmin}"
export R2_SECRET_KEY="${R2_SECRET_KEY:-minioadmin}"
export R2_ACCOUNT_ID="${R2_ACCOUNT_ID:-local}"
export R2_PUBLIC_DOMAIN="${R2_PUBLIC_DOMAIN:-http://localhost:9000}"

APP_PORT="${APP_PORT:-8080}"

if lsof -i :"$APP_PORT" -t >/dev/null 2>&1; then
	echo -e "${YELLOW}⚠️  Port ${APP_PORT} in use — attempting to free it for backend...${NC}"
	lsof -i :"$APP_PORT" -t | xargs -r kill -TERM 2>/dev/null || true
	sleep 1
fi

echo -e "${GREEN}🚀 Starting backend and frontend...${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:${APP_PORT}"
echo -e "${BLUE}Database:${NC}  127.0.0.1:${DB_PUBLISH_PORT} (user ${DB_USER})"
echo -e "${BLUE}MinIO:${NC}      http://localhost:9001"
echo -e "${YELLOW}Press Ctrl+C to stop apps (infra keeps running; use make down to stop Docker).${NC}"
echo ""

if command -v air >/dev/null 2>&1; then
	( air 2>&1 | sed -u 's/^/[backend] /' ) &
else
	echo -e "${YELLOW}ℹ️  air not installed — using go run (no hot reload). Install: go install github.com/air-verse/air@latest${NC}"
	( go run ./cmd/app/main.go 2>&1 | sed -u 's/^/[backend] /' ) &
fi
BACKEND_PID=$!

echo -e "${YELLOW}⏳ Waiting for backend health...${NC}"
health_deadline=$((SECONDS + 90))
until curl -sf "http://127.0.0.1:${APP_PORT}/healthz" >/dev/null 2>&1; do
	if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
		echo -e "${RED}❌ Backend exited during startup. Read [backend] logs above (DB password, migrations, port).${NC}"
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
	echo -e "${YELLOW}📦 Database empty — running seeder (first run may take ~30s)...${NC}"
	( cd "$REPO_ROOT" && go run ./cmd/seeder/main.go ) 2>&1 | sed -u 's/^/[seed] /' || {
		echo -e "${RED}❌ Seeder failed. Try: DB_HOST=localhost DB_PORT=${DB_PUBLISH_PORT} make seed${NC}"
	}
fi

( cd web && exec pnpm dev 2>&1 | sed -u 's/^/[frontend] /' ) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || wait || true
