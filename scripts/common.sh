#!/usr/bin/env bash
# Shared helpers for Dinosaurus POS (dev infra, DB, migrations).

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/sqlc/migrations"
MIGRATE_IMAGE="${MIGRATE_DOCKER_IMAGE:-migrate/migrate:v4.18.2}"
BACKUP_FILE_PREFIX="${BACKUP_FILE_PREFIX:-dinosaur_pos_backup}"

if [[ -f "$REPO_ROOT/.env" ]]; then
	set -a
	# shellcheck disable=SC1091
	source "$REPO_ROOT/.env"
	set +a
fi

DB_USER="${DB_USER:-dinosaur}"
DB_PASSWORD="${DB_PASSWORD:-dinosaur_dev}"
DB_NAME="${DB_NAME:-dinosaur_pos}"
DB_PUBLISH_PORT="${DB_PUBLISH_PORT:-5433}"
DB_SSLMODE="${DB_SSLMODE:-disable}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-dinosaur-postgres}"
REDIS_CONTAINER="${REDIS_CONTAINER:-dinosaur-redis}"

postgres_container() {
	if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
		echo "$CONTAINER_NAME"
		return 0
	fi
	echo ""
	return 1
}

require_postgres() {
	local name
	name="$(postgres_container)" || true
	if [[ -z "$name" ]]; then
		echo -e "${RED:-}❌ Database container is not running (${CONTAINER_NAME}).${NC:-}" >&2
		echo -e "${YELLOW:-}Run: make up${NC:-}" >&2
		exit 1
	fi
	echo "$name"
}

migrate_database_url() {
	if [[ -n "${MIGRATE_DATABASE_URL:-}" ]]; then
		printf '%s' "$MIGRATE_DATABASE_URL"
		return 0
	fi
	printf 'postgres://%s:%s@127.0.0.1:%s/%s?sslmode=%s' \
		"$DB_USER" "$DB_PASSWORD" "$DB_PUBLISH_PORT" "$DB_NAME" "$DB_SSLMODE"
}

run_migrate() {
	if [[ $# -lt 1 ]]; then
		echo "Usage: run_migrate <up|down|...>   (from common.sh or run-migrate.sh)" >&2
		exit 1
	fi

	local db_url
	db_url="$(migrate_database_url)"

	if command -v migrate >/dev/null 2>&1; then
		migrate -path "$MIGRATIONS_DIR" -database "$db_url" "$@"
		return $?
	fi

	if ! command -v docker >/dev/null 2>&1; then
		echo "❌ Install migrate CLI or Docker." >&2
		echo "   go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest" >&2
		exit 127
	fi

	require_postgres >/dev/null
	echo "ℹ️  'migrate' not in PATH — using Docker image ${MIGRATE_IMAGE}"
	docker run --rm \
		-v "${MIGRATIONS_DIR}:/migrations" \
		--network host \
		"$MIGRATE_IMAGE" \
		-path=/migrations \
		-database "$db_url" \
		"$@"
}

wait_for_postgres() {
	local timeout="${1:-60}"
	local deadline=$((SECONDS + timeout))
	until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
		if (( SECONDS > deadline )); then
			echo -e "${RED:-}❌ Postgres not ready after ${timeout}s (${CONTAINER_NAME}).${NC:-}" >&2
			exit 1
		fi
		sleep 1
	done
}

sync_postgres_password() {
	local esc_pass="${DB_PASSWORD//\'/\'\'}"
	docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c \
		"ALTER USER \"${DB_USER}\" WITH PASSWORD '${esc_pass}';" >/dev/null
}

clear_migration_dirty_flag_if_needed() {
	local dirty
	dirty=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
		"SELECT COALESCE(bool_or(dirty), false) FROM schema_migrations;" 2>/dev/null || echo "f")
	if [[ "$dirty" == "t" || "$dirty" == "true" ]]; then
		echo -e "${YELLOW:-}⚠️  Migration dirty flag — clearing (run make db-reset if schema is broken).${NC:-}"
		docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
			"UPDATE schema_migrations SET dirty = false WHERE dirty = true;"
	fi
}

verify_host_db_connection() {
	if docker run --rm --network host -e PGPASSWORD="$DB_PASSWORD" postgres:15-alpine \
		psql -h 127.0.0.1 -p "$DB_PUBLISH_PORT" -U "$DB_USER" -d "$DB_NAME" -c 'SELECT 1' >/dev/null 2>&1; then
		return 0
	fi
	echo -e "${RED:-}❌ Cannot connect to Postgres on 127.0.0.1:${DB_PUBLISH_PORT}.${NC:-}" >&2
	echo -e "${YELLOW:-}   Match DB_PASSWORD in .env with Docker (default: dinosaur_dev).${NC:-}" >&2
	echo -e "${YELLOW:-}   Recreate: docker compose -f docker-compose.infra.yml up -d --force-recreate postgres${NC:-}" >&2
	return 1
}