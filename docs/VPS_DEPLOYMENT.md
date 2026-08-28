# VPS Deployment

Living document — if you change the Compose stack, Nginx config, or deploy
flow, update this file in the same change.

## Stack

Docker Compose, project name **`meme-store`** (always pass `-p meme-store`
so `up`/`down` never touch other projects on the box):

| Service | Role |
|---|---|
| `app` | Next.js standalone build (`Dockerfile`, target `runner`) |
| `migrate` | One-off Drizzle migration runner (`Dockerfile`, target `migrate`) — never a long-running service, always `run --rm` |
| `postgres` | `postgres:16-alpine`, this project's own database only |
| `redis` | `redis:7-alpine`, AOF persistence on |
| `minio` | Object storage — buckets `products`, `homepage`, `returns` |
| `nginx` | Reverse proxy + TLS — the only service publishing host ports |
| `certbot` | On-demand cert issuance/renewal, `run --rm` only |

Only `nginx` binds to the host (80/443). Everything else is reachable
solely on the internal `meme_net` Docker network. This matters because the
VPS is **shared with other projects** — `postgres`/`redis`/`minio` here
must never be exposed publicly or confused with anything else already
running on the box (it currently also runs `amar-site` via PM2 + its own
system-wide Postgres/Redis on ports 5432/6379 — those are NOT this
project's; this stack's Postgres/Redis are separate containers on
different effective ports since only `nginx` is host-exposed at all).

## First-time setup on the VPS

```bash
# 1. Clone into an isolated directory — never share a path with another project
mkdir -p ~/apps/meme-store && cd ~/apps/meme-store
git clone <repo-url> .

# 2. Create the real .env (copy .env.example, fill in real secrets)
cp .env.example .env
nano .env   # DATABASE_URL is ignored by docker-compose.yml in prod (it builds
            # its own from POSTGRES_*) — everything else must be real values.

# 3. Bring up the data services first (no app/nginx yet — nginx needs a
#    cert before it can start, see below)
docker compose -p meme-store up -d postgres redis minio

# 4. Run the initial migration
docker compose -p meme-store run --rm migrate
```

### Bootstrapping the TLS certificate (chicken-and-egg)

Nginx as configured needs a cert to start its `:443` block, but Certbot's
webroot method needs Nginx serving `:80` first. Bootstrap once:

```bash
# Temporarily comment out the `ssl_certificate*` lines and the whole HTTPS
# server block in deploy/nginx/meme-store.conf, then:
docker compose -p meme-store up -d app nginx

# Issue the cert (replace domain + email):
docker compose -p meme-store run --rm certbot certonly --webroot \
  -w /var/www/certbot -d meme-eg.store -d www.meme-eg.store \
  --email you@example.com --agree-tos --no-eff-email

# Restore the HTTPS server block in meme-store.conf, then:
docker compose -p meme-store restart nginx
```

After this, `deploy/deploy.sh` and normal deploys never need to touch
certs again — renewal is handled by the cron entry below.

### Cert renewal (cron on the host, not in a container)

```bash
# crontab -e
0 3 * * * cd ~/apps/meme-store && docker compose -p meme-store run --rm certbot renew --quiet && docker compose -p meme-store exec nginx nginx -s reload
```

## DNS cutover (GoDaddy)

The domain currently points at Vercel. Once the stack above is verified
working (test by hitting the bare VPS IP with a `Host` header, or a
staging subdomain first):

1. In GoDaddy DNS, change the A record to the VPS IP (`57.131.148.26`).
2. Wait for propagation, then verify `https://meme-eg.store` serves the
   VPS, not Vercel.
3. Update the Stripe webhook endpoint URL and the Google OAuth authorized
   redirect URI (`https://meme-eg.store/auth/callback`) to the real
   domain — see `docs/MIGRATION_RUNBOOK.md` for the full cutover checklist,
   including disabling the old Vercel deployment's Stripe webhook so two
   databases never receive the same event.

## Continuous deploy via GitHub Actions

`.github/workflows/deploy.yml` SSHes into the VPS on every push to `main`
and runs `deploy/deploy.sh` there — the **VPS pulls from GitHub itself**;
GitHub Actions never builds or pushes an image, so no registry credentials
are needed.

### One-time setup

1. **Generate a deploy-only SSH keypair** (do not reuse your personal/admin
   key):
   ```bash
   ssh-keygen -t ed25519 -f meme-store-deploy-key -N ""
   ```
2. On the VPS, add the **public** key to `~/.ssh/authorized_keys` for the
   `ubuntu` user (or a dedicated lower-privilege deploy user, if you set
   one up later).
3. In the GitHub repo: **Settings → Secrets and variables → Actions**, add:
   - `VPS_HOST` — `57.131.148.26`
   - `VPS_USER` — `ubuntu`
   - `VPS_SSH_KEY` — the **private** key contents from step 1
   - `VPS_APP_DIR` — `/home/ubuntu/apps/meme-store`
4. Push to `main` — the Actions tab should show the deploy workflow run,
   which SSHes in and runs `deploy/deploy.sh`.

### Manual deploy (no GitHub Actions needed)

SSH in and run `bash deploy/deploy.sh` directly from the app directory —
identical to what CI does, useful for a first deploy or a manual rollback.

## Rollback

```bash
cd ~/apps/meme-store
git log --oneline -5        # find the last-good commit
git checkout <commit-sha>
bash deploy/deploy.sh
```

Rolling back does **not** automatically roll back a migration that already
ran. If the bad deploy included a schema migration, that needs a manual
`drizzle-kit` down-migration or a manual SQL fix first — Drizzle migrations
are forward-only by default.

## Logs

```bash
docker compose -p meme-store logs -f app
docker compose -p meme-store logs -f nginx
docker compose -p meme-store logs --tail=200 postgres
```

## Backup

`meme_pg_data` and `meme_minio_data` hold real customer/order/image data.

```bash
# Postgres dump
docker compose -p meme-store exec -T postgres pg_dump -U meme meme | gzip > backup-$(date +%F).sql.gz

# MinIO — mirror to a local directory (or another bucket/remote) via mc
docker compose -p meme-store exec minio mc mirror /data /backup-target
```

Automate both via host cron, store off-box (not just on the same VPS disk).

## Restore

```bash
gunzip -c backup-2026-XX-XX.sql.gz | docker compose -p meme-store exec -T postgres psql -U meme meme
```
