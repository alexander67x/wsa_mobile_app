#!/usr/bin/env bash
set -euo pipefail

PROFILE=${EAS_BUILD_PROFILE:-${1:-preview}}
if [ "$#" -gt 0 ]; then
  shift
fi
EXTRA_ARGS=("$@")
OUTPUT_DIR=${EAS_OUTPUT_DIR:-./build-artifacts}
ARTIFACT_PATH="$OUTPUT_DIR/app-$PROFILE.aab"

mkdir -p "$OUTPUT_DIR"

echo "Running EAS local Android build (profile: $PROFILE)"
eas build \
  --platform android \
  --profile "$PROFILE" \
  --local \
  --non-interactive \
  --output "$ARTIFACT_PATH" \
  --docker \
  "${EXTRA_ARGS[@]}"
