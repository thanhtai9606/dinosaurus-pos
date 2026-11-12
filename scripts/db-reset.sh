#!/usr/bin/env bash
# Drop public schema, apply single baseline migration, and run seeder.

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

echo -e "${YELLOW}This will DROP the public schema, re-apply baseline migration, and re-seed.${NC}"
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
	echo -e "${BLUE}Cancelled.${NC}"
	exit 0
fi

CONTAINER="$(require_postgres)"

docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<-SQL
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO "$DB_USER";
GRANT ALL ON SCHEMA public TO public;
SQL

cd "$REPO_ROOT"
make migrate-up
make seed

echo -e "${GREEN}✅ Database reset complete.${NC}"
