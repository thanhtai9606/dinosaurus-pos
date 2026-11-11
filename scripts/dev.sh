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
docker compose -f "$COMPOSE_INFRA" up -d

echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
deadline=$((SECONDS + 60))
until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
	if (( SECONDS > deadline )); then
		echo -e "${RED}❌ Postgres not ready after 60s. Check: docker compose -f $COMPOSE_INFRA logs postgres${NC}"
		exit 1
	fi
	sleep 1
done

export APP_ENV=development
export DB_HOST=localhost
export REDIS_HOST=localhost
export CORS_ALLOW_ORIGINS=http://localhost:5173
export WEB_FRONTEND_CROSS_ORIGIN=true
export R2_PUBLIC_DOMAIN="${R2_PUBLIC_DOMAIN:-http://localhost:9000}"

echo -e "${GREEN}🚀 Starting backend and frontend...${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:${APP_PORT:-8080}"
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

( cd web && exec pnpm dev 2>&1 | sed -u 's/^/[frontend] /' ) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || wait || true
