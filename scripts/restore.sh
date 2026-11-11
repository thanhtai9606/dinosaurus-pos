#!/usr/bin/env bash
# Restore PostgreSQL from backups/.

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
BACKUP_DIR="$REPO_ROOT/backups"

if [[ ! -d "$BACKUP_DIR" ]]; then
	echo -e "${RED}❌ No backups/ directory. Run 'make backup' first.${NC}"
	exit 1
fi

echo -e "${BLUE}📥 Available backups${NC}"
echo ""

BACKUP_FILES=()
INDEX=1

for file in "$BACKUP_DIR"/pos_kasir_backup_*_database.sql; do
	[[ -f "$file" ]] || continue
	SIZE=$(du -h "$file" | cut -f1)
	echo "$INDEX) $(basename "$file") ($SIZE)"
	BACKUP_FILES+=("$file")
	((INDEX++)) || true
done

if [[ ${#BACKUP_FILES[@]} -eq 0 ]]; then
	echo -e "${RED}❌ No SQL backups found.${NC}"
	exit 1
fi

echo ""
read -r -p "Select backup number: " SELECTION
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [[ "$SELECTION" -lt 1 ]] || [[ "$SELECTION" -gt ${#BACKUP_FILES[@]} ]]; then
	echo -e "${RED}❌ Invalid selection.${NC}"
	exit 1
fi

SELECTED="${BACKUP_FILES[$((SELECTION - 1))]}"

echo -e "${RED}⚠️  This replaces all data in ${DB_NAME}.${NC}"
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
	echo -e "${BLUE}Cancelled.${NC}"
	exit 0
fi

echo -e "${YELLOW}📥 Restoring $(basename "$SELECTED")...${NC}"
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <"$SELECTED"

echo -e "${GREEN}✅ Restore completed.${NC}"
