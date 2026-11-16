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

run_migrate "$@"