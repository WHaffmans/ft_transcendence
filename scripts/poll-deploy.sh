#!/bin/bash
# ============================================================================
# Poll-Deploy: Simple CI/CD for ft_transcendence
#
# Polls origin/main every 60 seconds. When a new commit is detected,
# performs a full redeploy: down -> init -> build -> up.
#
# Hardcoded to production mode (docker-compose.prod.yaml).
# Non-interactive -- all operations run unattended.
#
# Usage:
#   bash scripts/poll-deploy.sh
#   nohup bash scripts/poll-deploy.sh >> deploy.log 2>&1 &
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yaml"
POLL_INTERVAL=60
BRANCH="main"
REMOTE="origin"

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------

log()  { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
info() { log "INFO  $*"; }
warn() { log "WARN  $*"; }
err()  { log "ERROR $*"; }

# ------------------------------------------------------------------------------
# Signal handling
# ------------------------------------------------------------------------------

RUNNING=true

cleanup() {
    info "Received shutdown signal, exiting..."
    RUNNING=false
}

trap cleanup SIGINT SIGTERM

# ------------------------------------------------------------------------------
# Helper: install dependencies (replicates make deps / init-dev.sh logic)
# Non-interactive subset -- skips husky init and cert generation (handled
# separately), focuses on npm workspaces and composer.
# ------------------------------------------------------------------------------

install_deps() {
    info "Installing npm dependencies..."
    (cd "$PROJECT_ROOT" && npm install)

    info "Building shared packages..."
    (cd "$PROJECT_ROOT" && npm run -w @ft/game-ws-protocol build)

    info "Installing composer dependencies for Laravel services..."
    local services_dir="$PROJECT_ROOT/services"
    if [ -d "$services_dir" ]; then
        find "$services_dir" -maxdepth 3 -name "composer.json" -type f | while read -r composer_file; do
            local service_dir
            service_dir="$(dirname "$composer_file")"
            local service_name
            service_name="$(basename "$service_dir")"
            info "  composer install: $service_name"
            (cd "$service_dir" && composer install --no-interaction) || warn "composer install failed for $service_name"
        done
    fi
}

# ------------------------------------------------------------------------------
# Helper: ensure prod certs exist (same check as make up does)
# ------------------------------------------------------------------------------

ensure_prod_certs() {
    if [ ! -f "$PROJECT_ROOT/certs/prod/traefik-cert.pem" ] || \
       [ ! -f "$PROJECT_ROOT/certs/prod/mariadb/ca-cert.pem" ]; then
        info "Production certificates not found, generating..."
        bash "$SCRIPT_DIR/generate-prod-certs.sh"
    fi
}

# ------------------------------------------------------------------------------
# Deploy sequence
# ------------------------------------------------------------------------------

deploy() {
    local new_sha="$1"
    info "========================================="
    info "NEW COMMIT DETECTED: $new_sha"
    info "Starting deploy..."
    info "========================================="

    # 1. Backup database (if mariadb is running)
    info "[1/9] Backing up database..."
    bash "$SCRIPT_DIR/db-dump.sh" || warn "Database backup failed (container may not be running)"

    # 2. Stop services
    info "[2/9] Stopping services..."
    docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" down --remove-orphans

    # 3. Sync code
    info "[3/9] Syncing code to $REMOTE/$BRANCH ($new_sha)..."
    (cd "$PROJECT_ROOT" && git reset --hard "$REMOTE/$BRANCH")

    # 4. Decrypt env files
    info "[4/9] Decrypting .env files..."
    bash "$SCRIPT_DIR/decrypt-env.sh"

    # 5. Validate env
    info "[5/9] Validating .env..."
    bash "$SCRIPT_DIR/validate-env.sh"

    # 6. Install dependencies
    info "[6/9] Installing dependencies..."
    install_deps

    # 7. Ensure production certificates
    info "[7/9] Checking production certificates..."
    ensure_prod_certs

    # 8. Build and start
    info "[8/9] Building images..."
    docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" build

    info "[9/9] Starting services..."
    docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" up -d

    # 9. Restore database if dump exists
    if [ -f "$PROJECT_ROOT/dumps/latest.sql" ]; then
        info "Restoring database from dump..."
        bash "$SCRIPT_DIR/db-restore.sh" --auto || warn "Database restore failed"
    fi

    info "========================================="
    info "Deploy complete!"
    info "========================================="
}

# ------------------------------------------------------------------------------
# Main loop
# ------------------------------------------------------------------------------

main() {
    info "poll-deploy starting"
    info "Project root: $PROJECT_ROOT"
    info "Compose file: $COMPOSE_FILE"
    info "Tracking:     $REMOTE/$BRANCH"
    info "Poll interval: ${POLL_INTERVAL}s"
    info ""

    # Initial fetch to establish baseline
    info "Fetching $REMOTE/$BRANCH..."
    (cd "$PROJECT_ROOT" && git fetch "$REMOTE" "$BRANCH")

    local current_sha
    current_sha=$(cd "$PROJECT_ROOT" && git rev-parse "$REMOTE/$BRANCH")
    info "Current $REMOTE/$BRANCH: $current_sha"
    info "Polling for changes..."
    info ""

    while $RUNNING; do
        # Sleep in 1-second increments so we can respond to signals promptly
        local waited=0
        while $RUNNING && [ "$waited" -lt "$POLL_INTERVAL" ]; do
            sleep 1
            waited=$((waited + 1))
        done

        if ! $RUNNING; then
            break
        fi

        # Fetch latest
        if ! (cd "$PROJECT_ROOT" && git fetch "$REMOTE" "$BRANCH" 2>&1); then
            warn "git fetch failed, will retry next cycle"
            continue
        fi

        local new_sha
        new_sha=$(cd "$PROJECT_ROOT" && git rev-parse "$REMOTE/$BRANCH")

        if [ "$new_sha" = "$current_sha" ]; then
            continue
        fi

        # New commit detected -- deploy
        if deploy "$new_sha"; then
            current_sha="$new_sha"
            info "Tracking SHA updated to: $current_sha"
        else
            err "Deploy FAILED for $new_sha -- will retry on next change"
            # Update SHA anyway to avoid infinite retry loops on a broken commit.
            # The next push to origin/main will trigger a fresh deploy attempt.
            current_sha="$new_sha"
        fi

        info "Resuming polling..."
        info ""
    done

    info "poll-deploy stopped"
}

main "$@"
