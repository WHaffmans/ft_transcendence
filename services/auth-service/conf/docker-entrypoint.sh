#!/bin/bash

# ============================================================================
# Auth Service Entrypoint Script
# This script sets up the environment for the auth service
# ============================================================================

set -e

echo "Starting Auth Service..."

php artisan migrate --force --seed

php artisan optimize

# Use provided keys in dev, otherwise generate
if [ -z "${PASSPORT_PRIVATE_KEY}" ] || [ -z "${PASSPORT_PUBLIC_KEY}" ]; then
  php artisan passport:keys --force
else
  echo "Using PASSPORT_* keys from env"
fi

echo "Auth Service started successfully!"

exec php artisan serve --host=0.0.0.0 --port=4000