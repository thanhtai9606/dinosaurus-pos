#!/usr/bin/env bash
# Apply sqlc migrations to shared DB and every TENANT_DSN_* env var (dedicated tenant DBs).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

cd "$REPO_ROOT"

echo "Migrating shared database..."
make migrate-up

echo "Scanning dedicated tenant DSNs (TENANT_DSN_*)..."
shopt -s nullglob
for var in $(compgen -v | grep '^TENANT_DSN_'); do
  dsn="${!var}"
  if [[ -z "$dsn" ]]; then
    continue
  fi
  echo "Migrating $var ..."
  if command -v migrate >/dev/null 2>&1; then
    migrate -path ./sqlc/migrations -database "$dsn" up
  else
    docker run --rm -v "$REPO_ROOT/sqlc/migrations:/migrations" migrate/migrate:v4.18.2 \
      -path=/migrations -database "$dsn" up
  fi
done

echo "Done."
