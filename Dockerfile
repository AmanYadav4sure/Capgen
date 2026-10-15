# syntax=docker/dockerfile:1.7

############################################################
# Base — shared Node toolchain settings
############################################################
FROM node:22-alpine AS base
WORKDIR /app

# No build-time telemetry, no Playwright browser downloads in the image
# (install them on demand: docker compose run --rm dev npx playwright install chromium)
ENV NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN apk add --no-cache libc6-compat

############################################################
# deps — install once, reused by every later stage
############################################################
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

############################################################
# dev — hot-reload development server (source is bind-mounted)
############################################################
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=development \
    PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]

############################################################
# builder — production bundle
############################################################
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time,
# so they must be present here (they are not secrets — see DOCKER.md).
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm run build

############################################################
# runner — production runtime (small: prod deps only)
############################################################
FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --chown during COPY instead of a recursive chown: the runtime user only
# needs write access to .next (image optimizer / ISR cache), and a recursive
# chown over node_modules costs minutes on Windows filesystems.
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
USER node

EXPOSE 3000
CMD ["npx", "next", "start"]
