# Contributing to SPAS Sidecar

Guide for developers working on the Sidecar implementation itself (the sidecar is typically started via generated Docker Compose; see [README.md](./README.md) for component-level context).

## Prerequisites

- Node.js 20+
- npm
- Git
- Redis (local or container)

## Getting Started

```bash
cd components/sidecar
npm install
npm run build
```

## Run (development)

### Option A: TypeScript dev runner

```bash
npm run dev
```

### Option B: Build + run Node output

```bash
npm run build
npm start
```

## Local runtime configuration

The sidecar reads configuration from a JSON file.

- Schema: [schemas/sidecar-config-v1.schema.json](./schemas/sidecar-config-v1.schema.json)
- Example config: [config.example.json](./config.example.json)

Typical environment variables for local development:

```bash
# Required
export CONFIG_PATH=./config.json
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Optional
export SIDECAR_PORT=7000

# Enable subscriber/invocation (optional)
export SERVICE_NAME=order-service
export SERVICE_PORT=5001

# Tracing (optional)
export ZIPKIN_URL=http://localhost:9411
export TRACING_ENABLED=true

npm start
```

Protocol semantics (endpoints, headers, transforms) are defined in the contract:

- [Sidecar Contract](../../principles/component/10-sidecar-contract.md)

## Tests and checks

```bash
npm test
npm run test:watch
npm run test:coverage
npm run lint
npm run format
```

## Debugging

```bash
node --inspect-brk dist/index.js
```

## Docker Build

Build the sidecar Docker image:

```bash
cd components/sidecar
docker build -t spas-sidecar .
```

Or if you prefer docker compose.

```bash
docker-compose build
```
