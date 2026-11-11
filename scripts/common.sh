#!/usr/bin/env bash
# Shared helpers for POS Kasir maintenance scripts.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$REPO_ROOT/.env" ]]; then
	set -a
	# shellcheck disable=SC1091
	source "$REPO_ROOT/.env"
	set +a
fi

DB_USER="${DB_USER:-pos_user}"
DB_NAME="${DB_NAME:-pos_kasir}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-pos-postgres}"

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
		echo -e "${RED:-}❌ Database container is not running (${CONTAINER_NAME}).${NC:-}"
		echo -e "${YELLOW:-}Please run 'make up' or 'make dev-infra' first.${NC:-}"
		exit 1
	fi
	echo "$name"
}
