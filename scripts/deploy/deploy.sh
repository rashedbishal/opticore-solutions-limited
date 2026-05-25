#!/usr/bin/env bash
# =============================================================================
# Atomic release-based deployment script — production grade.
#
# Usage:
#   deploy.sh <release-name> <sha>
#   deploy.sh 20260524_143022 a1b2c3d
#
# Environment variables expected:
#   APP_URL       - e.g. https://opticoresolutionsltd.com
#   DEPLOY_BASE   - e.g. /var/www/opticore
#
# VPS prerequisites (run once after provisioning, before first deploy):
#   sudo apt install unzip -y
#
#   Without unzip, Composer silently falls back to PHP's ZipArchive for
#   package extraction. It works, but is slower and emits a warning on every
#   install. Install unzip once and the warning disappears permanently.
#   All other requirements are assumed present: php8.3, composer, curl,
#   rsync, and sudo access for php8.3-fpm and supervisorctl.
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

# Phase-tracking flags — read by on_exit to decide what cleanup is needed.
# MAINTENANCE_ACTIVE: true after artisan down, false after artisan up.
# SYMLINK_SWAPPED:    true once the symlink has been moved to the new release.
MAINTENANCE_ACTIVE=false
SYMLINK_SWAPPED=false

# Deployment lock state.
# LOCK_HELD is set true immediately after mkdir succeeds — before writing the
# PID file — so the EXIT trap can clean up the lock even if the process is
# interrupted in the narrow window between directory creation and PID write.
LOCK_DIR="$DEPLOY_BASE/deploy.lock"
LOCK_HELD=false

log() { echo "==> [$(date '+%H:%M:%S')] $*"; }
err() { echo "!!! [$(date '+%H:%M:%S')] ERROR: $*" >&2; }

# -------------------------------------------------------------------------
# acquire_lock — atomically claims $LOCK_DIR using mkdir.
#
# mkdir on Linux is atomic: exactly one caller gets the directory.
# The PID is written inside so a later invocation can detect stale locks
# left by a crashed runner or killed deployment.
#
# This function must be called AFTER trap 'on_exit' EXIT is armed so that
# any interruption after the directory is created always reaches on_exit
# and release_lock. Calling it before the trap would leave a leaked lock
# if the process is killed between mkdir and LOCK_HELD=true.
#
# Exits non-zero without triggering rollback cleanup when another live
# deployment holds the lock (LOCK_HELD stays false, so release_lock is
# a safe no-op when on_exit fires for this early exit).
# -------------------------------------------------------------------------
acquire_lock() {
    if mkdir "$LOCK_DIR" 2>/dev/null; then
        LOCK_HELD=true         # Set BEFORE writing PID — closes the SIGINT race window.
        echo "$$" > "$LOCK_DIR/pid"
        log "Deployment lock acquired (PID $$)."
        return 0
    fi

    # Lock directory already exists — check whether the owning process is alive.
    local locked_pid
    locked_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")

    if [ -n "$locked_pid" ] && ! kill -0 "$locked_pid" 2>/dev/null; then
        log "Stale lock detected (PID $locked_pid is no longer running). Clearing."
        rm -rf "$LOCK_DIR"
        if mkdir "$LOCK_DIR" 2>/dev/null; then
            LOCK_HELD=true
            echo "$$" > "$LOCK_DIR/pid"
            log "Deployment lock acquired after clearing stale lock (PID $$)."
            return 0
        fi
    fi

    err "A deployment is already in progress (PID ${locked_pid:-unknown})."
    err "Lock directory: $LOCK_DIR"
    err "If no deployment is running, remove it manually: rm -rf $LOCK_DIR"
    exit 1
}

# -------------------------------------------------------------------------
# release_lock — idempotent. Safe to call multiple times and from on_exit
# on both the success and failure paths.
#
# LOCK_HELD guards against removing a lock we never acquired. When
# acquire_lock exits 1 because another deployment is live, LOCK_HELD
# stays false and this function is a guaranteed no-op — we never touch
# the other deployment's lock directory.
# -------------------------------------------------------------------------
release_lock() {
    if [ "$LOCK_HELD" = "true" ]; then
        rm -rf "$LOCK_DIR" 2>/dev/null || true
        LOCK_HELD=false
        log "Deployment lock released."
    fi
}

