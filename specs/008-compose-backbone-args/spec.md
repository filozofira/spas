# Feature Specification: Compose Deploy Backbone Arguments

**Feature Branch**: `008-compose-backbone-args`  
**Created**: 2025-12-14  
**Status**: Draft  
**Input**: User description: "Improve spas-compose deploy command with ability to specify optional observability-backbone arg (defaults to zipkin latest) and optional event-backbone arg (defaults to redis latest)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy with Default Backbones (Priority: P1)

As a developer, I want the deploy command to automatically include Redis and Zipkin infrastructure with sensible defaults so that I get a complete runnable environment without extra configuration.

**Why this priority**: This is the core value proposition - zero-config deployment with all dependencies included by default.

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker` and verifying docker-compose.yaml includes Redis 7-alpine and Zipkin latest with correct networking.

**Acceptance Scenarios**:

1. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker` without backbone arguments, **Then** docker-compose.yaml is generated with:
   - Redis service using `redis:7-alpine` image
   - Zipkin service using `openzipkin/zipkin:latest` image
   - Both services on the same network as sidecars
   - Sidecar `REDIS_HOST` set to `redis`
   - Sidecar `ZIPKIN_URL` set to `http://zipkin:9411`

2. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker`, **Then** Redis service includes a health check using `redis-cli ping`.

3. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker`, **Then** Zipkin service exposes port 9411 for trace viewing.

---

### User Story 2 - Customize Event Backbone (Priority: P2)

As a developer, I want to specify a custom Redis image version so that I can match my production environment or use a specific version for compatibility.

**Why this priority**: Allows version pinning and production parity while keeping the default simple.

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker --event-backbone redis:6.2` and verifying the Redis image version in generated docker-compose.yaml.

**Acceptance Scenarios**:

1. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker --event-backbone redis:6.2`, **Then** docker-compose.yaml uses `redis:6.2` image instead of default.

2. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker --event-backbone redis:7.2-alpine`, **Then** the specified image tag is used exactly as provided.

3. **Given** I run deploy with invalid image format, **When** I use `--event-backbone invalid::image`, **Then** the command fails with clear error about invalid image format.

---

### User Story 3 - Customize Observability Backbone (Priority: P2)

As a developer, I want to specify a custom Zipkin image or use Jaeger instead so that I can integrate with my team's preferred tracing infrastructure.

**Why this priority**: Teams have different observability preferences; flexibility is important but defaults should work out of the box.

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker --observability-backbone jaegertracing/all-in-one:latest` and verifying Jaeger is configured instead of Zipkin.

**Acceptance Scenarios**:

1. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker --observability-backbone zipkin:2.24`, **Then** docker-compose.yaml uses `openzipkin/zipkin:2.24` image.

2. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker --observability-backbone jaegertracing/all-in-one:latest`, **Then** docker-compose.yaml includes Jaeger with:
   - Port 16686 exposed for Jaeger UI
   - Port 9411 exposed for Zipkin-compatible endpoint
   - Sidecar `ZIPKIN_URL` set to `http://jaeger:9411` (Zipkin-compatible collector)

3. **Given** I specify a full image path, **When** I use `--observability-backbone ghcr.io/my-org/custom-zipkin:v1`, **Then** the exact image path is used.

---

### User Story 4 - Disable Backbone Services (Priority: P3)

As a developer with existing infrastructure, I want to disable automatic backbone provisioning so that I can connect to external Redis or Zipkin instances.

**Why this priority**: Advanced use case for production-like environments or shared infrastructure. Lower priority as most local development uses defaults.

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker --event-backbone none` and verifying no Redis service is included, while sidecar still has REDIS_HOST env var that must be set externally.

**Acceptance Scenarios**:

1. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker --event-backbone none`, **Then** docker-compose.yaml:
   - Does NOT include a Redis service
   - Sidecar `REDIS_HOST` is set to `${REDIS_HOST:-localhost}` (environment variable with default)

