# Quickstart: Sidecar Transform File Loading

**Date**: 2025-12-16  
**Time to complete**: ~15 minutes

## Overview

This guide shows how to use file-based JSONata transforms with the SPAS sidecar.

## Prerequisites

- Node.js 20+
- Docker (for running with containers)
- SPAS sidecar component

## Step 1: Create a Transform File

Create a JSONata transform file with `.jsonata` extension:

```bash
mkdir -p transformations
```

Create `transformations/inbound-order-created.jsonata`:

```jsonata
{
  "orderId": data.id,
  "customerName": data.customer.name,
  "items": data.lineItems.{
    "productId": productId,
    "quantity": qty
  },
  "total": $sum(data.lineItems.(price * qty))
}
```

## Step 2: Configure Sidecar

Update your sidecar config to reference the transform file:

`config.json`:
```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-created",
      "transform": "transformations/inbound-order-created.jsonata",
      "invokeEndpoint": "/incoming"
    }
  ],
  "outbound": [
    {
      "eventType": "com.inventory.stock-reserved",
      "topic": "stock-reserved"
    }
  ]
}
```

## Step 3: Mount Transform Files in Docker

Ensure transform files are available in the container:

```yaml
# docker-compose.yaml
services:
  inventory-service-sidecar:
    image: spas/sidecar:latest
    volumes:
      - ./config.inventory-service.json:/app/config.json
      - ./transformations:/app/transformations  # Mount transform files
    environment:
      - CONFIG_PATH=/app/config.json
      - SERVICE_NAME=inventory-service
      - SIDECAR_PORT=7001
```

## Step 4: Test the Transform

Publish an event to verify the transform works:

```bash
# Publish an order-created event
curl -X POST http://localhost:6379/publish \
  -H "Content-Type: application/json" \
  -H "x-service-name: order-service" \
  -H "x-event-type: com.order.order-created" \
  -H "x-correlation-id: test-123" \
  -d '{
    "id": "ORD-001",
    "customer": { "name": "John Doe" },
    "lineItems": [
      { "productId": "PROD-1", "qty": 2, "price": 10.00 },
      { "productId": "PROD-2", "qty": 1, "price": 25.00 }
    ]
  }'
```

The inventory service receives the transformed payload:

```json
{
  "orderId": "ORD-001",
  "customerName": "John Doe",
  "items": [
    { "productId": "PROD-1", "quantity": 2 },
    { "productId": "PROD-2", "quantity": 1 }
  ],
  "total": 45.00
}
```

## Inline vs File Transforms

| Config Value | Behavior |
|--------------|----------|
| `"$.data"` | Inline expression, evaluated directly |
| `"transformations/my-transform.jsonata"` | File path, content loaded and compiled |

**Detection**: Transforms ending in `.jsonata` are treated as file paths.

## Error Handling

If a transform file is missing or invalid, the sidecar:
1. Logs an error with the file path and details
2. Rejects the event with a 500 error
3. Returns an error response identifying the problem

Example error:
```json
{
  "error": "Transform file not found: transformations/missing.jsonata"
}
```

## Performance

- Transform files are read once and cached
- Subsequent events use the cached compiled expression
- No performance penalty after first use

## See Also

- [Sidecar README](../../components/sidecar/README.md)
- [JSONata Documentation](https://docs.jsonata.org/)
- [spec.md](spec.md) - Feature specification
