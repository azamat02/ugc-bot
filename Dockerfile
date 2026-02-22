# --- Stage 1: Build admin panel ---
FROM node:20-alpine AS frontend
WORKDIR /app/admin-panel
COPY admin-panel/package.json admin-panel/package-lock.json ./
RUN npm ci
COPY admin-panel/ ./
RUN npm run build

# --- Stage 2: Build backend ---
FROM node:20-alpine AS backend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npx prisma generate
RUN npm run build

# --- Stage 3: Production ---
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY --from=backend /app/dist ./dist
COPY --from=frontend /app/admin-panel/dist ./admin-panel/dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
