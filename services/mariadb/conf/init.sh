#!/bin/bash
# ============================================================================
# MariaDB Initialization Script
# This script runs on first container boot (when data volume is empty)
# ============================================================================

set -e

echo "Creating databases and users..."

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\`;    
    CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${DB_DATABASE}\`.* TO '${DB_USERNAME}'@'%';
    FLUSH PRIVILEGES;
EOSQL

echo "Database initialization completed!"
