#!/bin/bash

# Encrypt all .env files in the project
# Usage: bash scripts/encrypt-env.sh

KEY_FILE=".env.key"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "$ROOT_DIR/$KEY_FILE" ]; then
    echo "Error: $KEY_FILE not found in project root!"
    echo "Run 'bash scripts/setup-env-encryption.sh' first."
    exit 1
fi

echo "Encrypting .env files..."

# Find all .env files and encrypt them
find "$ROOT_DIR" -type f -name ".env" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/vendor/*" | while read -r env_file; do
    
    encrypted_file="${env_file}.encrypted"
    
    # Check if encryption is needed (only if .env is newer or .encrypted doesn't exist)
    if [ ! -f "$encrypted_file" ] || [ "$env_file" -nt "$encrypted_file" ]; then
        # Encrypt the file (deterministic with -nosalt for git-friendly output)
        openssl enc -aes-256-cbc -nosalt -pbkdf2 \
            -in "$env_file" \
            -out "$encrypted_file" \
            -pass file:"$ROOT_DIR/$KEY_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✓ Encrypted: ${env_file#$ROOT_DIR/}"
        else
            echo "✗ Failed to encrypt: ${env_file#$ROOT_DIR/}"
        fi
    else
        echo "⏭ Skipped (unchanged): ${env_file#$ROOT_DIR/}"
    fi
done

echo "Encryption complete!"
