#!/usr/bin/env bash
# =============================================================================
# Emergency rollback: reverts to a specific release or to the previous one.
#
# Usage:
#   rollback.sh                   # Roll back to the previous release
#   rollback.sh 20260524_120015   # Roll back to a specific named release
# =============================================================================
set -euo pipefail

DEPLOY_BASE="${DEPLOY_BASE:?DEPLOY_BASE must be set}"
APP_URL="${APP_URL:?APP_URL must be set}"
PHP="php8.3"
RELEASES_DIR="$DEPLOY_BASE/releases"
CURRENT_LINK="$DEPLOY_BASE/current"

log()  { echo "==> [$(date '+%H:%M:%S')] $*"; }
err()  { echo "!!! [$(date '+%H:%M:%S')] ERROR: $*" >&2; }
fail() { err "$*"; exit 1; }

# ── Determine target release ─────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
    TARGET_RELEASE="$1"
    log "Rolling back to specified release: $TARGET_RELEASE"
else
    TARGET_RELEASE=$(cat "$DEPLOY_BASE/PREVIOUS_RELEASE" 2>/dev/null || echo "")
    [ -n "$TARGET_RELEASE" ] || fail "No previous release recorded. Specify a release name explicitly."
    log "Rolling back to previous release: $TARGET_RELEASE"
fi

TARGET_DIR="$RELEASES_DIR/$TARGET_RELEASE"
[ -d "$TARGET_DIR" ] || fail "Release directory not found: $TARGET_DIR"

CURRENT_RELEASE=$(cat "$DEPLOY_BASE/CURRENT_RELEASE" 2>/dev/null || echo "unknown")
log "Current release : $CURRENT_RELEASE"
log "Rollback target : $TARGET_RELEASE"

# ── Enable maintenance mode on the currently active (possibly broken) release ─
# Uses || true: the current release may be too broken to run artisan at all.
log "Enabling maintenance mode..."
"$PHP" "$CURRENT_LINK/artisan" down --retry=30 2>/dev/null \
    || log "artisan down failed (release may be broken) — continuing with rollback."

# ── Atomic symlink swap ───────────────────────────────────────────────────────
log "Activating rollback release: $TARGET_RELEASE"
ln -snf "$TARGET_DIR" "$DEPLOY_BASE/_rollback_ptr"
mv -fT "$DEPLOY_BASE/_rollback_ptr" "$CURRENT_LINK"
echo "$TARGET_RELEASE"  > "$DEPLOY_BASE/CURRENT_RELEASE"
echo "$CURRENT_RELEASE" > "$DEPLOY_BASE/PREVIOUS_RELEASE"

# ── Disable maintenance mode on the restored release ─────────────────────────
log "Disabling maintenance mode..."
"$PHP" "$CURRENT_LINK/artisan" up \
    || fail "artisan up failed on rollback release. Check VPS — app is at: $TARGET_DIR"

# ── Restart services (same order as deploy.sh) ───────────────────────────────
log "Reloading PHP-FPM..."
sudo systemctl reload php8.3-fpm

log "Restarting Reverb..."
sudo supervisorctl restart laravel-reverb

log "Signalling queue workers to restart..."
"$PHP" "$CURRENT_LINK/artisan" queue:restart

# ── Health check (same retry policy as deploy.sh) ────────────────────────────
log "Running health check: $APP_URL/up"
max_attempts=6
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -sf --max-time 5 "$APP_URL/up" > /dev/null 2>&1; then
        log "Health check passed (attempt $attempt/$max_attempts)."
        break
    fi
    if [ "$attempt" -eq "$max_attempts" ]; then
        fail "Health check failed after $max_attempts attempts. Manual intervention required. App is at: $TARGET_DIR"
    fi
    log "Attempt $attempt/$max_attempts failed. Retrying in 5s..."
    sleep 5
    attempt=$((attempt + 1))
done

# ── Record rollback ───────────────────────────────────────────────────────────
echo "ROLLBACK: $TARGET_RELEASE (from $CURRENT_RELEASE) at $(date -u '+%Y-%m-%d %H:%M:%S UTC')" \
    >> "$DEPLOY_BASE/DEPLOY_LOG"

log "Rollback complete. Production is now running: $TARGET_RELEASE"
