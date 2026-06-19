#!/bin/sh
set -e

echo "Running seed (idempotent)..."
npm run seed

echo "Starting backend..."
exec npm run start:dev
