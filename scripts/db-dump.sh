#!/bin/bash
# ============================================================================
# Database Dump Script
# Creates a dump of the MariaDB database to dumps/latest.sql
# Also backs up avatar files to dumps/avatars.tar.gz
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMP_FILE="$PROJECT_ROOT/dumps/latest.sql"
AVATAR_DUMP="$PROJECT_ROOT/dumps/avatars.tar.gz"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
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
    printf "${YELLOW}⚠${RESET}  MariaDB container is not running. Skipping dump.\n"
    exit 0
fi

# Create dumps directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/dumps"

# Perform the dump
printf "${BLUE}→${RESET} Creating database dump...\n"

if docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T mariadb mysqldump \
    -u"${DB_USERNAME}" \
    -p"${DB_PASSWORD}" \
    "${DB_DATABASE}" \
    --single-transaction \
    --routines \
    --triggers \
    > "$DUMP_FILE" 2>/dev/null; then
    
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    printf "${GREEN}✓${RESET} Database dump created: dumps/latest.sql (${DUMP_SIZE})\n"
else
    printf "${RED}✗${RESET} Failed to create database dump\n"
    exit 1
fi

# Check if backend-service container is running (for avatar backup)
if ! docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps backend-service | grep -q "Up\|running"; then
    printf "${YELLOW}⚠${RESET}  Backend service is not running. Skipping avatar backup.\n"
    exit 0
fi

# Backup avatar files
printf "${BLUE}→${RESET} Backing up avatar files...\n"

# Create a temporary directory in the container to store avatars
AVATAR_PATH="/var/www/html/storage/app/public/avatars"

# Check if avatars directory exists and has files
if docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service sh -c "[ -d \"$AVATAR_PATH\" ] && [ \$(ls -A \"$AVATAR_PATH\" 2>/dev/null | wc -l) -gt 0 ]" 2>/dev/null; then
    # Create tar archive of avatars from within the container and pipe it to host
    if docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service tar -czf - -C /var/www/html/storage/app/public avatars 2>/dev/null > "$AVATAR_DUMP"; then
        AVATAR_SIZE=$(du -h "$AVATAR_DUMP" | cut -f1)
        AVATAR_COUNT=$(docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T backend-service sh -c "ls -1 \"$AVATAR_PATH\" | wc -l" 2>/dev/null | tr -d '[:space:]')
        printf "${GREEN}✓${RESET} Avatar backup created: dumps/avatars.tar.gz (${AVATAR_COUNT} files, ${AVATAR_SIZE})\n"
    else
        printf "${YELLOW}⚠${RESET}  Failed to backup avatars, but database dump succeeded\n"
    fi
else
    # No avatars to backup
    # Remove old avatar dump if it exists
    if [ -f "$AVATAR_DUMP" ]; then
        rm -f "$AVATAR_DUMP"
    fi
    printf "${BLUE}→${RESET} No avatars to backup\n"
fi

exit 0
