#!/bin/bash
cd "$(dirname "$0")" || exit 1
fail() { echo; echo "BUILD FAILED. Keep the error messages above."; read -n 1 -s -r -p "Press any key to close..."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js 22+ not found. Install Node.js LTS from nodejs.org."; fail; }
node -v; npm -v || fail
[ -f package.json ] || { echo "ERROR: package.json missing."; fail; }
[ -f source.html ] || { echo "ERROR: source.html missing."; fail; }
command -v xcodebuild >/dev/null 2>&1 || { echo "ERROR: Xcode not found. Install Xcode 26+ from the App Store, open it once, accept the license."; fail; }
xcodebuild -version
echo "[1/4] Installing dependencies..."; npm install || fail
echo "[2/4] Preparing local assets..."; node assets.cjs || fail
echo "[3/4] Creating/syncing iOS project (Swift Package Manager)..."
[ -d ios ] || npx cap add ios || fail
npx cap sync ios || fail
echo "[4/4] Opening Xcode. In Xcode: select target App > Signing & Capabilities > pick your Team, choose your iPad, press Run."
npx cap open ios
read -n 1 -s -r -p "Press any key to close..."; exit 0
