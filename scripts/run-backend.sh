#!/usr/bin/env bash
# Local API on :8080 (requires: make up, .env with DB_PASSWORD matching Docker).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=dev-env.sh
source "$SCRIPT_DIR/dev-env.sh"
require_local_infra >/dev/null
export_local_dev_env
ensure_app_port_free "${APP_PORT}"

echo -e "\033[0;34mBackend:\033[0m http://localhost:${APP_PORT}  |  health: /healthz"
echo -e "\033[0;33mTip:\033[0m Frontend dev UI: make dev-frontend → http://localhost:5173"

if command -v air >/dev/null 2>&1; then
	exec air
fi

echo -e "\033[0;33mℹ️  air not installed — using go run. Install: go install github.com/air-verse/air@latest\033[0m"
exec go run ./cmd/app/main.go
