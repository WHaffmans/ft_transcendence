#!/bin/bash

# ============================================================================
# Auth Service Entrypoint Script
# This script sets up the environment for the auth service
# ============================================================================

set -e

echo "Starting Auth Service..."

php artisan migrate --force

# Use provided keys in dev, otherwise generate
if [ -z "${PASSPORT_PRIVATE_KEY}" ] || [ -z "${PASSPORT_PUBLIC_KEY}" ]; then
  php artisan passport:keys --force
else
  echo "Using PASSPORT_* keys from env"
fi

# Ensure stable PKCE client (local)
php artisan dev:passport-client --id="${OAUTH_DEV_CLIENT_ID:-$CLIENT_ID}" \
  --redirect="${OAUTH_DEV_REDIRECTS:-https://${DOMAIN:-localhost}/frontend/callback}"

echo "Auth Service started successfully!"

exec php artisan serve --host=0.0.0.0 --port=4000