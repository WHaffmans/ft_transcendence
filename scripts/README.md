# Environment File Encryption Scripts

Automated encryption system for `.env` files using AES-256-CBC encryption with Git hooks.

## Overview

This system ensures sensitive environment variables are never committed to the repository in plain text. All `.env` files are encrypted before commits and automatically decrypted when pulling changes or switching branches.

## Files

- **`setup-env-encryption.sh`** - Initial setup script (run once)
- **`encrypt-env.sh`** - Encrypts all `.env` files in the project
- **`decrypt-env.sh`** - Decrypts all `.env.encrypted` files

## Quick Start

### First Time Setup (Project Lead)

```bash
# 1. Run setup script
npm run setup-env

# 2. Remove plain .env files from git tracking
git rm --cached services/auth-service/src/.env
# Repeat for any other .env files

# 3. Commit encrypted files and hooks
git add .gitignore .husky/ **/.env.encrypted
git commit -m "Add encrypted environment files with auto-decrypt"
git push
```

### Team Members (First Clone)

```bash
# 1. Clone and install
git clone <repository>
cd ft_transcendence
npm install  # Automatically installs Husky hooks

# 2. Obtain .env.key securely
# Get from team lead via 1Password, Bitwarden, or secure channel
# Place it in project root: /home/whaffman/Projects/ft_transcendence/.env.key

# 3. Decrypt environment files
npm run decrypt-env
```

## How It Works

### Automatic Encryption (Pre-Commit)

When you run `git commit`:
1. Husky triggers `.husky/pre-commit` hook
2. `encrypt-env.sh` finds all `.env` files
3. Each file is encrypted with AES-256-CBC using `.env.key`
4. Creates/updates `.env.encrypted` files
5. Stages encrypted files automatically
6. Commit proceeds with encrypted versions

### Automatic Decryption (Post-Merge/Checkout)

When you run `git pull`, `git merge`, or `git checkout`:
1. Husky triggers `.husky/post-merge` or `.husky/post-checkout` hook
2. `decrypt-env.sh` finds all `.env.encrypted` files
3. Decrypts them back to `.env` files
4. Your local environment is ready to use

## Manual Commands

### Encrypt All Environment Files
```bash
npm run encrypt-env
# or
bash scripts/encrypt-env.sh
```

### Decrypt All Environment Files
```bash
npm run decrypt-env
# or
bash scripts/decrypt-env.sh
```

## Security

### What's Protected
- ✅ `.env.key` - Never committed (in `.gitignore`)
- ✅ `.env` files - Never committed (in `.gitignore`)
- ✅ Only `.env.encrypted` files are tracked in git

### Key Management
- **DO NOT** commit `.env.key` to git
- **DO** backup `.env.key` securely
- **DO** share with team via secure channels:
  - 1Password shared vaults
  - Bitwarden organization
  - Encrypted email/messaging
  - In-person transfer

### Encryption Details
- **Algorithm**: AES-256-CBC
- **Key derivation**: PBKDF2
- **Tool**: OpenSSL (standard on Linux/macOS)

## Troubleshooting

### "Error: .env.key not found"
```bash
# You need the encryption key from your team
# After receiving it, place it at project root
cp /path/to/received/key .env.key
chmod 600 .env.key
npm run decrypt-env
```

### Hooks Not Running
```bash
# Reinstall Husky hooks
npm install
# or manually
npx husky install
```

### Decryption Fails
```bash
# Check if you have the correct key
ls -la .env.key

# Verify OpenSSL is installed
openssl version

# Try manual decryption with verbose output
openssl enc -aes-256-cbc -d -pbkdf2 \
  -in services/auth-service/src/.env.encrypted \
  -out services/auth-service/src/.env \
  -pass file:.env.key -v
```

### Merge Conflicts in .env.encrypted
```bash
# 1. Resolve conflict in .env.encrypted file
git add services/auth-service/src/.env.encrypted

# 2. Decrypt to get the merged plain text
npm run decrypt-env

# 3. Edit the plain .env file to fix any issues
vim services/auth-service/src/.env

# 4. Re-encrypt (happens automatically on commit)
git commit
```

## File Structure

```
ft_transcendence/
├── .env.key                          # Secret key (NOT in git)
├── .gitignore                        # Ignores .env.key and .env files
├── .husky/
│   ├── pre-commit                    # Auto-encrypt before commit
│   ├── post-merge                    # Auto-decrypt after pull
│   └── post-checkout                 # Auto-decrypt after branch switch
├── scripts/
│   ├── setup-env-encryption.sh       # Initial setup
│   ├── encrypt-env.sh                # Encryption script
│   └── decrypt-env.sh                # Decryption script
└── services/
    └── auth-service/
        └── src/
            ├── .env                  # Plain text (NOT in git)
            └── .env.encrypted        # Encrypted (IN git)
```

## Workflow Examples

### Starting Work on New Feature
```bash
git checkout -b feature/new-feature   # Auto-decrypts
# Edit code, including .env if needed
git commit -m "Add feature"           # Auto-encrypts
git push
```

### Updating Environment Variables
```bash
# 1. Edit plain text file
vim services/auth-service/src/.env

# 2. Commit (encryption happens automatically)
git commit -m "Update database credentials"
git push
```

### Getting Latest Changes
```bash
git pull origin main                  # Auto-decrypts
docker compose up -d                  # Uses fresh .env files
```

## CI/CD Integration

If you need to disable hooks in CI/CD:

```bash
# Skip Husky installation in CI
HUSKY=0 npm ci

# Or decrypt in CI using secret
echo "$ENV_KEY" > .env.key
npm run decrypt-env
```

## Notes

- `.env.example` files can remain unencrypted as they contain no secrets
- The encryption is deterministic with salt, so encrypted files may show diffs even without changes
- First `git pull` after setup requires manual `npm run decrypt-env`
- After that, all decryption is automatic

## Support

For issues or questions:
1. Check this README
2. Review [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Ask in team chat
4. Contact project maintainer