2. **Given** a valid choreography.yaml exists, **When** I run `spas-compose choreography deploy --docker --observability-backbone none`, **Then** docker-compose.yaml:
   - Does NOT include a Zipkin/Jaeger service
   - Sidecar `ZIPKIN_URL` is set to `${ZIPKIN_URL:-}` (optional environment variable)

3. **Given** I disable both backbones, **When** I run `spas-compose choreography deploy --docker --event-backbone none --observability-backbone none`, **Then** docker-compose.yaml only includes service and sidecar containers.

---

### Edge Cases

- What happens when using shorthand `zipkin:2.24` vs full path `openzipkin/zipkin:2.24`? — CLI normalizes shorthand `zipkin:*` to `openzipkin/zipkin:*` automatically.
- What happens when using shorthand `jaeger:latest`? — CLI normalizes to `jaegertracing/all-in-one:latest`.
- How does system handle unrecognized observability backend? — Uses image as-is, assumes Zipkin-compatible endpoint on port 9411.
- What happens with `--event-backbone none` but services need Redis? — Command succeeds with warning that REDIS_HOST must be provided at runtime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CLI MUST support `--event-backbone <image>` argument on deploy command with default value `redis:7-alpine`.
- **FR-002**: CLI MUST support `--observability-backbone <image>` argument on deploy command with default value `openzipkin/zipkin:latest`.
- **FR-003**: CLI MUST support value `none` for both backbone arguments to disable automatic provisioning.
- **FR-004**: CLI MUST normalize shorthand image names (`zipkin:*` → `openzipkin/zipkin:*`, `jaeger:*` → `jaegertracing/all-in-one:*`).
- **FR-005**: CLI MUST configure sidecar environment variables to connect to backbone services when provisioned.
- **FR-006**: CLI MUST use environment variable substitution for backbone connections when `none` is specified.
- **FR-007**: CLI MUST include health checks for Redis backbone service.
- **FR-008**: CLI MUST detect Jaeger images and configure appropriate port mappings (16686 for UI, 9411 for Zipkin-compatible collector).
- **FR-009**: CLI MUST validate image format (reject obviously malformed image references).
- **FR-010**: CLI MUST emit warning when backbone is disabled but services require the infrastructure.

### Key Entities

- **Event Backbone**: Message broker infrastructure for event streaming. Default implementation is Redis Streams.
- **Observability Backbone**: Distributed tracing infrastructure. Default implementation is Zipkin; Jaeger is an alternative with Zipkin-compatible API.
- **Backbone Configuration**: Image reference and associated settings (ports, health checks, environment variables) for infrastructure services.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can deploy with defaults (no arguments) and get working Redis + Zipkin in under 30 seconds.
- **SC-002**: Developer can customize backbone versions with single argument without consulting documentation.
- **SC-003**: Generated docker-compose.yaml runs successfully with custom backbone images without manual edits.
- **SC-004**: Developer can disable backbones for BYO infrastructure scenarios with clear runtime requirements shown.
- **SC-005**: Shorthand image names (e.g., `zipkin:2.24`) work without requiring full registry paths.

## Assumptions

- Redis Streams is the only supported event backbone for initial implementation.
- Zipkin and Jaeger are the supported observability backends; both expose Zipkin-compatible API on port 9411.
- Sidecar already supports `REDIS_HOST`, `REDIS_PORT`, and `ZIPKIN_URL` environment variables.
- Future event backbones (e.g., Kafka, NATS) would require additional implementation work.

## References

- [specs/005-spas-compose-cli/spec.md](../005-spas-compose-cli/spec.md) — Parent feature specification
- [specs/007-spas-sidecar/spec.md](../007-spas-sidecar/spec.md) — Sidecar environment variables
- [components/sidecar/docker-compose.yml](../../components/sidecar/docker-compose.yml) — Reference implementation of backbone services
