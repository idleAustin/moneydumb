# -------------------------------------------------------------
# Stage 1: Application Builder
# -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install native build tools required by better-sqlite3 on Alpine
RUN apk add --no-cache python3 make g++

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build Next.js standalone bundle
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Minimal Production Runtime (Non-Root)
# -------------------------------------------------------------
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
EXPOSE 8080

# Copy compiled Next.js standalone artifacts owned by non-root node user
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/app/lib/schema-sqlite.sql ./app/lib/schema-sqlite.sql
COPY --chown=node:node --from=builder /app/app/lib/schema-postgres.sql ./app/lib/schema-postgres.sql

# Drop root privileges
USER node

# Run standalone Next.js server
CMD ["node", "server.js"]

