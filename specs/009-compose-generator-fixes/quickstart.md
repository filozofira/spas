# Quickstart: spas-compose CLI Generator Fixes

**Feature**: 009-compose-generator-fixes  
**Date**: 2025-12-16

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git repository (for agent prompt placement)

## Quick Validation

After implementing the fixes, validate with the E-Commerce example:

```bash
# Navigate to CLI component
cd components/cli/spas-compose

# Build CLI
npm run build

# Navigate to example domain
cd ../../../examples/domains/ecommerce/public

# Generate docker-compose and sidecar configs
npx spas-compose choreography build --docker

# Verify generated files
cat docker-compose.yaml  # Should use image: not build:
cat config.order-service.json  # Should have eventType in outbound

# Start services
docker compose up -d

# Test event flow
curl http://localhost:5002/orders -X POST -H "Content-Type: application/json" \
  -d '{"productId":"P001","quantity":1}'

# Check inventory service received event
docker logs spas-inventory-service 2>&1 | grep -i "OrderCreated"

# Cleanup
docker compose down
```

## Expected Generated Output

### docker-compose.yaml (service entry)

```yaml
order-service:
  image: spas-examples/order-service:1.0.0   # Uses image:, not build:
  container_name: spas-order-service
  ports:
    - "5002:8080"                             # Internal port 8080
  environment:
    - SERVICE_NAME=order-service
    - SIDECAR_PORT=7001                       # SDK needs this
    - PORT=8080
    - ZIPKIN_URL=http://zipkin:9411
```

### docker-compose.yaml (sidecar entry)

```yaml
order-service-sidecar:
  image: spas/sidecar:latest                  # Uses image:, not build:
  container_name: order-service-sidecar
  environment:
    - SIDECAR_PORT=7001                       # SIDECAR_PORT, not PORT
    - SERVICE_PORT=8080
    # ...
```

### config.order-service.json

```json
{
  "outbound": [
    {
      "eventType": "com.order.order.created",  # Full CloudEvents type
      "topic": "orders-created"
    }
  ],
  "inbound": []
}
```

### config.inventory-service.json

```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-created",
      "invokeEndpoint": "/incoming",           # Default endpoint
      "transform": "transformations/inventory-service/inbound-order-created.jsonata"
    }
  ],
  "outbound": [
    {
      "eventType": "com.inventory.stock.reserved",
      "topic": "stock-reserved"
    }
  ]
}
```

## Init Command with --output

```bash
# Create domain in custom location
spas-compose init public --output ./examples/ecommerce/public

# Domain files created at:
#   ./examples/ecommerce/public/choreography.yaml
#   ./examples/ecommerce/public/services/
#   ./examples/ecommerce/public/transformations/

# Agent prompts created at project root:
#   ./.github/agents/spas-compose.agent.md  (with correct paths)
#   ./.github/prompts/spas-compose.prompt.md
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Service can't connect to sidecar | Missing SIDECAR_PORT env var | Verify docker-compose has SIDECAR_PORT=7001 |
| Events not routing | Wrong eventType format | Check config has full CloudEvents type (com.xxx.xxx) |
| Service unreachable | Wrong internal port | Verify ports mapping uses :8080 as internal |
| Sidecar 404 on invoke | Wrong invokeEndpoint | Check service exposes /incoming endpoint |
