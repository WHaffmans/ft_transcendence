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

echo "  └─ Installing root dependencies..."
npm install

if [ ! -f ".husky/_/husky.sh" ]; then
    echo "  └─ Initializing Husky..."
    npx husky init
fi

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

# Find all services with package.json (Node.js services)
find "$SERVICES_DIR" -maxdepth 2 -name "package.json" -type f | while read -r package_file; do
    service_dir="$(dirname "$package_file")"
    service_name="$(basename "$service_dir")"

    echo "📦 Setting up Node.js service: $service_name"
    cd "$service_dir"

    echo "  └─ Installing npm dependencies..."
    npm install

    echo "  ✅ Done"
    echo ""
done

# Find all services with composer.json (Laravel/PHP services)
find "$SERVICES_DIR" -maxdepth 2 -name "composer.json" -type f | while read -r composer_file; do
    service_dir="$(dirname "$composer_file")"
    service_name="$(basename "$service_dir")"

    echo "📦 Setting up Laravel service: $service_name"
    cd "$service_dir"

    echo "  └─ Installing composer dependencies..."
    composer install

    # Copy .env if it doesn't exist
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        echo "  └─ Creating .env file..."
        cp .env.example .env
    fi

    echo "  ✅ Done"
    echo ""
done

echo "✨ Development environment initialized successfully!"
