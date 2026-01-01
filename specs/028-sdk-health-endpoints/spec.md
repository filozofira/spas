# Feature Specification: Standard SDK Health Endpoints

**Feature Branch**: `028-sdk-health-endpoints`
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Standardise SPAS service health check endpoints by adding the functionality to both SDKs (java and dotnet). Ideally don't 'Reinvent' but 'Adapt', i.e. if possible use Java SDK to leverage Spring Boot Actuator, by either configuring Actuator to expose the standard SPAS path or create a SPAS controller that delegates to Actuator's internal health indicators. For Dotnet, similarly, use the standard ASP.NET Core Health Checks middleware and map it to the SPAS standard route. Use distinct paths for Liveness (I'm running) and Readiness (I can handle traffic), using _spas prefix to avoid collision (GET /_spas/health/live, GET /_spas/health/ready). The SDK must allow the service developer to register custom checks (e.g., 'Database is down', 'Cache is unreachable'). Important note regarding metadata: If automatically injecting a 'Health' endpoints into the generated metadata is is coming out-of-box with current offline-generation, than keep let 'Health' endpoints appear inside spas.json, else exclude 'Health' endpoints from spas.json during the generation. This will significantly simplify the spas-compose and sidecar logic, as they can rely on a guaranteed contract for service availability. Benefits: Zero Configuration, Consistent Contract, Choreography Reliability."

## Clarifications

### Session 2026-01-01
- Q: Where must the `/_spas/health/*` endpoints be exposed (Main vs Management port)? → A: **Always Main Port**. The SDK ensures they are served on the main application traffic port to guarantee Sidecar access without extra config.
- Q: Should the SDK enforce authentication on `/_spas/health/*`? → A: **Public / Anonymous**. Endpoints must be open to allow zero-config Sidecar probing.
- Q: How should developers register custom health checks? → A: **Native Framework Mechanisms**. Developers should use standard Spring `HealthIndicator` or .NET `IHealthCheck` interfaces. The SDK documentation MUST explicitly guide users on this pattern.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sidecar Probes Readiness (Priority: P1)

The SPAS Sidecar (or any orchestrator) needs to know when a service is fully initialized and ready to accept traffic or process events. It probes a standard endpoint to make this determination.

**Why this priority**: Critical for preventing message loss during startup and ensuring reliable choreography.

**Independent Test**: Can be tested by starting a service and polling the endpoint until it returns 200 OK, verifying traffic is only sent afterwards.

**Acceptance Scenarios**:

1. **Given** a service is starting up but not yet ready, **When** a GET request is made to `/_spas/health/ready`, **Then** it returns 503 Service Unavailable (or 404 if not initialized).
2. **Given** a service is fully initialized, **When** a GET request is made to `/_spas/health/ready`, **Then** it returns 200 OK with a JSON body indicating status "UP".

---

### User Story 2 - Orchestrator Probes Liveness (Priority: P2)

Container orchestrators (like Kubernetes or Docker Compose) need to know if the service process is alive or if it has deadlocked/crashed and needs restarting.

**Why this priority**: Ensures system resilience by allowing automatic recovery of hung services.

**Independent Test**: Can be tested by verifying the endpoint returns 200 OK while the app is running, and potentially simulating a "broken" state if possible.

**Acceptance Scenarios**:

1. **Given** a service is running, **When** a GET request is made to `/_spas/health/live`, **Then** it returns 200 OK.

---

### User Story 3 - Developer Adds Custom Check (Priority: P3)

A service developer needs to ensure the service reports as "unhealthy" if a critical dependency (like a database) is unreachable.

**Why this priority**: Prevents the service from accepting work it cannot process.

**Independent Test**: Can be tested by registering a custom check that fails, and verifying the readiness endpoint returns 503.

**Acceptance Scenarios**:

1. **Given** a developer has registered a custom health check, **When** that check fails (e.g., throws exception or reports down), **Then** `/_spas/health/ready` returns 503 Service Unavailable.
2. **Given** the custom check passes, **Then** `/_spas/health/ready` returns 200 OK.

---

### User Story 4 - Compose Generates Docker Healthchecks (Priority: P2)

When generating the local development environment, `spas-compose` automatically configures Docker healthchecks using the standard endpoints. This ensures services start in dependency order without manual configuration.

**Why this priority**: Delivers the "Zero Configuration" promise to the developer's inner loop.

**Independent Test**: Run `spas-compose choreography build` and inspect the generated `docker-compose.yml`.

**Acceptance Scenarios**:

1. **Given** a SPAS service in the choreography, **When** `spas-compose choreography build` is run, **Then** the generated `docker-compose.yml` service entry includes a `healthcheck` block pointing to `/_spas/health/ready`.
2. **Given** the generated compose file, **When** `docker compose up` is run, **Then** dependent services wait for the healthcheck to pass before starting (via `depends_on: condition: service_healthy`).

### Edge Cases

- **Framework Conflicts**: What happens if the user already has Actuator/HealthChecks configured on different paths? (SDK should add SPAS paths *in addition* to existing ones, or map to the same underlying registry).
- **Security**: Are these endpoints publicly accessible? (Assumed yes for sidecar access, or protected by internal network restrictions, but SDK implementation is typically open).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Java SDK MUST expose `GET /_spas/health/live` for liveness probes.
- **FR-002**: Java SDK MUST expose `GET /_spas/health/ready` for readiness probes.
- **FR-003**: .NET SDK MUST expose `GET /_spas/health/live` for liveness probes.
- **FR-004**: .NET SDK MUST expose `GET /_spas/health/ready` for readiness probes.
- **FR-005**: Both SDKs MUST return an identical JSON response format for health status to ensure consistent parsing by the sidecar.
- **SC-004**: Generated `docker-compose.yml` files include valid `healthcheck` definitions for all SPAS services.
- **FR-006**: The JSON response format MUST be a minimal object `{ "status": "UP" | "DOWN" }`. The schema MUST be treated as open-ended; consumers MUST ignore unknown properties to allow for future inclusion of detailed diagnostics.
- **FR-012**: The `/_spas/health/*` endpoints MUST be exposed on the service's **main application port** (HTTP traffic port), even if the underlying framework (e.g., Spring Boot Actuator) is configured to use a separate management port. This ensures the Sidecar can access them without additional port configuration.
- **FR-013**: The `/_spas/health/*` endpoints MUST be accessible anonymously (publicly) by default. The SDK MUST configure the application's security chain (e.g., Spring Security, ASP.NET Core Auth) to permit unauthenticated access to these specific paths.
- **FR-007**: Java SDK MUST leverage Spring Boot Actuator if available, mapping the SPAS paths to Actuator health indicators.
- **FR-008**: .NET SDK Msupport custom health checks by automatically including any natively registered checks (Spring `HealthIndicator`, .NET `IHealthCheck`) in the aggregate status. The SDK SHOULD NOT introduce a new proprietary interface for health checks.
- **FR-014**: SDK READMEs MUST include clear examples of how to register standard framework health checks so they are picked up by the SPAS endpoints
- **FR-009**: SDKs MUST allow developers to register custom health checks that influence the aggregate status (and thus the HTTP status code).
- **FR-010**: If a health check fails, the HTTP status code MUST be 503 Service Unavailable.
- **FR-011**: Health endpoints SHOULD NOT be explicitly injected into `spas.json` metadata unless the existing generation logic automatically picks them up (e.g., as generic controllers). The goal is to avoid cluttering business metadata.

### Success Criteria

- **SC-001**: A sidecar can successfully probe `/_spas/health/ready` on both Java and .NET services without configuration changes.
- **SC-002**: The response body from a Java service and a .NET service is structurally identical for the same health state.
- **SC-003**: A custom health check failure causes the readiness endpoint to return 503.

### Assumptions

- Services are HTTP-based.
- Java services use Spring Boot (primary support target).
- .NET services use ASP.NET Core.
- Sidecar has network access to these paths.
