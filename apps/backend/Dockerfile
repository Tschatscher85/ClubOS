# ==================== Build-Stage ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Root package.json und workspace configs
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.base.json ./

# Workspace package.json Dateien
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Dependencies installieren
RUN npm install

# Source-Code kopieren
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

# Shared Package bauen
RUN npm run build --workspace=packages/shared

# Prisma Client generieren
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Backend bauen
RUN npm run build --workspace=apps/backend

# ==================== Production-Stage ====================
FROM node:20-alpine AS production

WORKDIR /app

# Nur Production-Dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN npm install --omit=dev

# Prisma Schema und Client kopieren
COPY apps/backend/prisma/ ./apps/backend/prisma/
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build-Artefakte kopieren
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/backend/dist/main.js"]
