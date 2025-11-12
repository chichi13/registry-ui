# syntax=docker/dockerfile:1

# Base stage with common workdir
FROM docker.io/oven/bun:1 AS base
WORKDIR /usr/src/app

# Dependencies installation with cache mount
FROM base AS deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Production release
FROM docker.io/node:22-alpine AS release
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/.output ./

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server/index.mjs"]
