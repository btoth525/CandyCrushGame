#!/usr/bin/env bash
# Build a debug APK for Charles & Brandon's Wizarding World of Nuts.
#
# Requirements (one-time setup):
#   - Node.js 18+ and npm
#   - Java 17 (e.g.  brew install temurin@17  or  apt install openjdk-17-jdk)
#   - Android Studio (for the Android SDK + platform-tools)
#   - $ANDROID_HOME pointing at your SDK (Android Studio > Settings > Languages & Frameworks > Android SDK)
#
# Usage:
#   bash scripts/build-android.sh
#
# Output:
#   android/app/build/outputs/apk/debug/app-debug.apk

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d node_modules ]; then
  echo ">> Installing JS dependencies..."
  npm install
fi

if [ ! -d android ]; then
  echo ">> Adding Android platform (first-time setup)..."
  npx cap add android
fi

echo ">> Syncing web assets into the Android project..."
npx cap sync android

echo ">> Building debug APK with Gradle..."
cd android
./gradlew assembleDebug

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  echo ""
  echo "================================================================"
  echo " APK built successfully:"
  echo "   $APK"
  echo " Sideload onto a device with:"
  echo "   adb install -r \"$APK\""
  echo "================================================================"
else
  echo "Build appears to have failed -- APK not found at expected path." >&2
  exit 1
fi
