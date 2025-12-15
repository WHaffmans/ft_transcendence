#!/bin/bash
# ============================================================================
# MariaDB Initialization Script
# This script runs on first container boot (when data volume is empty)
# ============================================================================

set -e

# Use environment variables with defaults
AUTH_DB="${AUTH_DB:-auth_service}"
AUTH_USER="${AUTH_USER:-auth_user}"
AUTH_PASSWORD="${AUTH_PASSWORD:-auth_password}"

USER_SERVICE_DB="${USER_SERVICE_DB:-transcendence}"
USER_SERVICE_USER="${USER_SERVICE_USER:-user_service}"
USER_SERVICE_PASSWORD="${USER_SERVICE_PASSWORD:-user_password}"

echo "Creating databases and users..."

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    -- ============================================================================
    -- DATABASE CREATION
    -- ============================================================================
    CREATE DATABASE IF NOT EXISTS \`${AUTH_DB}\`;
    CREATE DATABASE IF NOT EXISTS \`${USER_SERVICE_DB}\`;

    -- ============================================================================
    -- USER CREATION & PRIVILEGES
    -- ============================================================================
    
    -- Auth service user
    CREATE USER IF NOT EXISTS '${AUTH_USER}'@'%' IDENTIFIED BY '${AUTH_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${AUTH_DB}\`.* TO '${AUTH_USER}'@'%';

    -- User service user
    CREATE USER IF NOT EXISTS '${USER_SERVICE_USER}'@'%' IDENTIFIED BY '${USER_SERVICE_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${USER_SERVICE_DB}\`.* TO '${USER_SERVICE_USER}'@'%';

    -- Apply changes
    FLUSH PRIVILEGES;
EOSQL

echo "Database initialization completed!"
