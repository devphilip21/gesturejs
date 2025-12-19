#!/bin/bash

# Clean all node_modules and dist directories to simulate CI environment

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Cleaning node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "Cleaning dist directories..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "Done! Run 'pnpm install' to reinstall dependencies."
