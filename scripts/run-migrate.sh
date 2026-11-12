#!/usr/bin/env bash
# Run golang-migrate using local `migrate` binary, or Docker if not installed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/sqlc/migrations"
MIGRATE_IMAGE="${MIGRATE_DOCKER_IMAGE:-migrate/migrate:v4.18.2}"

# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

DB_PUBLISH_PORT="${DB_PUBLISH_PORT:-5433}"
DB_SSLMODE="${DB_SSLMODE:-disable}"

# Host-side make migrate-* always targets Docker-published Postgres (not DB_HOST=postgres in .env).
if [[ -n "${MIGRATE_DATABASE_URL:-}" ]]; then
	DATABASE_URL="$MIGRATE_DATABASE_URL"
else
	DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PUBLISH_PORT}/${DB_NAME}?sslmode=${DB_SSLMODE}"
fi

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <migrate-args...>   e.g. up | down 1 | version"
	exit 1
fi

run_local() {
	exec migrate -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" "$@"
}

run_docker() {
	if ! command -v docker >/dev/null 2>&1; then
		echo "❌ Neither 'migrate' CLI nor Docker available."
		echo "   Install: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"
		exit 127
	fi
	if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
		echo "❌ Postgres container (${CONTAINER_NAME}) is not running. Run: make up"
		exit 1
	fi
	exec docker run --rm \
		-v "${MIGRATIONS_DIR}:/migrations" \
		--network host \
		"$MIGRATE_IMAGE" \
		-path=/migrations \
		-database "$DATABASE_URL" \
		"$@"
}

if command -v migrate >/dev/null 2>&1; then
	run_local "$@"
fi

echo "ℹ️  'migrate' not in PATH — using Docker image ${MIGRATE_IMAGE}"
run_docker "$@"
