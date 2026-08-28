# Multi-stage build for the standalone Next.js output.
# Node throughout (not Bun) for the runtime stage — this handles live
# payments and Next's official standalone Docker pattern targets Node,
# so we avoid taking on Bun-runtime-compatibility risk for that code path.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `next build` executes route modules during page-data collection (not just
# imports them), so src/lib/db/client.ts's eager DATABASE_URL check needs
# *something* syntactically valid here even though nothing actually
# connects at build time — the real value comes from docker-compose.yml at
# container runtime. NEXT_PUBLIC_* vars are different: they get inlined
# into the client bundle at build time, so this one needs the real value.
ARG NEXT_PUBLIC_SITE_URL="https://meme-eg.store"
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
# next.config.ts reads MINIO_PUBLIC_URL to build next/image's remotePatterns
# allowlist — that happens at `next build` time and gets compiled into the
# standalone output, so the runtime env var from docker-compose.yml is too
# late: without this, every MinIO-hosted product image 404s through
# next/image with "hostname not configured" and silently renders blank.
ARG MINIO_PUBLIC_URL="https://meme-eg.store/media"
ENV MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL}
ENV DATABASE_URL="postgres://build:build@localhost:5432/build"
RUN npm run build

# Separate stage for running Drizzle migrations — the `runner` stage below
# only ships production deps (Next's standalone output), so drizzle-kit
# (a devDependency) isn't there. This stage reuses the full `builder`
# image instead. Invoked via `docker compose run --rm migrate` from
# deploy.sh, never as a long-running service.
FROM builder AS migrate
CMD ["npx", "drizzle-kit", "migrate"]

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
