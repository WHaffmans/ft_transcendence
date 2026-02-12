#!/bin/bash

# Initialize development environment for ft_transcendence
# This script discovers and sets up all services with package.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICES_DIR="$PROJECT_ROOT/services"

echo "🚀 Initializing development environment..."
echo ""

# Setup root workspace and Husky
echo "📦 Setting up root workspace..."
cd "$PROJECT_ROOT"

echo "  └─ Installing all dependencies (npm workspaces)..."
npm install

if [ ! -f ".husky/_/husky.sh" ]; then
    echo "  └─ Initializing Husky..."
    npx husky init
fi

# Build shared packages
echo "  └─ Building shared packages..."
npm run -w @ft/game-ws-protocol build

echo "  ✅ Done"
echo ""

# Generate self-signed TLS certificates for local development
CERTS_DIR="$PROJECT_ROOT/certs"
if [ ! -f "$CERTS_DIR/localhost-cert.pem" ] || [ ! -f "$CERTS_DIR/localhost-key.pem" ]; then
    echo "🔐 Generating self-signed TLS certificates..."
    mkdir -p "$CERTS_DIR"

    openssl req -x509 -newkey rsa:4096 \
        -keyout "$CERTS_DIR/localhost-key.pem" \
        -out "$CERTS_DIR/localhost-cert.pem" \
        -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Development/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

    echo "  ✅ Certificates generated in certs/"
    echo ""
else
    echo "🔐 TLS certificates already exist, skipping generation"
    echo ""
fi

# Note: Node.js services are handled by npm workspaces from the root install
# No need to run npm install in individual service directories

#if composer is not present install composer locally
if ! command -v composer &> /dev/null
then
    EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"
    if [ "$EXPECTED_SIGNATURE" != "$ACTUAL_SIGNATURE" ]
    then
        >&2 echo 'ERROR: Invalid installer signature'
        rm composer-setup.php
        exit 1
    fi
    echo "  └─ Installing Composer..."
    #installl in home bin for global access
    php composer-setup.php --quiet --install-dir="$HOME/.local/bin" --filename=composer
    echo "  ✅ Composer installed globally"
    rm composer-setup.php
else
    echo "📥 Composer is already installed, skipping installation"
fi
echo ""


# Find all services with composer.json (Laravel/PHP services)
find "$SERVICES_DIR" -maxdepth 3 -name "composer.json" -type f | while read -r composer_file; do
    service_dir="$(dirname "$composer_file")"
    service_name="$(basename "$service_dir")"

    echo "📦 Setting up Laravel service: $service_name"
    cd "$service_dir"

    echo "  └─ Installing composer dependencies..."
    composer install || true

    # Copy .env if it doesn't exist
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        echo "  └─ Creating .env file..."
        cp .env.example .env
    fi

    echo "  ✅ Done"
    echo ""
done

echo "✨ Development environment initialized successfully!"
