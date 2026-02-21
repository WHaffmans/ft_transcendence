#!/bin/bash
# ============================================================================
# Database Dump Script
# Creates a dump of the MariaDB database to dumps/latest.sql
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
    exit 0
else
    printf "${RED}✗${RESET} Failed to create database dump\n"
    exit 1
fi
