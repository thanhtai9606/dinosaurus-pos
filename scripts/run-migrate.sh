#!/usr/bin/env bash
# Run golang-migrate (local binary or Docker fallback via common.sh).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <migrate-args...>   e.g. up | down 1 | version"
	exit 1
fi

if [[ "$1" == "up" || "$1" == "down" || "$1" == "force" ]]; then
	require_postgres >/dev/null
	if ! verify_host_db_connection; then
		echo "" >&2
		echo "💡 Volume Postgres có thể được tạo với user/password cũ (khác DB_USER trong .env)." >&2
		echo "   Dev sạch: docker compose -f docker-compose.infra.yml down" >&2
		echo "            docker volume rm dinosaur-pos_postgres_data" >&2
		echo "            make up && make migrate-up && make seed" >&2
		echo "   (Xóa volume = mất dữ liệu local.)" >&2
		exit 1
	fi
fi

run_migrate "$@"