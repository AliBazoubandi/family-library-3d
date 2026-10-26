# ========================================================
# Stage 1: Build Frontend Assets
# ========================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build static production bundle
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Produces production distribution into /app/pb_public
RUN npm run build

# ========================================================
# Stage 2: PocketBase All-in-One Linux Server
# ========================================================
FROM alpine:3.19 AS runner

ARG PB_VERSION=0.40.6
ENV PB_VERSION=${PB_VERSION}

# Install essential runtime tools
RUN apk add --no-cache \
    ca-certificates \
    curl \
    unzip \
    tzdata

WORKDIR /app

# Download official PocketBase Linux AMD64 binary
RUN curl -fsSL -o /tmp/pocketbase.zip \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    && unzip /tmp/pocketbase.zip -d /app \
    && rm /tmp/pocketbase.zip \
    && chmod +x /app/pocketbase

# Copy database migrations
COPY pb_migrations ./pb_migrations

# Copy static frontend SPA from Stage 1 into PocketBase public directory
COPY --from=frontend-builder /app/pb_public ./pb_public

# Persistent volume for SQLite database and uploaded files
VOLUME ["/pb_data"]

# PocketBase default web port
EXPOSE 8090

# Entrypoint script: auto-applies migrations on launch, then starts web server
CMD ["sh", "-c", "/app/pocketbase migrate up --dir=/pb_data --migrationsDir=/app/pb_migrations && exec /app/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data --publicDir=/app/pb_public --migrationsDir=/app/pb_migrations"]
