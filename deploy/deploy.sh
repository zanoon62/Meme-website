#!/usr/bin/env bash
# Deploy script — run ON THE VPS, from the project directory
# (e.g. /home/ubuntu/apps/meme-store). Invoked by hand or by the
# GitHub Actions workflow (.github/workflows/deploy.yml) over SSH.
#
# Always uses -p meme-store so this never touches another project's
# containers on the shared box.

set -euo pipefail

COMPOSE="docker compose -p meme-store"
HEALTH_URL="http://127.0.0.1:3001/api/health" # published to the host, checked directly (no wget inside the alpine image)

echo "==> git pull"
git pull --ff-only

echo "==> build app + migrate + realtime images"
$COMPOSE build app migrate realtime

echo "==> ensure postgres/redis/minio are up"
$COMPOSE up -d postgres redis minio

echo "==> waiting for postgres to be healthy"
until $COMPOSE ps postgres | grep -q "healthy"; do sleep 2; done

echo "==> running database migrations"
$COMPOSE run --rm migrate

echo "==> deploying new app container"
$COMPOSE up -d app

APP_HEALTHY=0
for i in $(seq 1 30); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "==> app is healthy"
    APP_HEALTHY=1
    break
  fi
  sleep 2
done

if [ "$APP_HEALTHY" -ne 1 ]; then
  echo "!! app did not become healthy in time — check logs:"
  echo "   $COMPOSE logs --tail=100 app"
  exit 1
fi

# realtime is best-effort — a broken/slow realtime service must never fail
# the whole deploy or roll back an already-healthy app. No exit-1 here.
echo "==> deploying realtime service (best-effort, non-blocking)"
$COMPOSE up -d realtime || echo "!! realtime failed to start — check: $COMPOSE logs --tail=100 realtime"

exit 0
