# Data Model: Compose Deploy Backbone Arguments

**Feature**: 008-compose-backbone-args  
**Date**: 2025-12-15  
**Phase**: 1 - Design

## Core Entities

### BackboneConfig

Configuration for infrastructure backbone services passed to DockerGenerator.

```typescript
interface BackboneConfig {
  eventBackbone: EventBackboneConfig;
  observabilityBackbone: ObservabilityBackboneConfig;
}
```

---

### EventBackboneConfig

Configuration for the event streaming backbone (Redis).

```typescript
interface EventBackboneConfig {
  /** Whether to provision the backbone service */
  enabled: boolean;
  /** Docker image reference (e.g., "redis:7-alpine") */
  image: string;
  /** Container name */
  containerName: string;
  /** Host port binding */
  port: number;
  /** Health check configuration */
  healthcheck?: HealthCheckConfig;
}
```

**Defaults**:
- `enabled`: true
- `image`: "redis:7-alpine"
- `containerName`: "spas-redis"
- `port`: 6379

---

### ObservabilityBackboneConfig

Configuration for the observability backbone (Zipkin/Jaeger).

```typescript
interface ObservabilityBackboneConfig {
  /** Whether to provision the backbone service */
  enabled: boolean;
  /** Docker image reference (e.g., "openzipkin/zipkin:latest") */
  image: string;
  /** Container name */
  containerName: string;
  /** Backbone type (affects port configuration) */
  type: 'zipkin' | 'jaeger';
  /** Ports to expose */
  ports: PortMapping[];
}
```

**Defaults**:
- `enabled`: true
- `image`: "openzipkin/zipkin:latest"
- `containerName`: "spas-zipkin"
- `type`: "zipkin"
- `ports`: [{ host: 9411, container: 9411 }]

---

### PortMapping

Port mapping for Docker container.

```typescript
interface PortMapping {
  host: number;
  container: number;
}
```

---

### HealthCheckConfig

Docker health check configuration.

```typescript
interface HealthCheckConfig {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
}
```

---

### ChoreographyDeployOptions (Extended)

Extended CLI options interface.

```typescript
interface ChoreographyDeployOptions extends CommonOptions {
  docker?: boolean;
  dryRun?: boolean;
  output?: string;
  /** Event backbone image or "none" */
  eventBackbone?: string;
  /** Observability backbone image or "none" */
  observabilityBackbone?: string;
}
```

---

## Service Interfaces

### BackboneNormalizer

Service for normalizing image references and building backbone configurations.

```typescript
interface IBackboneNormalizer {
  /** Normalize shorthand image names to full references */
  normalizeImage(input: string, type: 'event' | 'observability'): string;
  
  /** Build complete backbone configuration from CLI options */
  buildConfig(options: {
    eventBackbone?: string;
    observabilityBackbone?: string;
  }): BackboneConfig;
  
  /** Validate image reference format */
  validateImageFormat(image: string): ValidationResult;
  
  /** Detect backbone type from image name */
  detectObservabilityType(image: string): 'zipkin' | 'jaeger';
}
```

---

## Normalization Rules

### Event Backbone Normalization

| Input | Output |
|-------|--------|
| (undefined) | `redis:7-alpine` |
| `redis:6.2` | `redis:6.2` |
| `redis:7-alpine` | `redis:7-alpine` |
| `bitnami/redis:7.0` | `bitnami/redis:7.0` |
| `none` | (disabled) |

### Observability Backbone Normalization

| Input | Output | Type |
|-------|--------|------|
| (undefined) | `openzipkin/zipkin:latest` | zipkin |
| `zipkin:2.24` | `openzipkin/zipkin:2.24` | zipkin |
| `openzipkin/zipkin:2.24` | `openzipkin/zipkin:2.24` | zipkin |
| `jaeger:latest` | `jaegertracing/all-in-one:latest` | jaeger |
| `jaegertracing/all-in-one:1.52` | `jaegertracing/all-in-one:1.52` | jaeger |
| `none` | (disabled) | - |

---

## Generated Docker Compose Patterns

### Default (both backbones enabled)

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: spas-redis
    ports:
      - "6379:6379"
    networks:
      - spas-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3

  zipkin:
    image: openzipkin/zipkin:latest
    container_name: spas-zipkin
    ports:
      - "9411:9411"
    networks:
      - spas-network
```

### Jaeger Backbone

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: spas-jaeger
    ports:
      - "16686:16686"  # Jaeger UI
      - "9411:9411"    # Zipkin-compatible collector
    networks:
      - spas-network
```

### Event Backbone Disabled

Sidecar environment when `--event-backbone none`:

```yaml
environment:
  - REDIS_HOST=${REDIS_HOST:-localhost}
  - REDIS_PORT=${REDIS_PORT:-6379}
```

### Observability Backbone Disabled

Sidecar environment when `--observability-backbone none`:

```yaml
environment:
  - ZIPKIN_URL=${ZIPKIN_URL:-}
```

---

## Validation Rules

### Image Format Validation

- Must not contain `::` (double colon)
- Must not start with `:` or end with `:`
- Must not contain whitespace
- Special value `none` is valid

### Invalid Image Examples

- `invalid::image` → Error: Invalid image format
- `:latest` → Error: Invalid image format
- `redis:` → Error: Invalid image format
