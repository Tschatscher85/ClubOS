# ============================================================
# Vereinbase Frontend - Multi-Stage Docker Build (Next.js Standalone)
# ============================================================

# ==================== Dependencies ====================
FROM node:20-alpine AS deps

WORKDIR /app

# Root package.json und workspace configs
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.base.json ./

# Workspace package.json Dateien
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Dependencies installieren
RUN npm ci

# ==================== Build-Stage ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies aus vorheriger Stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Konfigurationsdateien
COPY package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Source-Code kopieren
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

# Shared Package bauen
RUN npm run build --workspace=packages/shared

# Build-Argumente fuer Next.js (zur Build-Zeit benoetigt)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV DOCKER_BUILD=1

# Frontend bauen (standalone output via DOCKER_BUILD=1)
RUN npm run build --workspace=apps/frontend

# ==================== Production-Stage ====================
FROM node:20-alpine AS production

# Sicherheitsrelevante Pakete
RUN apk --no-cache add wget

WORKDIR /app

# Nicht-Root-Benutzer erstellen
RUN addgroup --system --gid 1001 vereinbase && \
    adduser --system --uid 1001 vereinbase

# Next.js Standalone-Output kopieren
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Dateiberechtigungen setzen
RUN chown -R vereinbase:vereinbase /app

# Als Nicht-Root-Benutzer ausfuehren
USER vereinbase

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3000 || exit 1

CMD ["node", "apps/frontend/server.js"]
