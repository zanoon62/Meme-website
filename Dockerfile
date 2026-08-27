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