# -------------------------------------------------------------------------
# on_exit — fires on ANY script exit (success, ERR, SIGINT, or SIGTERM).
#
# The root cause of the previous production incident: the old script used
# `trap rollback ERR` but health_check called fail() → exit 1. In bash,
# an explicit `exit` does NOT trigger the ERR trap — only command failures
# do. So the rollback never fired and the broken release stayed active.
#
# Fix: trap the EXIT pseudo-signal instead. It fires on ALL exits:
#   - set -e command failure  → triggers EXIT with the failing exit code
#   - explicit `exit N`       → triggers EXIT with N
#   - SIGINT / SIGTERM        → triggers EXIT via the signal traps below
#
# Cleanup decisions are driven by the phase flags above, not by guessing
# how far the script got from the exit code alone.
# -------------------------------------------------------------------------
on_exit() {
    local exit_code=$?
    trap - EXIT INT TERM  # Prevent recursive firing if cleanup itself fails.
    set +e                # Never let set -e abort mid-cleanup.

    # Release the lock unconditionally — must happen on BOTH the success
    # and failure paths. This is why trap - EXIT INT TERM is NOT called in
    # the main script body on success: the script's natural end triggers
    # on_exit with exit_code=0, which releases the lock and returns early.
    release_lock

    [ "$exit_code" -eq 0 ] && return 0

    err "Deployment failed (exit $exit_code). Starting emergency cleanup..."

    # ── 1. Restore symlink if already swapped ──────────────────────────────
    if [ "$SYMLINK_SWAPPED" = "true" ]; then
        local previous
        previous=$(cat "$DEPLOY_BASE/PREVIOUS_RELEASE" 2>/dev/null || echo "")
        if [ -n "$previous" ] && [ -d "$RELEASES_DIR/$previous" ]; then
            err "Restoring symlink → $previous"
            ln -snf "$RELEASES_DIR/$previous" "$DEPLOY_BASE/_rollback_ptr"
            mv -fT "$DEPLOY_BASE/_rollback_ptr" "$CURRENT_LINK"
            echo "$previous" > "$DEPLOY_BASE/CURRENT_RELEASE"
            err "Symlink restored to: $previous"
        else
            err "No valid previous release found at: $RELEASES_DIR/${previous:-<unset>}"
            err "MANUAL INTERVENTION REQUIRED — determine a safe release and swap manually."
        fi
    fi

    # ── 2. Disable maintenance mode ────────────────────────────────────────
    # artisan up is idempotent: safe to call even when the app is already live.
    # Run from CURRENT_LINK so it works whether the symlink was rolled back or not.
    if [ "$MAINTENANCE_ACTIVE" = "true" ]; then
        $PHP "$CURRENT_LINK/artisan" up --quiet 2>/dev/null \
            || err "artisan up failed — maintenance mode may still be active. Check VPS."
        err "Maintenance mode disabled."
    fi

    # ── 3. Reload services so the restored release is served ──────────────
    # Only needed when the symlink was actually swapped: PHP-FPM and queue
    # workers must be pointed at the restored release, not the broken one.
    if [ "$SYMLINK_SWAPPED" = "true" ]; then
        sudo systemctl reload php8.3-fpm                   2>/dev/null || err "php-fpm reload failed."
        sudo supervisorctl restart laravel-reverb           2>/dev/null || err "reverb restart failed."
        $PHP "$CURRENT_LINK/artisan" queue:restart          2>/dev/null || err "queue:restart failed."
        err "Services reloaded for rolled-back release."
    fi

    # ── 4. Record failure in DEPLOY_LOG ───────────────────────────────────
    echo "FAILED: $RELEASE_NAME ($COMMIT_SHA) rollback_triggered=$SYMLINK_SWAPPED at $(date -u '+%Y-%m-%d %H:%M:%S UTC')" \
        >> "$DEPLOY_BASE/DEPLOY_LOG" 2>/dev/null || true

    err "Emergency cleanup complete. Exit code: $exit_code"
    exit "$exit_code"
}

trap 'on_exit' EXIT
trap 'exit 130' INT   # SIGINT  → triggers EXIT trap with code 130.
trap 'exit 143' TERM  # SIGTERM → triggers EXIT trap with code 143.

# Acquire the deployment lock immediately after all traps are armed.
# Placement here is deliberate: any interruption after this point — including
# during lock acquisition itself — is guaranteed to reach on_exit → release_lock.
acquire_lock

# -------------------------------------------------------------------------
# health_check — uses return 1 on failure, never exit.
#
# Using exit inside this function would bypass set -e's normal flow and
# trigger the EXIT trap with $? = 1, but the SYMLINK_SWAPPED / MAINTENANCE
# flags would correctly reflect the deployment state at that point.
# Using return 1 is cleaner: set -e sees the non-zero return from the
# calling site and exits normally, landing in on_exit with correct context.
# -------------------------------------------------------------------------
health_check() {
    local url="$APP_URL/up"
    local max_attempts=6 attempt=1
    log "Health check: $url"
    while [ $attempt -le $max_attempts ]; do
        if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
            log "Health check passed (attempt $attempt/$max_attempts)."
            return 0
        fi
        log "Attempt $attempt/$max_attempts failed. Retrying in 5s..."
        sleep 5
        attempt=$((attempt + 1))
    done
    err "Health check failed after $max_attempts attempts."
    return 1  # set -e propagates this failure; on_exit fires with correct state.
}

# =========================================================================
# PHASE 1 — Prepare release directory
# =========================================================================
log "Creating release directory: $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

log "Linking shared .env and storage..."
ln -sfn "$SHARED_DIR/.env"    "$RELEASE_DIR/.env"
ln -sfn "$SHARED_DIR/storage" "$RELEASE_DIR/storage"

