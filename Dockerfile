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
# QURAN_API_URL TIDAK dibutuhkan di sini: halaman di-render per-request
# (lihat `export const instant = false` di src/app), bukan di-prerender
# saat build, jadi build image tidak perlu akses jaringan ke API Qur'an.
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

# Set QURAN_API_URL ke instance self-hosted Anda (lihat README),
# contoh: docker run -e QURAN_API_URL=https://nama-instance-anda.vercel.app ...
CMD ["node", "server.js"]
