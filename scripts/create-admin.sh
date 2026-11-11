#!/usr/bin/env bash
# Create an admin user interactively.

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

CONTAINER="$(require_postgres)"

echo -e "${BLUE}POS Kasir — Create Admin User${NC}"
echo "================================"
echo ""

read -r -p "Username: " USERNAME
while [[ -z "$USERNAME" ]]; do
	echo -e "${RED}Username cannot be empty.${NC}"
	read -r -p "Username: " USERNAME
done

read -r -p "Email: " EMAIL
while [[ -z "$EMAIL" ]]; do
	echo -e "${RED}Email cannot be empty.${NC}"
	read -r -p "Email: " EMAIL
done

echo -n "Password: "
read -rs PASSWORD
echo ""
while [[ -z "$PASSWORD" ]]; do
	echo -e "${RED}Password cannot be empty.${NC}"
	echo -n "Password: "
	read -rs PASSWORD
	echo ""
done

echo -n "Confirm password: "
read -rs CONFIRM_PASSWORD
echo ""
while [[ "$PASSWORD" != "$CONFIRM_PASSWORD" ]]; do
	echo -e "${RED}Passwords do not match.${NC}"
	echo -n "Password: "
	read -rs PASSWORD
	echo ""
	echo -n "Confirm password: "
	read -rs CONFIRM_PASSWORD
	echo ""
done

USER_EXISTS=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
	"SELECT EXISTS(SELECT 1 FROM users WHERE username = '$USERNAME' OR email = '$EMAIL');")

if [[ "$USER_EXISTS" == "t" ]]; then
	echo -e "${RED}❌ User with that username or email already exists.${NC}"
	exit 1
fi

PASSWORD_HASH=$(cd "$REPO_ROOT" && go run ./scripts/hashpw/main.go "$PASSWORD")
ESCAPED_HASH=${PASSWORD_HASH//\'/\'\'}

docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO users (username, email, password_hash, role, is_active)
VALUES ('$USERNAME', '$EMAIL', '$ESCAPED_HASH', 'admin', true);
"

echo -e "${GREEN}✅ Admin user created.${NC}"
