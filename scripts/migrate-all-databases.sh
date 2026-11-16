#!/usr/bin/env bash
# Apply sqlc migrations to shared DB and every TENANT_DSN_* env var.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

cd "$REPO_ROOT"

echo "Migrating shared database (${DB_NAME})..."
run_migrate up

echo "Scanning dedicated tenant DSNs (TENANT_DSN_*)..."
for var in $(compgen -v | grep '^TENANT_DSN_'); do
	dsn="${!var}"
	if [[ -z "$dsn" ]]; then
		continue
	fi
	echo "Migrating ${var} ..."
	MIGRATE_DATABASE_URL="$dsn" run_migrate up
done

echo "Done."