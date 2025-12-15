# API Gateway

Custom API gateway for SPAS E-Commerce and B2B domains.

## Purpose

Single gateway codebase demonstrating how the same code can exhibit different behavior (sync vs async) based on sidecar configuration per domain.

## Behavior Modes

### E-Commerce Domain (Sync Mode)
- `SIDECAR_MODE=sync`
- POST /orders → Sidecar HTTP proxy → order-service → sync 201 response
- GET /products → Sidecar HTTP proxy → product-service → sync 200 response

### B2B Domain (Async Mode)
- `SIDECAR_MODE=async`
- POST /orders → Sidecar publishes OrderRequested event → async 202 Accepted
- GET /products → Sidecar HTTP proxy → product-service → sync 200 response (queries always sync)

## Endpoints

### Commands
- `POST /orders` - Create order
  - E-Commerce: Sync response (201)
  - B2B: Async response (202 Accepted)
  - Request: `{ customerId, items[], total }`

### Queries
- `GET /products` - List products (always sync)
  - Optional `?category=Electronics` filter

### Health
- `GET /health` - Health check with mode information

## Configuration

Environment variables:
- `SERVICE_NAME=api-gateway`
- `SIDECAR_HOST=api-gateway-sidecar`
- `SIDECAR_PORT=7000`
- `PORT=3000`
- `SIDECAR_MODE=sync|async` - **Key differentiator per domain**

## How It Works

The gateway delegates ALL requests to its sidecar:
1. Sidecar configuration determines routing behavior
2. E-Commerce sidecar config: HTTP proxy to downstream sidecars
3. B2B sidecar config: Event publishing to Redis

Same gateway code, different runtime behavior via sidecar.

## Build & Run

### Local Development
```bash
npm install
npm start
```

### Docker
```bash
docker build -t api-gateway:1.0.0 .
docker run -p 3000:3000 -e SIDECAR_MODE=sync api-gateway:1.0.0
```

## Design Pattern

This demonstrates the **Sidecar Pattern** for behavior injection:
- Gateway code is agnostic to sync vs async
- Sidecar configuration controls routing semantics
- Same service, different compositions

## NOT SPAS-Compliant

This is an edge gateway (North-South traffic). It does NOT use the SPAS SDK and is NOT published to the Repository.
