#!/bin/bash

# ============================================================================
# Backend Service Entrypoint Script
# This script sets up the environment for the backend service
# ============================================================================

set -e

echo "Starting Backend Service..."


if [ $BUILD == "DEV" ]; then
  echo "Running in DEV mode"

  # Install dependencies if vendor directory doesn't exist
  if [ ! -d "vendor" ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --optimize-autoloader
  fi

  # Ensure Laravel writable directories exist and are writable
  echo "Setting up Laravel directories..."
  mkdir -p /var/www/html/storage/logs
  mkdir -p /var/www/html/storage/framework/cache
  mkdir -p /var/www/html/storage/framework/sessions
  mkdir -p /var/www/html/storage/framework/views
  mkdir -p /var/www/html/bootstrap/cache
  chmod -R 777 /var/www/html/storage
  chmod -R 777 /var/www/html/bootstrap/cache
fi

php artisan migrate --force --seed

php artisan optimize

# Use provided keys in dev, otherwise generate
if [ -z "${PASSPORT_PRIVATE_KEY}" ] || [ -z "${PASSPORT_PUBLIC_KEY}" ]; then
  php artisan passport:keys --force
else
  echo "Using PASSPORT_* keys from env"
fi

alias artisan="php /var/www/artisan"

echo "Backend Service started successfully!"

exec php artisan serve --host=0.0.0.0 --port=4000