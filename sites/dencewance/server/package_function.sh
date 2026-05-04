#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./package_function.sh ../functions/health
# Produces function.zip at workspace root (or function folder)

FUNCTION_DIR=${1:-"../functions/health"}
OUT_ZIP="$(basename "$FUNCTION_DIR").zip"

echo "Packaging function from $FUNCTION_DIR -> $OUT_ZIP"
cd "$(dirname "$0")/.." || exit 1
if [ ! -d "$FUNCTION_DIR" ]; then
  echo "Function directory not found: $FUNCTION_DIR" >&2
  exit 2
fi

rm -f "$OUT_ZIP"
zip -r "$OUT_ZIP" "$FUNCTION_DIR" -x "*/node_modules/*"
echo "Created $OUT_ZIP"
