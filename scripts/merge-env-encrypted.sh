#!/bin/bash

# Git merge driver for .env.encrypted files
# This script decrypts the files, performs a 3-way merge, and re-encrypts the result
#
# Usage (called by Git):
#   merge-env-encrypted.sh %O %A %B %L %P
#
# Parameters:
#   %O = ancestor's version (base)
#   %A = current version (ours)
#   %B = other branch's version (theirs)
#   %L = conflict marker size
#   %P = pathname of the file

BASE="$1"
CURRENT="$2"
OTHER="$3"
MARKER_SIZE="$4"
PATHNAME="$5"

KEY_FILE=".env.key"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if encryption key exists
if [ ! -f "$ROOT_DIR/$KEY_FILE" ]; then
    echo "Error: $KEY_FILE not found in project root!" >&2
    echo "Cannot perform merge on encrypted files." >&2
    exit 1
fi

# Create temporary directory for decrypted files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

BASE_DECRYPTED="$TEMP_DIR/base.env"
CURRENT_DECRYPTED="$TEMP_DIR/current.env"
OTHER_DECRYPTED="$TEMP_DIR/other.env"

# Decrypt all three versions
echo "Merging $PATHNAME..." >&2

openssl enc -aes-256-cbc -d -nosalt -pbkdf2 \
    -in "$BASE" \
    -out "$BASE_DECRYPTED" \
    -pass file:"$ROOT_DIR/$KEY_FILE" 2>/dev/null || touch "$BASE_DECRYPTED"

openssl enc -aes-256-cbc -d -nosalt -pbkdf2 \
    -in "$CURRENT" \
    -out "$CURRENT_DECRYPTED" \
    -pass file:"$ROOT_DIR/$KEY_FILE" 2>/dev/null || touch "$CURRENT_DECRYPTED"

openssl enc -aes-256-cbc -d -nosalt -pbkdf2 \
    -in "$OTHER" \
    -out "$OTHER_DECRYPTED" \
    -pass file:"$ROOT_DIR/$KEY_FILE" 2>/dev/null || touch "$OTHER_DECRYPTED"

# Perform 3-way merge on decrypted files
git merge-file -L "ours" -L "base" -L "theirs" \
    --marker-size="$MARKER_SIZE" \
    "$CURRENT_DECRYPTED" "$BASE_DECRYPTED" "$OTHER_DECRYPTED"

MERGE_RESULT=$?

if [ $MERGE_RESULT -eq 0 ]; then
    # Clean merge - re-encrypt the result back to CURRENT (which is the working tree file)
    openssl enc -aes-256-cbc -nosalt -pbkdf2 \
        -in "$CURRENT_DECRYPTED" \
        -out "$CURRENT" \
        -pass file:"$ROOT_DIR/$KEY_FILE"
    echo "✓ Merge successful for $PATHNAME" >&2
else
    # Conflicts exist - save decrypted version with conflict markers for manual resolution
    echo "⚠ Merge conflicts in $PATHNAME" >&2
    DECRYPTED_PATH="${PATHNAME%.encrypted}"
    cp "$CURRENT_DECRYPTED" "$DECRYPTED_PATH"
    echo "  Conflicts saved to: $DECRYPTED_PATH" >&2
    echo "  After resolving conflicts:" >&2
    echo "    1. Edit $DECRYPTED_PATH to resolve conflicts" >&2
    echo "    2. Run: bash scripts/encrypt-env.sh" >&2
    echo "    3. Stage and commit: git add $PATHNAME && git commit" >&2
fi

exit $MERGE_RESULT
