#!/bin/bash
cd "$(dirname "$0")" || exit 1
fail() { echo; echo "BUILD FAILED. Keep the error messages above."; read -n 1 -s -r -p "Press any key to close..."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js 22+ not found. Install Node.js LTS from nodejs.org."; fail; }
node -v; npm -v || fail
[ -f package.json ] || { echo "ERROR: package.json missing."; fail; }
[ -f source.html ] || { echo "ERROR: source.html missing."; fail; }
ARCH="${1:-$(uname -m)}"
case "$ARCH" in arm64|aarch64) ARCH=arm64;; x86_64|x64) ARCH=x64;; *) echo "Unknown arch: $ARCH"; fail;; esac
echo "Target arch: $ARCH"
echo "[1/4] Installing dependencies..."; npm install || fail
echo "[2/4] Preparing local assets..."; node assets.cjs || fail
echo "[3/4] Building macOS $ARCH dmg and zip..."
./node_modules/.bin/electron-builder --mac --$ARCH
RC=$?; echo "electron-builder exit code: $RC"; [ $RC -eq 0 ] || fail
echo "[4/4] SUCCESS. Check the release folder."; open release 2>/dev/null
read -n 1 -s -r -p "Press any key to close..."; exit 0
