#!/usr/bin/env bash
# Create a dedicated Postgres database, migrate schema, register tenant on control plane (shared DB).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

usage() {
  echo "Usage: $0 --code CODE --name NAME --dbname DBNAME --env-key TENANT_DSN_KEY"
  echo "Example: $0 --code acme --name 'ACME Corp' --dbname pos_tenant_acme --env-key TENANT_DSN_ACME"
  exit 1
}

CODE=""
NAME=""
DBNAME=""
ENV_KEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --code) CODE="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --dbname) DBNAME="$2"; shift 2 ;;
    --env-key) ENV_KEY="$2"; shift 2 ;;
    *) usage ;;
  esac
done

[[ -n "$CODE" && -n "$NAME" && -n "$DBNAME" && -n "$ENV_KEY" ]] || usage

CONTAINER="$(require_postgres)"
CODE_LOWER=$(echo "$CODE" | tr '[:upper:]' '[:lower:]')

echo "Creating database $DBNAME ..."
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT 1 FROM pg_database WHERE datname = '$DBNAME'" | grep -q 1 \
  || docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE \"$DBNAME\" OWNER \"$DB_USER\";"

DSN="postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PUBLISH_PORT:-5433}/${DBNAME}?sslmode=disable"
echo ""
echo "Add to .env:"
echo "${ENV_KEY}=${DSN}"
echo ""

cd "$REPO_ROOT"
if command -v migrate >/dev/null 2>&1; then
  migrate -path ./sqlc/migrations -database "$DSN" up
else
  docker run --rm -v "$REPO_ROOT/sqlc/migrations:/migrations" migrate/migrate:v4.18.2 \
    -path=/migrations -database "$DSN" up
fi

TENANT_ID=$(uuidgen 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4())')

docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO tenants (id, code, name, is_active, data_plane, database_dsn_key)
VALUES ('$TENANT_ID', '$CODE_LOWER', '$NAME', true, 'dedicated', '$ENV_KEY')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  data_plane = 'dedicated',
  database_dsn_key = EXCLUDED.database_dsn_key;
SQL

echo "Tenant registered: code=$CODE_LOWER id=$TENANT_ID"
echo "Restart API after updating .env with $ENV_KEY"
