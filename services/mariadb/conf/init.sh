#!/bin/bash
# ============================================================================
# MariaDB Initialization Script
# This script runs on first container boot (when data volume is empty)
# ============================================================================

set -e

echo "Creating databases and users..."

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    -- ============================================================================
    -- DATABASE CREATION
    -- ============================================================================
    CREATE DATABASE IF NOT EXISTS \`${AUTH_DB_DATABASE}\`;
    CREATE DATABASE IF NOT EXISTS \`${USER_SERVICE_DB}\`;

    -- ============================================================================
    -- USER CREATION & PRIVILEGES
    -- ============================================================================
    
    -- Auth service user
    CREATE USER IF NOT EXISTS '${AUTH_DB_USERNAME}'@'%' IDENTIFIED BY '${AUTH_DB_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${AUTH_DB}\`.* TO '${AUTH_DB_USERNAME}'@'%';

    -- User service user
    CREATE USER IF NOT EXISTS '${USER_SERVICE_USERNAME}'@'%' IDENTIFIED BY '${USER_SERVICE_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${USER_SERVICE_DB}\`.* TO '${USER_SERVICE_USERNAME}'@'%';

    -- Apply changes
    FLUSH PRIVILEGES;
EOSQL

echo "Database initialization completed!"
