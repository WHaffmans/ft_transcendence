#!/bin/bash

# Setup environment file encryption for the project
# This script:
# 1. Generates an encryption key
# 2. Updates .gitignore
# 3. Creates Husky pre-commit hook
# 4. Encrypts existing .env files

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY_FILE="$ROOT_DIR/.env.key"

echo "=== Environment Encryption Setup ==="
echo ""

# Step 1: Check Node.js and dependencies
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "Installing dependencies..."
cd "$ROOT_DIR"
npm install
echo "✓ Dependencies installed"

# Step 2: Generate encryption key
if [ -f "$KEY_FILE" ]; then
    echo "⚠ Encryption key already exists: $KEY_FILE"
    read -p "Do you want to generate a new key? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key."
    else
        openssl rand -base64 32 > "$KEY_FILE"
        chmod 600 "$KEY_FILE"
        echo "✓ Generated new encryption key: $KEY_FILE"
    fi
else
    openssl rand -base64 32 > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
    echo "✓ Generated encryption key: $KEY_FILE"
fi

# Step 3: Make scripts executable
chmod +x "$ROOT_DIR/scripts/encrypt-env.sh"
chmod +x "$ROOT_DIR/scripts/decrypt-env.sh"
echo "✓ Made scripts executable"

# Step 4: Update root .gitignore
if ! grep -q ".env.key" "$ROOT_DIR/.gitignore" 2>/dev/null; then
    echo "" >> "$ROOT_DIR/.gitignore"
    echo ".env.key" >> "$ROOT_DIR/.gitignore"
    echo "✓ Updated .gitignore"
else
    echo "✓ .gitignore already configured"
fi

# Step 5: Create/Update Husky hooks
HUSKY_DIR="$ROOT_DIR/.husky"
mkdir -p "$HUSKY_DIR"

# Pre-commit hook: Encrypt before committing
PRE_COMMIT="$HUSKY_DIR/pre-commit"
if [ -f "$PRE_COMMIT" ]; then
    # Append if not already present
    if ! grep -q "encrypt-env.sh" "$PRE_COMMIT"; then
        echo "" >> "$PRE_COMMIT"
        echo "# Encrypt .env files before commit" >> "$PRE_COMMIT"
        echo "bash scripts/encrypt-env.sh" >> "$PRE_COMMIT"
        echo "✓ Added encryption to existing pre-commit hook"
    else
        echo "✓ Pre-commit hook already has encryption"
    fi
else
    cat > "$PRE_COMMIT" << 'EOF'
#!/usr/bin/env sh

# Encrypt .env files before commit
bash scripts/encrypt-env.sh
EOF
    chmod +x "$PRE_COMMIT"
    echo "✓ Created pre-commit hook"
fi

# Post-merge hook: Decrypt after pulling/merging
POST_MERGE="$HUSKY_DIR/post-merge"
if [ ! -f "$POST_MERGE" ] || ! grep -q "decrypt-env.sh" "$POST_MERGE"; then
    cat > "$POST_MERGE" << 'EOF'
#!/usr/bin/env sh

# Auto-decrypt .env files after merge/pull (if key exists)
if [ -f ".env.key" ]; then
    echo "🔓 Decrypting updated .env files..."
    bash scripts/decrypt-env.sh
else
    echo "⚠️  .env.key not found - skipping decryption"
    echo "   Run 'npm run decrypt-env' after obtaining the key"
fi
EOF
    chmod +x "$POST_MERGE"
    echo "✓ Created post-merge hook"
else
    echo "✓ Post-merge hook already configured"
fi

# Post-checkout hook: Decrypt after switching branches
POST_CHECKOUT="$HUSKY_DIR/post-checkout"
if [ ! -f "$POST_CHECKOUT" ] || ! grep -q "decrypt-env.sh" "$POST_CHECKOUT"; then
    cat > "$POST_CHECKOUT" << 'EOF'
#!/usr/bin/env sh

# Auto-decrypt .env files after checkout (if key exists)
if [ -f ".env.key" ]; then
    echo "🔓 Decrypting .env files for this branch..."
    bash scripts/decrypt-env.sh
else
    echo "⚠️  .env.key not found - skipping decryption"
fi
EOF
    chmod +x "$POST_CHECKOUT"
    echo "✓ Created post-checkout hook"
else
    echo "✓ Post-checkout hook already configured"
fi

# Step 6: Initial encryption
echo ""
echo "Performing initial encryption..."
bash "$ROOT_DIR/scripts/encrypt-env.sh"

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "✅ Husky hooks installed:"
echo "   - pre-commit: Auto-encrypts before commits"
echo "   - post-merge: Auto-decrypts after git pull"
echo "   - post-checkout: Auto-decrypts after branch switch"
echo ""
echo "Next steps:"
echo "1. 🔒 Backup .env.key securely (DO NOT commit it!)"
echo "2. 📤 Share .env.key with team via secure channel"
echo "3. 🗑️  Remove .env files from git:"
echo "   git rm --cached services/auth-service/src/.env"
echo "   (repeat for all .env files)"
echo "4. ✅ Commit the encrypted versions:"
echo "   git add .gitignore .husky/ **/.env.encrypted"
echo "   git commit -m 'Add encrypted environment files and Husky hooks'"
echo ""
echo "Team members workflow:"
echo "   git clone <repo>"
echo "   npm install              # Auto-installs hooks"
echo "   # Place .env.key in project root"
echo "   npm run decrypt-env      # Initial decrypt"
echo "   # After that, git pull auto-decrypts! ✨"
echo ""
