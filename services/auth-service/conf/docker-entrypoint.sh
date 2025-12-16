#!/bin/bash

# ============================================================================
# Auth Service Entrypoint Script
# This script sets up the environment for the auth service
# ============================================================================

set -e

echo "Starting Auth Service..."

php artisan migrate --force

php artisan passport:keys --force

echo "Auth Service started successfully!"

exec php artisan serve --host=0.0.0.0 --port=4000