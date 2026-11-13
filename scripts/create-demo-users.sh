#!/usr/bin/env bash
# Seed default demo users (runs Go seeder).

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

CONTAINER="$(require_postgres)"

echo -e "${GREEN}👥 Seeding demo users and sample data...${NC}"
cd "$REPO_ROOT"
go run ./cmd/seeder/main.go

echo ""
echo -e "${BLUE}🎭 Demo accounts (password: 1q2w3E*):${NC}"
echo -e "${YELLOW}👑 Admin:${NC}    admin / admin@example.com"
echo -e "${YELLOW}🌐 Super:${NC}    superadmin / superadmin@example.com"
echo -e "${YELLOW}📊 Manager:${NC}  manager / manager@example.com"
echo -e "${YELLOW}💰 Cashier:${NC}  cashier / cashier@example.com"
echo ""
echo -e "${GREEN}✅ Seeder finished (postgres: ${CONTAINER}).${NC}"
