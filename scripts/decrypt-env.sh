#!/bin/bash

# Decrypt all .env.encrypted files in the project
# Usage: bash scripts/decrypt-env.sh

KEY_FILE=".env.key"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "$ROOT_DIR/$KEY_FILE" ]; then
    echo "Error: $KEY_FILE not found in project root!"
    echo "Please obtain the encryption key and place it at the project root."
    exit 1
fi

echo "Decrypting .env files..."

# Find all .env.encrypted files and decrypt them
find "$ROOT_DIR" -type f -name ".env.encrypted" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/vendor/*" | while read -r encrypted_file; do
    
    env_file="${encrypted_file%.encrypted}"
    
    # Decrypt the file
    openssl enc -aes-256-cbc -d -pbkdf2 \
        -in "$encrypted_file" \
        -out "$env_file" \
        -pass file:"$ROOT_DIR/$KEY_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✓ Decrypted: ${encrypted_file#$ROOT_DIR/}"
    else
        echo "✗ Failed to decrypt: ${encrypted_file#$ROOT_DIR/}"
    fi
done

echo "Decryption complete!"
