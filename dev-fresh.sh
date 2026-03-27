#!/bin/sh
set -e

echo "▶  Liberando puertos 3000 y 5173..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

echo "▶  Bajando contenedores y borrando volúmenes..."
docker compose down -v

echo "▶  Levantando base de datos..."
docker compose up db -d

echo "▶  Esperando que la db esté lista..."
until docker compose exec db pg_isready -U crm_user -d crm_db > /dev/null 2>&1; do
  sleep 1
done

echo "▶  Migraciones y provisioning..."
npm run provision --workspace=backend

echo "▶  Arrancando backend y frontend..."
npm run dev --workspace=backend &
npm run dev --workspace=frontend &

wait
