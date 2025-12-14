# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source files
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S sidecar && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G sidecar sidecar && \
    chown -R sidecar:sidecar /app

USER sidecar

# Default environment variables
ENV NODE_ENV=production
ENV SIDECAR_PORT=7000
ENV CONFIG_PATH=/app/config.json

# Expose sidecar port
EXPOSE 7000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7000/health || exit 1

# Start sidecar
CMD ["node", "dist/index.js"]
