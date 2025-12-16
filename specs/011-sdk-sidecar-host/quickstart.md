# Quickstart: SDK Sidecar Host Convention

**Feature**: 011-sdk-sidecar-host  
**Audience**: .NET developers using SPAS SDK

## Overview

The SPAS SDK now automatically derives the sidecar host from your service name. No more redundant configuration!

## Before (Old Way)

```yaml
# docker-compose.yml
services:
  order-service:
    environment:
      - SERVICE_NAME=order-service
      - SIDECAR_HOST=order-service-sidecar  # Redundant!
      - SIDECAR_PORT=7000                   # Redundant!
```

## After (New Way)

```yaml
# docker-compose.yml
services:
  order-service:
    environment:
      - SERVICE_NAME=order-service
      # That's it! SDK auto-derives: order-service-sidecar:7000
```

## How It Works

The SDK follows a simple naming convention:

```
SERVICE_NAME = order-service
         ↓
Sidecar Host = order-service-sidecar
         ↓
Sidecar URL = http://order-service-sidecar:7000
```

## Configuration Priority

If you need to override the derived value, explicit configuration takes precedence:

| Priority | Variable | Example |
|----------|----------|---------|
| 1 (highest) | `SIDECAR_URL` | `http://custom-sidecar:8080` |
| 2 | `SIDECAR_HOST` + `SIDECAR_PORT` | `my-sidecar` + `7001` |
| 3 | `SIDECAR_HOST` (port defaults to 7000) | `my-sidecar` |
| 4 | Derived from `SERVICE_NAME` | `order-service` → `order-service-sidecar:7000` |
| 5 (lowest) | Fallback | `http://localhost:7000` |

## Example: Docker Compose

### Service Definition

```yaml
services:
  order-service:
    build: ./order-service
    environment:
      - SERVICE_NAME=order-service
    networks:
      - spas-network

  order-service-sidecar:
    image: spas-sidecar:latest
    environment:
      - SERVICE_NAME=order-service
      - SERVICE_PORT=8080
    networks:
      - spas-network
```

The SDK in `order-service` will automatically connect to `http://order-service-sidecar:7000`.

## Example: Override for Shared Sidecar

If multiple services share a sidecar (advanced use case):

```yaml
services:
  service-a:
    environment:
      - SERVICE_NAME=service-a
      - SIDECAR_HOST=shared-sidecar  # Override derived value
```

## Example: Local Development

When running locally without Docker:

```bash
# No configuration needed - falls back to localhost:7000
dotnet run

# Or explicitly set for local sidecar on different port
export SIDECAR_URL=http://localhost:3001
dotnet run
```

## Debugging

The SDK logs the resolved sidecar URL at startup:

```
info: Spas.Sdk[0] SPAS SDK configured for service 'order-service'
info: Spas.Sdk[0] Sidecar URL: http://order-service-sidecar:7000 (derived from SERVICE_NAME)
```

If the sidecar is unreachable, check:
1. Is the sidecar container running?
2. Are both containers on the same Docker network?
3. Is the sidecar listening on port 7000?

## Migration Guide

### Existing Deployments

No changes required! Existing deployments with explicit `SIDECAR_HOST` continue to work:

```yaml
# This still works - explicit config takes priority
environment:
  - SERVICE_NAME=order-service
  - SIDECAR_HOST=order-service-sidecar
  - SIDECAR_PORT=7000
```

### New Deployments

Remove redundant configuration:

```yaml
# Before
environment:
  - SERVICE_NAME=order-service
  - SIDECAR_HOST=order-service-sidecar
  - SIDECAR_PORT=7000

# After
environment:
  - SERVICE_NAME=order-service
```
