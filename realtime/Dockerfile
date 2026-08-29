# Standalone service — Socket.io + Redis pub/sub bridge. Separate from the
# main app's Dockerfile so a realtime bug/crash never affects the
# storefront/checkout/admin API. Reuses the SAME root package.json
# (drizzle-orm, postgres, ioredis, socket.io are all already dependencies
# there) rather than maintaining a second dependency tree, and imports
# session-core.ts / db/client.ts / db/schema directly from ../src via
# relative paths — no path-alias resolution needed at runtime.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 realtime

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
COPY realtime ./realtime

USER realtime
EXPOSE 4001

CMD ["npx", "tsx", "realtime/server.ts"]
