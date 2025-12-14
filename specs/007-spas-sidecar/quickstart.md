# Quickstart: SPAS Sidecar

**Feature**: 007-spas-sidecar  
**Date**: 2025-12-14

## Overview

The SPAS Sidecar mediates all service communication in a SPAS domain. It handles event publishing, event subscription, command invocation, and distributed tracing.

## Prerequisites

- Node.js 20+
- Docker (for Redis)
- `spas-compose` CLI (for config generation)

## Quick Start

### 1. Start Redis

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 2. Create Configuration

Create `config.json`:

```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-requested",
      "transform": "transformOutput",
      "invokeEndpoint": "/incoming"
    },
    {
      "kind": "command",
      "command": "create-order",
      "transform": "transformInput",
      "invokeEndpoint": "/orders"
    }
  ],
  "outbound": [
    {
      "eventType": "com.example.order.created",
      "topic": "orders-requested",
      "transform": "transformInput"
    },
    {
      "eventType": "com.example.order.processed",
      "topic": "orders-processed"
    }
  ]
}
```

Note: The `outbound` array maps `eventType` (from `x-event-type` header) to target `topic`. Services don't specify topics directly - the sidecar resolves them from configuration.

### 3. Start Sidecar

```bash
cd components/sidecar
npm install
npm run build

CONFIG_PATH=./config.json \
SERVICE_NAME=order-service \
SERVICE_PORT=5001 \
REDIS_HOST=localhost \
npm start
```

**Output:**
```
[SIDECAR] Configuration validated successfully
[SIDECAR] Zipkin tracing disabled (ZIPKIN_URL not set)
[SIDECAR] Connected to Redis
[SIDECAR] Subscribed to: orders-requested
[SIDECAR] Listening on port 7000
```

### 4. Health Check

```bash
curl http://localhost:7000/health
# {"status":"ok","timestamp":"2025-12-14T10:00:00.000Z"}

curl http://localhost:7000/ready
# {"status":"ready","timestamp":"2025-12-14T10:00:00.000Z"}
```

## Usage Examples

### Publish Event

The sidecar resolves the target topic from `x-event-type` header using routing config:

```bash
curl -X POST http://localhost:7000/publish \
  -H "Content-Type: application/json" \
  -H "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" \
  -H "x-service-name: order-service" \
  -H "x-event-type: com.example.order.created" \
  -H "x-correlation-id: abc-123" \
  -d '{"orderId": "12345", "customerId": "C100"}'
```

**Response:**
```json
{
  "status": "accepted",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "topic": "orders-requested",
  "eventType": "com.example.order.created"
}
```

Note: Topic `orders-requested` was resolved from `x-event-type: com.example.order.created` via the outbound routing configuration.

### Invoke Command

```bash
curl -X POST http://localhost:7000/invoke/create-order \
  -H "Content-Type: application/json" \
  -H "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" \
  -d '{"customerId": "C100", "items": [{"productId": "P1", "quantity": 2}]}'
```

**Response:**
```json
{
  "orderId": "12345",
  "status": "created"
}
```

## With Docker Compose

The sidecar is typically deployed alongside services via `spas-compose`:

```yaml
services:
  order-service:
    image: order-service:1.0.0
    ports:
      - "5001:5001"

  order-service-sidecar:
    image: spas-sidecar:1.0.0
    environment:
      - SERVICE_NAME=order-service
      - SERVICE_PORT=5001
      - REDIS_HOST=redis
      - ZIPKIN_URL=http://zipkin:9411
    volumes:
      - ./config.order-service.json:/app/config.json
    depends_on:
      - redis
      - order-service

  redis:
    image: redis:7-alpine
```

## With Zipkin Tracing

```bash
# Start Zipkin
docker run -d --name zipkin -p 9411:9411 openzipkin/zipkin

# Start sidecar with tracing
ZIPKIN_URL=http://localhost:9411 npm start
```

View traces at http://localhost:9411

## Workflow Integration

1. **Generate configs**: `spas-compose choreography deploy --docker`
2. **Start infrastructure**: `docker compose up redis zipkin`
3. **Start services with sidecars**: `docker compose up`

The sidecar automatically:
- Subscribes to configured inbound topics
- Transforms messages per configuration
- Invokes service endpoints
- Emits Zipkin spans for observability

## Troubleshooting

### Redis Connection Failed
```
[SIDECAR] Redis SUB error: Error: Connection refused
```
**Solution**: Ensure Redis is running and `REDIS_HOST`/`REDIS_PORT` are correct.

### Configuration Validation Failed
```
[SIDECAR] Configuration validation FAILED:
  - inbound[0]: missing required field 'kind'
```
**Solution**: Check config.json matches expected schema.

### Service Invocation Failed
```
[SIDECAR] Error invoking endpoint: ECONNREFUSED
```
**Solution**: Ensure target service is running at `SERVICE_NAME:SERVICE_PORT`.
