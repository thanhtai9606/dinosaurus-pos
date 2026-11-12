#!/usr/bin/env bash
# Shared environment for local Go + Vite dev (Docker infra only: Postgres, Redis, MinIO).

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PUBLISH_PORT="${DB_PUBLISH_PORT:-5433}"
APP_PORT="${APP_PORT:-8080}"

if [[ -f "$REPO_ROOT/.env" ]]; then
	set -a
	# shellcheck disable=SC1091
	source "$REPO_ROOT/.env"
	set +a
fi

ensure_app_port_free() {
	local port="${1:-${APP_PORT:-8080}}"
	if ! command -v lsof >/dev/null 2>&1; then
		return 0
	fi
	if ! lsof -i :"$port" -t >/dev/null 2>&1; then
		return 0
	fi
	echo -e "\033[0;33m⚠️  Port ${port} is in use (another backend or make dev still running?):\033[0m"
	lsof -i :"$port" 2>/dev/null | head -8 || true
	echo -e "\033[0;33m   Stopping process(es) on :${port}...\033[0m"
	lsof -i :"$port" -t 2>/dev/null | xargs -r kill -TERM 2>/dev/null || true
	sleep 1
	if lsof -i :"$port" -t >/dev/null 2>&1; then
		echo -e "\033[0;31m❌ Port ${port} still in use.\033[0m"
		echo -e "   Run: \033[1mmake dev-stop\033[0m  or  \033[1mkill \$(lsof -t -i :${port})\033[0m"
		exit 1
	fi
	echo -e "\033[0;32m✅ Port ${port} is free.\033[0m"
}

export_local_dev_env() {
	export APP_ENV=development
	export APP_PORT="${APP_PORT:-8080}"
	export DB_HOST=localhost
	export DB_PORT="${DB_PUBLISH_PORT}"
	export REDIS_HOST=localhost
	export WEB_FRONTEND_CROSS_ORIGIN=false
	export CORS_ALLOW_ORIGINS=
	export R2_ENDPOINT="${R2_ENDPOINT:-http://localhost:9000}"
	export R2_USE_SSL=false
	export R2_ACCESS_KEY="${R2_ACCESS_KEY:-minioadmin}"
	export R2_SECRET_KEY="${R2_SECRET_KEY:-minioadmin}"
	export R2_ACCOUNT_ID="${R2_ACCOUNT_ID:-local}"
	export R2_PUBLIC_DOMAIN="${R2_PUBLIC_DOMAIN:-http://localhost:9000}"
}

require_local_infra() {
	# shellcheck source=common.sh
	source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
	local _name
	_name="$(require_postgres)"
	if ! docker ps --format '{{.Names}}' | grep -qx 'pos-redis'; then
		echo -e "${YELLOW:-}⚠️  Redis container not running — start with: make up${NC:-}"
	fi
	echo "$_name"
}
