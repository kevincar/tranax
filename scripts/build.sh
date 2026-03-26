#!/bin/zsh

set -euo pipefail

MANIFEST_PATH="TranAx Extension/Resources/manifest.json"

current_version=$(perl -ne 'print "$1\n" if /"version"\s*:\s*"([^"]+)"/' "$MANIFEST_PATH")

if [[ -z "$current_version" ]]; then
  echo "Unable to read extension version from $MANIFEST_PATH" >&2
  exit 1
fi

if [[ "$current_version" =~ ^(.*)-rc([0-9]{4})$ ]]; then
  base_version="${match[1]}"
  rc_number="${match[2]}"
  next_version="${base_version}-rc$(printf '%04d' $((10#$rc_number + 1)))"
else
  next_version="${current_version}-rc0001"
fi

NEXT_VERSION="$next_version" perl -0pi -e 's/("version"\s*:\s*")[^"]+(")/$1 . $ENV{NEXT_VERSION} . $2/ge' "$MANIFEST_PATH"

echo "Updated extension manifest version: $current_version -> $next_version"

xcodebuild -project TranAx.xcodeproj \
           -scheme "TranAx" \
           -configuration Release \
           -derivedDataPath build/
