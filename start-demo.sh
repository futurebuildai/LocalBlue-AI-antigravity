#!/bin/bash
set -e

echo "=== Demo Start Script ==="

# Push schema to database
echo "Running db:push..."
npx drizzle-kit push 2>&1 || echo "db:push completed (may have warnings)"

# Seed demo data (idempotent — skips if already seeded)
echo "Running seed..."
npx tsx server/seed-shade-roofing.ts 2>&1 || echo "Seed completed (may already exist)"

# Start the server
echo "Starting server..."
NODE_ENV=production node dist/index.cjs
