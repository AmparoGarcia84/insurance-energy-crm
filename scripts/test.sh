#!/usr/bin/env sh
set -e

docker compose run --rm --no-deps --build \
  --entrypoint "npm run test:coverage" \
  frontend
