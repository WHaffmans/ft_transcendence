#!/bin/bash
# ============================================================================
# Database Restore Script
# Restores the MariaDB database from dumps/latest.sql
# Also restores avatar files from dumps/avatars.tar.gz
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMP_FILE="$PROJECT_ROOT/dumps/latest.sql"
AVATAR_DUMP="$PROJECT_ROOT/dumps/avatars.tar.gz"
AUTO_MODE=false

# Check for --auto flag
if [ "$1" = "--auto" ]; then
    AUTO_MODE=true
fi

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

# Read mode from .mode file
MODE=$(cat "$PROJECT_ROOT/.mode" 2>/dev/null || echo "dev")

# Determine which compose file to use
if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yaml"
else
    COMPOSE_FILE="docker-compose.yaml"
fi

# Check if mariadb container is running
if ! docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps mariadb | grep -q "Up\|running"; then
    printf "${RED}✗${RESET} MariaDB container is not running\n"
    printf "${YELLOW}→${RESET} Start services first with: ${BOLD}make up${RESET}\n"
    exit 1
fi

# In auto mode, check if database already has data
if [ "$AUTO_MODE" = true ]; then
    # Check if key tables (users, games, user_game) have any data
    # These tables will be empty after migrations but populated after seeding or production use
    DATA_CHECK=$(docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T mariadb mysql \
        -u"${DB_USERNAME}" \
        -p"${DB_PASSWORD}" \
        -N -B \
        -e "SELECT (
            (SELECT COUNT(*) FROM ${DB_DATABASE}.users) + 
            (SELECT COUNT(*) FROM ${DB_DATABASE}.games) + 
            (SELECT COUNT(*) FROM ${DB_DATABASE}.user_game)
        ) AS total_rows;" \
        2>/dev/null || echo "0")
    
    if [ "$DATA_CHECK" -gt 0 ]; then
        printf "${BLUE}→${RESET} Database already contains data (${DATA_CHECK} rows in users/games/user_game), skipping restore\n"
        exit 0
    fi
fi

# Get dump file size
DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)

# Safety confirmation (skip in auto mode)
if [ "$AUTO_MODE" = false ]; then
    printf "${YELLOW}⚠${RESET}  This will ${BOLD}replace${RESET} the current database with data from dumps/latest.sql (${DUMP_SIZE})\n"
    read -p "Are you sure? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        printf "${BLUE}→${RESET} Restore cancelled\n"
        exit 0
    fi
fi

# Perform the restore
printf "${BLUE}→${RESET} Restoring database from dump...\n"

if docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T mariadb mysql \
    -u"${DB_USERNAME}" \
    -p"${DB_PASSWORD}" \
    "${DB_DATABASE}" \
    < "$DUMP_FILE" 2>/dev/null; then
    
    printf "${GREEN}✓${RESET} Database restored successfully from dumps/latest.sql\n"
else
    printf "${RED}✗${RESET} Failed to restore database\n"
    exit 1
fi

# Check if backend-service container is running (for avatar restore)
if ! docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps backend-service | grep -q "Up\|running"; then
    printf "${YELLOW}⚠${RESET}  Backend service is not running. Skipping avatar restore.\n"
    exit 0
fi

# Restore avatar files if backup exists
if [ -f "$AVATAR_DUMP" ]; then
    printf "${BLUE}→${RESET} Restoring avatar files...\n"
    
    # Ensure the avatars directory exists in the container
    if ! docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service mkdir -p /var/www/html/storage/app/public/avatars 2>/dev/null; then
        printf "${RED}✗${RESET} Failed to create avatars directory in backend-service container\n"
        exit 1
    fi
    
    # Extract the tar archive into the container
    if cat "$AVATAR_DUMP" | docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service tar -xzf - -C /var/www/html/storage/app/public 2>/dev/null; then
        # Fix permissions
        docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service chown -R www-data:www-data /var/www/html/storage/app/public/avatars 2>/dev/null
        docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service chmod -R 755 /var/www/html/storage/app/public/avatars 2>/dev/null
        
        AVATAR_SIZE=$(du -h "$AVATAR_DUMP" | cut -f1)
        printf "${GREEN}✓${RESET} Avatar files restored from dumps/avatars.tar.gz (${AVATAR_SIZE})\n"
    else
        printf "${YELLOW}⚠${RESET}  Failed to restore avatars, but database restore succeeded\n"
    fi
else
    printf "${BLUE}→${RESET} No avatar backup found, skipping avatar restore\n"
fi

exit 0
