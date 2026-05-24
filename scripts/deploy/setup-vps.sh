#!/usr/bin/env bash
# =============================================================================
# One-time VPS setup: migrates from the current flat deployment structure
# (/var/www/opticoresolutionsltd) to a release-based layout.
#
# Run this ONCE on the VPS as the deploy user (the user the self-hosted runner
# runs as, e.g. ubuntu or deployer).
#
# After this runs, point nginx to /var/www/opticore/current/public
# =============================================================================
set -euo pipefail

OLD_DIR="/var/www/opticoresolutionsltd"
DEPLOY_BASE="/var/www/opticore"
RELEASES_DIR="$DEPLOY_BASE/releases"
SHARED_DIR="$DEPLOY_BASE/shared"
CURRENT_LINK="$DEPLOY_BASE/current"
INITIAL_RELEASE="$RELEASES_DIR/initial"

echo "==> Setting up release-based deployment structure..."

# 1. Create directories
mkdir -p "$RELEASES_DIR"
mkdir -p "$SHARED_DIR"

# 2. Move the existing app as the "initial" release so there is always something
#    to roll back to and so uploads/storage are preserved.
if [ -d "$OLD_DIR" ] && [ ! -d "$INITIAL_RELEASE" ]; then
    echo "==> Copying current app to initial release..."
    cp -a "$OLD_DIR" "$INITIAL_RELEASE"
fi

# 3. Move shared storage out of the release into the shared directory.
if [ -d "$INITIAL_RELEASE/storage" ] && [ ! -d "$SHARED_DIR/storage" ]; then
    echo "==> Moving storage to shared directory..."
    mv "$INITIAL_RELEASE/storage" "$SHARED_DIR/storage"
fi

# 4. Create the shared .env if it doesn't exist
if [ ! -f "$SHARED_DIR/.env" ] && [ -f "$INITIAL_RELEASE/.env" ]; then
    echo "==> Moving .env to shared directory..."
    cp "$INITIAL_RELEASE/.env" "$SHARED_DIR/.env"
fi

# 5. Symlink storage back into the initial release so it still works
ln -sfn "$SHARED_DIR/storage" "$INITIAL_RELEASE/storage"
ln -sfn "$SHARED_DIR/.env"    "$INITIAL_RELEASE/.env"

# 6. Create the current symlink pointing to the initial release
ln -sfn "$INITIAL_RELEASE" "$CURRENT_LINK"

# 7. Create the CURRENT_RELEASE tracking file
echo "initial" > "$DEPLOY_BASE/CURRENT_RELEASE"

echo ""
echo "==> Done. Directory structure:"
echo ""
echo "    $DEPLOY_BASE/"
echo "    ├── current -> $INITIAL_RELEASE"
echo "    ├── releases/"
echo "    │   └── initial/"
echo "    └── shared/"
echo "        ├── .env"
echo "        └── storage/"
echo ""
echo "==> NEXT STEP: Update your nginx config to serve from:"
echo "    $CURRENT_LINK/public"
echo ""
echo "    Example nginx root directive:"
echo "    root $CURRENT_LINK/public;"
echo ""
echo "==> Then reload nginx: sudo systemctl reload nginx"
