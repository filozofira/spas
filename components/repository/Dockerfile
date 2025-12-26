# Build stage
FROM node:20-alpine AS builder

# Build context is expected to be the `components/` directory
WORKDIR /app/repository
COPY repository/package*.json ./
RUN npm ci

COPY repository/tsconfig.json ./
COPY repository/src ./src
RUN npm run build

# Copy non-TypeScript files (SQL schemas) to dist
RUN cp src/storage/schema.sql dist/storage/

# Copy JSON schemas for validation (canonical location)
WORKDIR /app
COPY schemas ./schemas

# Runtime stage
FROM node:20-alpine

WORKDIR /app/repository
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY --from=builder /app/repository/node_modules ./node_modules
COPY --from=builder /app/repository/dist ./dist
COPY --from=builder /app/repository/package*.json ./
COPY --from=builder /app/schemas /app/schemas

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["node", "dist/index.js"]
