# 1. Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The QURAN_* variables are NOT needed here: pages are rendered per request (see
# `export const instant = false` in src/app) instead of prerendered at build time, so
# building the image needs no network access to any Qur'an data source.
RUN npm run build

# 3. Runtime (standalone output Next.js — minim dependency)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Optionally point the data sources to your own mirrors (see the README), for example:
#   docker run -e QURAN_API_URL=https://your-host/api/v2 -e QURAN_FAWAZ_URL=https://your-host/quran-api ...
CMD ["node", "server.js"]
