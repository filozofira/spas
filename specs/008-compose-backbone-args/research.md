# Research: Compose Deploy Backbone Arguments

**Feature**: 008-compose-backbone-args  
**Date**: 2025-12-15  
**Phase**: 0 - Research

## Research Questions

### 1. What is the current backbone implementation?

**Finding**: The `DockerGenerator` class has hardcoded backbone configuration:

```typescript
// docker-generator.ts lines 162-177
private generateRedis(): DockerService {
  return {
    image: "redis:6-alpine",  // Hardcoded
    container_name: "spas-redis",
    ports: ["6379:6379"],
    networks: ["spas-network"],
  };
}

private generateZipkin(): DockerService {
  return {
    image: "openzipkin/zipkin:latest",  // Hardcoded
    container_name: "spas-zipkin",
    ports: ["9411:9411"],
    networks: ["spas-network"],
  };
}
```

**Decision**: Modify these methods to accept backbone configuration parameters.

---

### 2. How should image names be normalized?

**Finding**: Docker image references follow standard format:
- `redis:7-alpine` → Uses Docker Hub library
- `openzipkin/zipkin:2.24` → Uses Docker Hub organization
- `ghcr.io/org/image:tag` → Full registry path

**Decision**: Implement shorthand normalization:
- `redis:*` → `redis:*` (Docker Hub library, keep as-is)
- `zipkin:*` → `openzipkin/zipkin:*`
- `jaeger:*` → `jaegertracing/all-in-one:*`
- Full paths → Use as-is

**Rationale**: Reduces typing for common cases; full paths always work.

---

### 3. What ports does Jaeger expose?

**Finding**: Jaeger all-in-one image exposes:
- Port 16686: Jaeger UI (Query service)
- Port 9411: Zipkin-compatible collector (accepts Zipkin spans)
- Port 14250: gRPC collector
- Port 14268: HTTP collector (Thrift)

**Decision**: For spas-compose, expose:
- Port 16686: Jaeger UI
- Port 9411: Zipkin-compatible endpoint (sidecar uses this)

**Rationale**: Sidecar already uses Zipkin protocol on port 9411; Jaeger's Zipkin-compatible collector works transparently.

---

### 4. How should health checks be configured?

**Finding**: Current implementation lacks Redis health checks.

**Decision**: Add health checks:
- Redis: `redis-cli ping` with 5s interval, 3s timeout, 3 retries
- Zipkin: No health check (stateless, starts fast)
- Jaeger: No health check (starts fast)

**Rationale**: Redis connectivity is critical for sidecar startup; health check ensures depends_on waits properly.

---

### 5. How should `none` value be handled?

**Finding**: When backbone is disabled, sidecars still need environment variables.

**Decision**: 
- `--event-backbone none`: No Redis service; sidecar uses `${REDIS_HOST:-localhost}:${REDIS_PORT:-6379}`
- `--observability-backbone none`: No Zipkin service; sidecar uses `${ZIPKIN_URL:-}` (empty = disabled)

**Rationale**: Environment variable substitution allows runtime configuration without regenerating docker-compose.

---

### 6. How to detect Jaeger vs Zipkin images?

**Finding**: Need to configure different ports based on image.

**Decision**: Detect by image name pattern:
- Contains `jaeger` → Jaeger mode (ports 16686, 9411)
- Otherwise → Zipkin mode (port 9411 only)

**Rationale**: Simple string match covers common cases; unusual images assumed Zipkin-compatible.

---

## Alternatives Considered

### Alternative 1: Separate `--redis-image` and `--zipkin-image` flags

**Rejected**: More flags to remember; backbone concept clearer for documentation.

### Alternative 2: Configuration file for backbones

**Rejected**: Over-engineering for simple use case; CLI flags sufficient.

### Alternative 3: Auto-detect backbone from choreography.yaml

**Rejected**: Would require choreography schema changes; CLI flags simpler.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Commander.js | ✅ Existing | CLI argument parsing |
| js-yaml | ✅ Existing | YAML generation |
| Sidecar env vars | ✅ Confirmed | REDIS_HOST, REDIS_PORT, ZIPKIN_URL |

---

## Summary

All research questions resolved. Implementation approach:

1. Add `BackboneNormalizer` service for image name normalization
2. Modify `DockerGenerator` to accept backbone configuration
3. Add `--event-backbone` and `--observability-backbone` options to deploy command
4. Update types and tests
