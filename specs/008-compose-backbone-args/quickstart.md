# Quickstart: Compose Deploy Backbone Arguments

**Feature**: 008-compose-backbone-args  
**Date**: 2025-12-15

## Overview

The `spas-compose choreography build` command now supports customizable infrastructure backbones for event streaming (Redis) and observability (Zipkin/Jaeger).

## Default Behavior

Deploy with sensible defaults (no arguments needed):

```bash
spas-compose choreography build --docker
```

This generates docker-compose.yaml with:
- Redis 7-alpine for event streaming
- Zipkin latest for distributed tracing

## Customizing Backbones

### Custom Redis Version

```bash
# Use Redis 6.2 for production parity
spas-compose choreography build --docker --event-backbone redis:6.2

# Use Bitnami Redis
spas-compose choreography build --docker --event-backbone bitnami/redis:7.0
```

### Custom Zipkin Version

```bash
# Pin Zipkin version
spas-compose choreography build --docker --observability-backbone zipkin:2.24
```

### Using Jaeger Instead of Zipkin

```bash
# Use Jaeger for tracing (Zipkin-compatible)
spas-compose choreography build --docker --observability-backbone jaeger:latest
```

Jaeger provides a richer UI at http://localhost:16686 while remaining compatible with the sidecar's Zipkin protocol.

## Disabling Backbones (BYO Infrastructure)

### External Redis

```bash
# Don't provision Redis (use external)
spas-compose choreography build --docker --event-backbone none
```

Then provide Redis connection at runtime:

```bash
REDIS_HOST=my-redis.example.com REDIS_PORT=6379 docker compose up
```

### External Observability

```bash
# Don't provision observability (use external)
spas-compose choreography build --docker --observability-backbone none
```

Then provide Zipkin URL at runtime:

```bash
ZIPKIN_URL=http://zipkin.example.com:9411 docker compose up
```

### Minimal Deployment (No Infrastructure)

```bash
# Services and sidecars only
spas-compose choreography build --docker \
  --event-backbone none \
  --observability-backbone none
```

## Combining Options

```bash
# Custom Redis + Jaeger
spas-compose choreography build --docker \
  --event-backbone redis:7.2-alpine \
  --observability-backbone jaeger:latest
```

## Dry Run

Preview what would be generated without writing files:

```bash
spas-compose choreography build --docker --dry-run \
  --event-backbone redis:6.2 \
  --observability-backbone jaeger:latest
```

## Quick Reference

| Argument | Default | Options |
|----------|---------|---------|
| `--event-backbone` | `redis:7-alpine` | `redis:*`, full image path, `none` |
| `--observability-backbone` | `openzipkin/zipkin:latest` | `zipkin:*`, `jaeger:*`, full image path, `none` |

## Shorthand Normalization

For convenience, shorthand image names are expanded:

| Shorthand | Expands To |
|-----------|------------|
| `zipkin:2.24` | `openzipkin/zipkin:2.24` |
| `jaeger:latest` | `jaegertracing/all-in-one:latest` |
| `redis:7-alpine` | `redis:7-alpine` (no change) |
