#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
  echo "[start] node_modules not found, running npm install..."
  npm install
fi

echo "[start] starting backend..."
npm start