# =========================================================================
# PHASE 2 — Install PHP dependencies (no dev, optimized autoloader)
#
# Requires unzip on the VPS for fast zip extraction. Without it Composer
# warns and falls back to PHP's ZipArchive. Install once:
#   sudo apt install unzip -y
# =========================================================================
log "Installing Composer dependencies..."
composer install \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-dev \
    --working-dir="$RELEASE_DIR"

# =========================================================================
# PHASE 3 — Place pre-built frontend (downloaded from CI artifact)
# =========================================================================
if [ -n "${FRONTEND_BUILD_DIR:-}" ] && [ -d "$FRONTEND_BUILD_DIR" ]; then
    log "Placing pre-built frontend..."
    mkdir -p "$RELEASE_DIR/public/build"
    cp -r "$FRONTEND_BUILD_DIR/." "$RELEASE_DIR/public/build/"
else
    err "FRONTEND_BUILD_DIR is not set or does not exist. CI artifact must be downloaded first."
    exit 1
fi

rm -f "$RELEASE_DIR/public/storage"
ln -sfn "$SHARED_DIR/storage/app/public" "$RELEASE_DIR/public/storage"

# =========================================================================
# PHASE 4 — Enable maintenance mode on the CURRENT live release.
#
# Uses shared storage, so the maintenance flag is visible to all releases.
# The 2>/dev/null || true tolerates first-ever deployments where $CURRENT_LINK
# may not exist yet, or where the live artisan binary is temporarily unhappy.
# MAINTENANCE_ACTIVE is set true regardless: if artisan down was a no-op,
# artisan up in on_exit is also a no-op and harmless.
# =========================================================================
log "Enabling maintenance mode..."
"$PHP" "$CURRENT_LINK/artisan" down \
    --retry=30 \
    --secret="bypass-$(echo "$COMMIT_SHA" | cut -c1-8)" \
    2>/dev/null || true
MAINTENANCE_ACTIVE=true

# =========================================================================
# PHASE 5 — Database migrations.
# Runs from the NEW release so new migration files are available.
# Migrations run while in maintenance mode to prevent schema/code mismatch.
# =========================================================================
log "Running migrations (default connection)..."
$ARTISAN migrate --force

log "Running migrations (admin connection)..."
$ARTISAN migrate --force --database=admin

# =========================================================================
# PHASE 6 — Cache config, routes, views, events in the new release.
# =========================================================================
log "Caching configuration..."
$ARTISAN config:cache
$ARTISAN route:cache
$ARTISAN view:cache
$ARTISAN event:cache

# =========================================================================
# PHASE 7 — Save the previous release pointer, then atomically activate
# the new release. mv on the same filesystem is atomic.
# =========================================================================
log "Saving previous release pointer..."
if [ -L "$CURRENT_LINK" ]; then
    readlink "$CURRENT_LINK" | xargs basename > "$DEPLOY_BASE/PREVIOUS_RELEASE" || true
fi

log "Atomically activating new release: $RELEASE_NAME"
ln -snf "$RELEASE_DIR" "$DEPLOY_BASE/_next_ptr"
mv -fT "$DEPLOY_BASE/_next_ptr" "$CURRENT_LINK"
echo "$RELEASE_NAME" > "$DEPLOY_BASE/CURRENT_RELEASE"
SYMLINK_SWAPPED=true  # All failures after this line restore the previous release.

# =========================================================================
# PHASE 8 — Bring application back online.
# MAINTENANCE_ACTIVE must be set false immediately on success so that on_exit
# does not try to run artisan up a second time if a later phase fails.
# =========================================================================
log "Disabling maintenance mode..."
"$PHP" "$CURRENT_LINK/artisan" up
MAINTENANCE_ACTIVE=false

# =========================================================================
# PHASE 9 — Restart services. Order matters:
#   FPM first  → workers immediately serve new code from the new release.
#   Reverb     → WebSocket server picks up new event/channel definitions.
#   Queues     → workers drain current jobs then restart with new code.
# =========================================================================
log "Reloading PHP-FPM..."
sudo systemctl reload php8.3-fpm

log "Restarting Reverb..."
sudo supervisorctl restart laravel-reverb

log "Signalling queue workers to restart gracefully..."
"$PHP" "$CURRENT_LINK/artisan" queue:restart

# =========================================================================
# PHASE 10 — Post-deployment health check.
# Returns 1 on failure → set -e exits → on_exit rolls back everything.
# =========================================================================
health_check

# =========================================================================
# PHASE 11 — Record success and prune old releases.
#
# Note: trap - EXIT INT TERM is intentionally NOT called here.
# The script exits naturally after this block with exit code 0.
# on_exit fires, sees exit_code=0, calls release_lock, and returns early.
# This ensures the lock is always released through a single code path.
# =========================================================================
log "Deployment successful. Release: $RELEASE_NAME  SHA: $COMMIT_SHA"
echo "OK: $RELEASE_NAME ($COMMIT_SHA) at $(date -u '+%Y-%m-%d %H:%M:%S UTC')" \
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
