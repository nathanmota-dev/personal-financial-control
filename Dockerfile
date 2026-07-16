# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json ./
# drizzle-kit and Vitest expose optional peer dependencies that are not needed
# by the production server but otherwise make npm 10 reject this lockfile.
RUN npm ci --legacy-peer-deps

FROM base AS prod-deps

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:/app/.local/personal-finance.db

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./migrate.mjs
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

RUN mkdir -p /app/.local \
  && chown nextjs:nodejs /app/.local

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node migrate.mjs && node server.js"]
