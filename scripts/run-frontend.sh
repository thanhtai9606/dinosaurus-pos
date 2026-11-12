#!/usr/bin/env bash
# Vite dev server on :5173 (proxies /api → localhost:8080).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
	echo -e "\033[0;31m❌ pnpm not found. Run: make deps\033[0m"
	exit 1
fi

if [[ ! -d "$REPO_ROOT/web/node_modules" ]]; then
	echo -e "\033[0;33m📦 Installing web dependencies...\033[0m"
	(cd "$REPO_ROOT/web" && pnpm install)
fi

cd "$REPO_ROOT/web"
echo -e "\033[0;34mFrontend:\033[0m http://localhost:5173  (API proxy → http://localhost:8080/api/v1)"
exec pnpm dev
