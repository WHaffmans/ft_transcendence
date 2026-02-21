#!/bin/bash
# ============================================================================
# Database Restore Script
# Restores the MariaDB database from dumps/latest.sql
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMP_FILE="$PROJECT_ROOT/dumps/latest.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    printf "${RED}✗${RESET} Dump file not found: dumps/latest.sql\n"
    printf "${YELLOW}→${RESET} Create a dump first with: ${BOLD}make db-dump${RESET}\n"
    exit 1
fi

# Check if mariadb container is running
if ! docker compose -f "$PROJECT_ROOT/docker-compose.yaml" ps mariadb | grep -q "Up\|running"; then
    printf "${RED}✗${RESET} MariaDB container is not running\n"
    printf "${YELLOW}→${RESET} Start services first with: ${BOLD}make up${RESET}\n"
    exit 1
fi

# Get dump file size
DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)

# Safety confirmation
printf "${YELLOW}⚠${RESET}  This will ${BOLD}replace${RESET} the current database with data from dumps/latest.sql (${DUMP_SIZE})\n"
read -p "Are you sure? (y/N): " confirm
if [ "$confirm" != "y" ]; then
    printf "${BLUE}→${RESET} Restore cancelled\n"
    exit 0
fi

# Perform the restore
printf "${BLUE}→${RESET} Restoring database from dump...\n"

if docker compose -f "$PROJECT_ROOT/docker-compose.yaml" exec -T mariadb mysql \
    -u"${DB_USERNAME}" \
    -p"${DB_PASSWORD}" \
    "${DB_DATABASE}" \
    < "$DUMP_FILE" 2>/dev/null; then
    
    printf "${GREEN}✓${RESET} Database restored successfully from dumps/latest.sql\n"
    exit 0
else
    printf "${RED}✗${RESET} Failed to restore database\n"
    exit 1
fi
