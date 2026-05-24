#!/usr/bin/env bash
# =============================================================================
# Atomic release-based deployment script.
#
# Usage:
#   deploy.sh <release-name> <sha>
#   deploy.sh 20260524_143022 a1b2c3d
#
# Environment variables expected:
#   APP_URL       - e.g. https://opticore.solutions
#   DEPLOY_BASE   - e.g. /var/www/opticore  (set as GitHub Actions env)
# =============================================================================
set -euo pipefail

RELEASE_NAME="${1:?Release name is required}"
COMMIT_SHA="${2:?Commit SHA is required}"
DEPLOY_BASE="${DEPLOY_BASE:?DEPLOY_BASE must be set}"
APP_URL="${APP_URL:?APP_URL must be set}"

RELEASES_DIR="$DEPLOY_BASE/releases"
SHARED_DIR="$DEPLOY_BASE/shared"
CURRENT_LINK="$DEPLOY_BASE/current"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_NAME"
PHP="php8.3"
ARTISAN="$PHP $RELEASE_DIR/artisan"
KEEP_RELEASES=5

log() { echo "==> [$(date '+%H:%M:%S')] $*"; }
fail() { echo "!!! [$(date '+%H:%M:%S')] FAILED: $*" >&2; exit 1; }

# -------------------------------------------------------------------------
# ROLLBACK: called automatically if any step after the symlink swap fails.
# Reverts to the previous release immediately.
# -------------------------------------------------------------------------
rollback() {
    local previous
    previous=$(cat "$DEPLOY_BASE/PREVIOUS_RELEASE" 2>/dev/null || echo "")
    if [ -n "$previous" ] && [ -d "$RELEASES_DIR/$previous" ]; then
        log "Rolling back to previous release: $previous"
        ln -snf "$RELEASES_DIR/$previous" "$DEPLOY_BASE/next_ptr"
        mv -fT "$DEPLOY_BASE/next_ptr" "$CURRENT_LINK"
        "$PHP" "$RELEASES_DIR/$previous/artisan" up --quiet 2>/dev/null || true
        sudo systemctl reload php8.3-fpm
        log "Rollback complete. Production is on: $previous"
    else
        log "No previous release to roll back to. Manual intervention required."
    fi
}

# -------------------------------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------------------------------
health_check() {
    local url="$APP_URL/up"
    local max_attempts=6
    local attempt=1
    log "Health check: $url"
    while [ $attempt -le $max_attempts ]; do
        if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
            log "Health check passed."
            return 0
        fi
        log "Attempt $attempt/$max_attempts failed. Retrying in 5s..."
        sleep 5
        attempt=$((attempt + 1))
    done
    fail "Health check failed after $max_attempts attempts."
}

# =========================================================================
# PHASE 1: Prepare new release directory
# =========================================================================
log "Creating release directory: $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# Link the shared .env and storage so the app is fully wired before any command.
log "Linking shared resources..."
ln -sfn "$SHARED_DIR/.env"     "$RELEASE_DIR/.env"
ln -sfn "$SHARED_DIR/storage"  "$RELEASE_DIR/storage"

# =========================================================================
# PHASE 2: Install PHP dependencies (no dev, optimized autoloader)
# =========================================================================
log "Installing Composer dependencies..."
composer install \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-dev \
    --working-dir="$RELEASE_DIR"

# =========================================================================
# PHASE 3: Place pre-built frontend (downloaded from CI artifact — see workflow)
# The FRONTEND_BUILD_DIR env var is set by the calling workflow.
# =========================================================================
if [ -n "${FRONTEND_BUILD_DIR:-}" ] && [ -d "$FRONTEND_BUILD_DIR" ]; then
    log "Placing pre-built frontend..."
    mkdir -p "$RELEASE_DIR/public/build"
    cp -r "$FRONTEND_BUILD_DIR/." "$RELEASE_DIR/public/build/"
else
    fail "FRONTEND_BUILD_DIR is not set or does not exist. The CI artifact must be downloaded first."
fi

# Ensure the public/storage symlink exists in the new release.
rm -f "$RELEASE_DIR/public/storage"
ln -sfn "$SHARED_DIR/storage/app/public" "$RELEASE_DIR/public/storage"

# =========================================================================
# PHASE 4: Enable maintenance mode on the CURRENT live app
# (Uses shared storage, so all releases see the same flag.)
# =========================================================================
log "Enabling maintenance mode..."
"$PHP" "$CURRENT_LINK/artisan" down \
    --retry=30 \
    --secret="bypass-$(echo "$COMMIT_SHA" | cut -c1-8)" \
    2>/dev/null || true

# =========================================================================
# PHASE 5: Run database migrations against the SHARED database.
# Runs from the NEW release directory so new migration files are picked up.
# =========================================================================
log "Running migrations (default connection)..."
$ARTISAN migrate --force

log "Running migrations (admin connection)..."
$ARTISAN migrate --force --database=admin

# =========================================================================
# PHASE 6: Cache all configuration in the new release
# =========================================================================
log "Caching configuration..."
$ARTISAN config:cache
$ARTISAN route:cache
$ARTISAN view:cache
$ARTISAN event:cache

# =========================================================================
# PHASE 7: Atomic symlink swap  (mv on the same filesystem is atomic)
# =========================================================================
log "Saving previous release pointer..."
if [ -L "$CURRENT_LINK" ]; then
    readlink "$CURRENT_LINK" | xargs basename > "$DEPLOY_BASE/PREVIOUS_RELEASE" || true
fi

log "Atomically activating new release..."
ln -snf "$RELEASE_DIR" "$DEPLOY_BASE/next_ptr"
mv -fT "$DEPLOY_BASE/next_ptr" "$CURRENT_LINK"
echo "$RELEASE_NAME" > "$DEPLOY_BASE/CURRENT_RELEASE"

# From this point onwards, failures trigger rollback.
trap rollback ERR

# =========================================================================
# PHASE 8: Bring application back online
# =========================================================================
log "Disabling maintenance mode..."
"$PHP" "$CURRENT_LINK/artisan" up

# =========================================================================
# PHASE 9: Restart services (order matters)
# - Reload PHP-FPM first so workers pick up the new code.
# - Then restart Reverb (WebSocket server).
# - Then signal queue workers to gracefully restart.
# =========================================================================
log "Reloading PHP-FPM..."
sudo systemctl reload php8.3-fpm

log "Restarting Reverb..."
sudo supervisorctl restart laravel-reverb

log "Signalling queue workers to restart gracefully..."
"$PHP" "$CURRENT_LINK/artisan" queue:restart

# =========================================================================
# PHASE 10: Post-deployment health check
# =========================================================================
health_check

# Clear the error trap — deployment succeeded.
trap - ERR

# =========================================================================
# PHASE 11: Record the deployment and clean up old releases
# =========================================================================
log "Deployment complete. Release: $RELEASE_NAME  SHA: $COMMIT_SHA"
echo "$RELEASE_NAME ($COMMIT_SHA) deployed at $(date -u '+%Y-%m-%d %H:%M:%S UTC')" \
    >> "$DEPLOY_BASE/DEPLOY_LOG"

log "Cleaning up old releases (keeping last $KEEP_RELEASES)..."
ls -dt "$RELEASES_DIR"/* | tail -n "+$((KEEP_RELEASES + 1))" | xargs rm -rf 2>/dev/null || true

log "Active releases:"
ls -dt "$RELEASES_DIR"/* | while read -r dir; do
    name=$(basename "$dir")
    marker=""
    [ "$(readlink "$CURRENT_LINK")" = "$dir" ] && marker=" <-- current"
    echo "    $name$marker"
done
