#!/bin/sh
# entrypoint.sh — Docker startup script for the CRM backend
#
# set -e: any command that exits non-zero immediately stops the script,
# so a failed migration or failed provisioning is never silently swallowed.
set -e

echo "▶  Running database migrations..."
npx prisma migrate deploy

echo "▶  Provisioning database (idempotent)..."
npx tsx db_provision/provision.ts

echo "▶  Starting server..."
exec npx tsx src/index.ts
