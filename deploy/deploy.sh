#!/usr/bin/env bash
# Deploy script — run ON THE VPS, from the project directory
# (e.g. /home/ubuntu/apps/meme-store). Invoked by hand or by the
# GitHub Actions workflow (.github/workflows/deploy.yml) over SSH.
#
# Always uses -p meme-store so this never touches another project's
# containers on the shared box.

set -euo pipefail

COMPOSE="docker compose -p meme-store"
HEALTH_URL="http://localhost:3000/api/health" # checked from inside the app container's network via docker exec below

echo "==> git pull"
git pull --ff-only

echo "==> build app + migrate images"
$COMPOSE build app migrate

echo "==> ensure postgres/redis/minio are up"
$COMPOSE up -d postgres redis minio

echo "==> waiting for postgres to be healthy"
until $COMPOSE ps postgres | grep -q "healthy"; do sleep 2; done

echo "==> running database migrations"
$COMPOSE run --rm migrate

echo "==> deploying new app container"
$COMPOSE up -d app

echo "==> waiting for app health check"
for i in $(seq 1 30); do
  if $COMPOSE exec -T app wget -qO- "$HEALTH_URL" >/dev/null 2>&1; then
    echo "==> app is healthy"
    exit 0
  fi
  sleep 2
done

echo "!! app did not become healthy in time — check logs:"
echo "   $COMPOSE logs --tail=100 app"
exit 1
