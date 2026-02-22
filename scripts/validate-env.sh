#!/bin/bash

# Validate .env configuration
# Checks for spaces in password values which cause parsing errors
# in docker-compose variable substitution and bash scripts (db-dump.sh, db-restore.sh)

set -e

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

echo "Validating .env configuration..."

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: .env file not found!${RESET}"
    echo ""
    echo "Expected location: $ENV_FILE"
    echo ""
    echo "If you just cloned the repository:"
    echo "  1. Obtain .env.key from the project maintainer"
    echo "  2. Place it in the project root"
    echo "  3. Run: bash scripts/decrypt-env.sh"
    echo "  4. Re-run make init"
    echo ""
    exit 1
fi

# Check for password variables with spaces in unquoted values
# Matches lines like: DB_PASSWORD=has spaces here
# Does NOT match: DB_PASSWORD="has spaces here" or DB_PASSWORD='has spaces here'
# Does NOT match: commented lines starting with #
INVALID_PASSWORDS=$(grep -nE "^[^#]*PASSWORD=[^\"'][^ ]* " "$ENV_FILE" 2>/dev/null || true)

if [ -n "$INVALID_PASSWORDS" ]; then
    echo -e "${RED}ERROR: Invalid .env configuration detected!${RESET}"
    echo ""
    echo "The following password variables contain spaces in unquoted values:"
    echo ""
    echo "$INVALID_PASSWORDS" | while IFS= read -r line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        CONTENT=$(echo "$line" | cut -d: -f2-)
        echo "  Line $LINE_NUM: $CONTENT"
    done
    echo ""
    echo -e "${YELLOW}Why this matters:${RESET}"
    echo "  Spaces in unquoted password values cause parsing errors in:"
    echo "  - Docker Compose variable substitution"
    echo "  - Bash scripts (db-dump.sh, db-restore.sh)"
    echo ""
    echo -e "${YELLOW}To fix:${RESET}"
    echo "  Remove spaces from password values (recommended)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${RESET} .env validation passed"
exit 0
