#!/bin/bash
# money-dumb — Local Development Entry Script
# Runs Next.js with secrets injected in-memory via Doppler.

set -e

echo "=== Starting money-dumb Local Environment ==="

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies..."
  npm install
fi

if command -v doppler >/dev/null 2>&1; then
  echo "Launching Next.js on http://localhost:3000 via Doppler (dev)..."
  exec doppler --no-check-version run -- npm run dev
else
  echo "Warning: Doppler CLI not found. Falling back to local environment..."
  exec npm run dev
fi
