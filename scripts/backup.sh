#!/usr/bin/env bash
# PostgreSQL backup for POS Kasir.

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
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pos_kasir_backup_${TIMESTAMP}"
DB_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_database.sql"

echo -e "${GREEN}💾 Creating database backup...${NC}"

docker exec "$CONTAINER" pg_dump \
	-U "$DB_USER" \
	-d "$DB_NAME" \
	--clean \
	--if-exists \
	--no-owner \
	--format=plain >"$DB_BACKUP_FILE"

DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
MANIFEST_FILE="${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt"

cat >"$MANIFEST_FILE" <<EOF
POS Kasir backup
Created: $(date)
Database: ${DB_NAME}
User: ${DB_USER}
File: $(basename "$DB_BACKUP_FILE")
Size: ${DB_SIZE}
Restore: make restore
EOF

BUNDLE_FILE="${BACKUP_DIR}/${BACKUP_NAME}_complete.tar.gz"
tar -czf "$BUNDLE_FILE" -C "$BACKUP_DIR" \
	"$(basename "$DB_BACKUP_FILE")" \
	"$(basename "$MANIFEST_FILE")"

BUNDLE_SIZE=$(du -h "$BUNDLE_FILE" | cut -f1)

echo -e "${GREEN}✅ Database: $DB_BACKUP_FILE ($DB_SIZE)${NC}"
echo -e "${GREEN}✅ Bundle: $BUNDLE_FILE ($BUNDLE_SIZE)${NC}"
echo -e "${BLUE}Restore with: make restore${NC}"
