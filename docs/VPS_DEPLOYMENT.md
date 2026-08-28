# VPS Deployment

Living document — if you change the Compose stack, Nginx config, or deploy
flow, update this file in the same change.

## Stack

Docker Compose, project name **`meme-store`** (always pass `-p meme-store`
so `up`/`down` never touch other projects on the box):

| Service | Role |
|---|---|
| `app` | Next.js standalone build (`Dockerfile`, target `runner`) — published to `127.0.0.1:3001` only |
| `migrate` | One-off Drizzle migration runner (`Dockerfile`, target `migrate`) — never a long-running service, always `run --rm` |
| `postgres` | `postgres:16-alpine`, this project's own database only, internal network only |
| `redis` | `redis:7-alpine`, AOF persistence on, internal network only |
| `minio` | Object storage (`products`, `homepage`, `returns` buckets) — published to `127.0.0.1:9002` only |

**No Docker Nginx or Docker certbot in this project.** The VPS already runs
a shared, system-wide Nginx in front of another project (`amar-site`),
which owns host ports 80/443 — a second Nginx in Docker can't also bind
them. Instead:
- `app`/`minio` publish to **127.0.0.1-only** host ports (not `0.0.0.0`) —
  reachable from the host's own Nginx, never directly from the internet.
- The **system** Nginx gets a new, separate site file
  (`deploy/nginx/meme-eg.store`, installed at
  `/etc/nginx/sites-available/meme-eg.store`) that reverse-proxies to
  those ports — installed *alongside*, never replacing, the
  `amarel7ewety.com` site file already there.
- TLS is issued via the **system** `certbot` (already installed on the
  box, v4.0.0) — not a Docker certbot.

`postgres`/`redis` stay on the internal `meme_net` Docker network only —
this project's own containers, never confused with (or exposed like) the
box's separate system-wide Postgres/Redis that `amar-site` uses on its own
ports.

## First-time setup on the VPS

```bash
# 1. Clone into an isolated directory — never share a path with another project
mkdir -p ~/apps/meme-store && cd ~/apps/meme-store
git clone <repo-url> .

# 2. Create the real .env (copy .env.example, fill in real secrets)
cp .env.example .env
nano .env   # DATABASE_URL is ignored by docker-compose.yml in prod (it builds
            # its own from POSTGRES_*) — everything else must be real values.

# 3. Bring up app + data services (app starts fine before Nginx/TLS exist —
#    it's just not reachable from the internet yet)
docker compose -p meme-store up -d postgres redis minio

# 4. Run the initial migration
docker compose -p meme-store run --rm migrate

# 5. Build and start the app (published to 127.0.0.1:3001 only)
docker compose -p meme-store up -d app
```

### Wiring up the shared system Nginx + TLS bootstrap (chicken-and-egg)

The system Nginx needs a cert to serve `:443`, but Certbot's webroot method
needs Nginx serving `:80` for this domain first. Bootstrap once:

```bash
# 1. Install an HTTP-only version of the site first (no ssl_certificate
#    lines yet — copy deploy/nginx/meme-eg.store but strip the second
#    `server { listen 443 ssl; ... }` block down to just the ACME
#    challenge + a 301 redirect, matching what the real file already has
#    for the :80 block — that part alone is enough to bootstrap):
sudo cp deploy/nginx/meme-eg.store /etc/nginx/sites-available/meme-eg.store
# (edit out the :443 server block for this first pass, or just proceed —
#  nginx -t will only complain if the referenced cert files don't exist)
sudo ln -sf /etc/nginx/sites-available/meme-eg.store /etc/nginx/sites-enabled/meme-eg.store
sudo nginx -t && sudo systemctl reload nginx

# 2. Issue the cert via webroot (matches the /.well-known/acme-challenge/
#    location already in the site file):
sudo certbot certonly --webroot -w /var/www/certbot \
  -d meme-eg.store -d www.meme-eg.store \
  --email you@example.com --agree-tos --no-eff-email

# 3. Re-install the FULL deploy/nginx/meme-eg.store (with the :443 block)
#    now that the cert exists, then reload:
sudo cp deploy/nginx/meme-eg.store /etc/nginx/sites-available/meme-eg.store
sudo nginx -t && sudo systemctl reload nginx
```

After this, `deploy/deploy.sh` never needs to touch Nginx or certs again —
the app container always publishes to the same `127.0.0.1:3001`, so a
redeploy just replaces the container behind the same Nginx proxy target.
Renewal is handled by the cron entry below.

### Cert renewal (system cron, not a container)

```bash
# crontab -e (root, or ubuntu with sudo)
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

This renews every cert on the box (including `amarel7ewety.com`'s, if it's
also on certbot) — that's fine, certbot only touches domains that are
actually due for renewal, and reloading Nginx is harmless/instant for all
sites.

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
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
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
