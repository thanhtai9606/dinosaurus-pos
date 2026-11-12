#!/usr/bin/env bash
# One-time / fresh machine: infra + migrations + seed hint (no production app image).

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f .env ]]; then
	cp .env.example .env
	echo -e "${YELLOW}📝 Created .env — set JWT_SECRET (openssl rand -hex 32) if login fails.${NC}"
fi

make up
make migrate-up

# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
export DB_PUBLISH_PORT="${DB_PUBLISH_PORT:-5433}"

user_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM users;" 2>/dev/null | tr -d '[:space:]' || echo "0")
if [[ "${user_count:-0}" == "0" ]]; then
	echo -e "${YELLOW}📦 Empty DB — running seeder...${NC}"
	make seed
	make create-demo-users || true
else
	echo -e "${GREEN}✅ Database already has users.${NC}"
fi

echo ""
echo -e "${GREEN}✅ Local dev ready (Postgres :${DB_PUBLISH_PORT}, Redis, MinIO).${NC}"
echo -e "${BLUE}Next:${NC}"
echo -e "  make dev-apps     # backend + frontend (recommended daily)"
echo -e "  make dev-backend  # API only (terminal 1)"
echo -e "  make dev-frontend # Vite only (terminal 2)"
echo -e "  make dev          # infra + apps + auto-seed on first run"
