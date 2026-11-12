#!/usr/bin/env bash
# Run local backend + frontend only. Infra must already be up (make up).

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=dev-env.sh
source "$SCRIPT_DIR/dev-env.sh"

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
	echo -e "${RED}❌ pnpm not found. Run: make deps${NC}"
	exit 1
fi

if [[ ! -d web/node_modules ]]; then
	echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
	(cd web && pnpm install)
fi

require_local_infra >/dev/null

export_local_dev_env
APP_PORT="${APP_PORT:-8080}"

ensure_app_port_free "$APP_PORT"

echo -e "${GREEN}🚀 Local apps (no app Docker image)${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:${APP_PORT}"
echo -e "${YELLOW}Infra:${NC}    make up  |  stop apps: Ctrl+C  |  stop Docker: make down"
echo ""

if command -v air >/dev/null 2>&1; then
	( air 2>&1 | sed -u 's/^/[backend] /' ) &
else
	echo -e "${YELLOW}ℹ️  air not installed — go run (no hot reload)${NC}"
	( go run ./cmd/app/main.go 2>&1 | sed -u 's/^/[backend] /' ) &
fi
BACKEND_PID=$!

echo -e "${YELLOW}⏳ Waiting for backend /healthz...${NC}"
health_deadline=$((SECONDS + 90))
until curl -sf "http://127.0.0.1:${APP_PORT}/healthz" >/dev/null 2>&1; do
	if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
		echo -e "${RED}❌ Backend exited. Check DB_PASSWORD in .env matches Docker (pos_password).${NC}"
		exit 1
	fi
	if (( SECONDS > health_deadline )); then
		echo -e "${RED}❌ Backend not healthy within 90s.${NC}"
		exit 1
	fi
	sleep 1
done
echo -e "${GREEN}✅ Backend is up.${NC}"

( cd web && exec pnpm dev 2>&1 | sed -u 's/^/[frontend] /' ) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || wait || true
