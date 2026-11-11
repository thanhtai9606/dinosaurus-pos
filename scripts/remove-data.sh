#!/usr/bin/env bash
# Truncate all application tables (keeps schema_migrations).

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

CONTAINER="$(require_postgres)"

echo -e "${RED}⚠️  This deletes all row data in ${DB_NAME} (schema is kept).${NC}"
read -r -p "Type DELETE ALL DATA to confirm: " CONFIRM
if [[ "$CONFIRM" != "DELETE ALL DATA" ]]; then
	echo -e "${BLUE}Cancelled. Data is safe.${NC}"
	exit 0
fi

docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> 'schema_migrations'
  LOOP
    EXECUTE format('TRUNCATE TABLE %I CASCADE', r.tablename);
  END LOOP;
END $$;
SQL

echo -e "${GREEN}✅ All application data removed.${NC}"
