#!/usr/bin/env bash
# Roll back all migrations, re-apply schema, and run seeder.

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

require_postgres >/dev/null

echo -e "${YELLOW}This will drop all migrated schema and re-seed sample data.${NC}"
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
	echo -e "${BLUE}Cancelled.${NC}"
	exit 0
fi

cd "$REPO_ROOT"
make migrate-down-all
make migrate-up
make seed

echo -e "${GREEN}✅ Database reset complete.${NC}"
