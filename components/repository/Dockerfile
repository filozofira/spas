# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Copy non-TypeScript files (SQL schemas) to dist
RUN cp src/storage/schema.sql dist/storage/

# Copy JSON schemas for validation
COPY schemas ./schemas

# Runtime stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schemas ./schemas
COPY --from=builder /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["node", "dist/index.js"]
