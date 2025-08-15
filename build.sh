#!/bin/bash
set -e

echo "Building Denshimon..."

# Build frontend
echo "Building frontend..."
cd frontend
pnpm install
pnpm run build

# Copy frontend build to backend for embedding
echo "Copying SPA assets..."
cd ../backend
rm -rf cmd/server/spa
cp -r ../frontend/dist cmd/server/spa

# Build Go binary with embedded SPA
echo "Building backend with embedded SPA..."
go build -o denshimon cmd/server/main.go

echo "Build complete! Single binary: backend/denshimon"