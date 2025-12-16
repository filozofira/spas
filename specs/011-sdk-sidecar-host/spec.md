# Feature Specification: SDK Sidecar Host Convention

**Feature Branch**: `011-sdk-sidecar-host`  
**Created**: 2025-12-16  
**Status**: Draft  
**Input**: User description: "SDK Sidecar Host Convention (FG08) - Auto-derive sidecar host from SERVICE_NAME"

## Problem Statement

The .NET SDK currently requires explicit `SIDECAR_HOST` and `SIDECAR_PORT` environment variables to connect to the sidecar. In Docker Compose deployments, sidecar containers follow a predictable naming convention (`{service-name}-sidecar`), making this configuration redundant.

**Current behavior**: Developers must set both `SERVICE_NAME` and `SIDECAR_HOST`:
```yaml
environment:
  - SERVICE_NAME=order-service
  - SIDECAR_HOST=order-service-sidecar  # Redundant!
  - SIDECAR_PORT=7000
```

**Desired behavior**: SDK derives sidecar host from service name:
```yaml
environment:
  - SERVICE_NAME=order-service
  # Sidecar automatically resolved to order-service-sidecar:7000
```

## User Scenarios & Testing

### User Story 1 - Auto-Derived Sidecar Connection (Priority: P1)

A developer deploying a service with the SPAS SDK in Docker Compose wants the SDK to automatically connect to the companion sidecar without explicit host configuration.

**Why this priority**: This is the core feature request. Most deployments follow the naming convention, so automatic derivation provides immediate value with zero configuration.

**Independent Test**: Deploy a service with only `SERVICE_NAME` set, verify the SDK successfully connects to `{service-name}-sidecar:7000`.

**Acceptance Scenarios**:

1. **Given** a service with `SERVICE_NAME=order-service` and no `SIDECAR_HOST` set, **When** the SDK initializes, **Then** it connects to `http://order-service-sidecar:7000`
2. **Given** a service with `SERVICE_NAME=inventory-service` and no sidecar configuration, **When** the SDK publishes an event, **Then** the event is sent to `http://inventory-service-sidecar:7000/publish`

---

### User Story 2 - Explicit Override (Priority: P2)

A developer with a non-standard deployment (e.g., shared sidecar, different naming) wants to explicitly configure the sidecar host, overriding the derived value.

**Why this priority**: Supports edge cases and advanced deployments without breaking the convention-based approach.

**Independent Test**: Set both `SERVICE_NAME` and `SIDECAR_HOST`, verify the SDK uses the explicit value.

**Acceptance Scenarios**:

1. **Given** `SERVICE_NAME=order-service` and `SIDECAR_HOST=custom-sidecar`, **When** the SDK initializes, **Then** it connects to `http://custom-sidecar:7000` (explicit wins)
2. **Given** `SERVICE_NAME=order-service` and `SIDECAR_URL=http://shared-sidecar:8080`, **When** the SDK initializes, **Then** it connects to `http://shared-sidecar:8080` (full URL wins)

---

### User Story 3 - Local Development Fallback (Priority: P3)

A developer running a service locally (outside Docker) wants the SDK to fall back to localhost when service name derivation isn't applicable.

**Why this priority**: Maintains local development experience when running without containers.

**Independent Test**: Run service without any sidecar environment variables, verify fallback to localhost.

**Acceptance Scenarios**:

1. **Given** no `SERVICE_NAME` and no `SIDECAR_HOST` set, **When** the SDK initializes, **Then** it falls back to `http://localhost:7000`
2. **Given** `SERVICE_NAME=order-service` but running locally (no Docker networking), **When** the SDK fails to connect to derived host, **Then** developer can set `SIDECAR_HOST=localhost` as override

---

### Edge Cases

- What happens when `SERVICE_NAME` contains special characters (spaces, underscores)?
  - SDK should normalize: replace spaces/underscores with hyphens for DNS compatibility
- What happens when derived host is unreachable?
  - SDK should log warning with the derived URL for debugging
- What happens with empty `SERVICE_NAME`?
  - Fall back to localhost (no derivation possible)

## Requirements

### Functional Requirements

- **FR-001**: SDK MUST derive sidecar host as `{SERVICE_NAME}-sidecar` when `SIDECAR_HOST` is not set
- **FR-002**: SDK MUST use default port `7000` when `SIDECAR_PORT` is not set
- **FR-003**: SDK MUST prioritize explicit `SIDECAR_HOST`/`SIDECAR_PORT` over derived values
- **FR-004**: SDK MUST prioritize `SIDECAR_URL` (full URL) over all other sidecar configuration
- **FR-005**: SDK MUST fall back to `http://localhost:7000` when `SERVICE_NAME` is empty or not set
- **FR-006**: SDK MUST log the resolved sidecar URL at startup for debugging
- **FR-007**: SDK MUST normalize `SERVICE_NAME` for DNS compatibility (lowercase, hyphens only)

### Configuration Priority

The SDK resolves sidecar URL in this order (first match wins):

1. `SIDECAR_URL` - Full URL (e.g., `http://custom:8080`)
2. `SIDECAR_HOST` + `SIDECAR_PORT` - Explicit host and port
3. `SIDECAR_HOST` + default port 7000 - Explicit host, default port
4. Derived from `SERVICE_NAME` + default port 7000 - Convention-based
5. `http://localhost:7000` - Local development fallback

### Key Entities

- **SpasConfiguration**: Extension methods for reading SPAS config from environment
- **SidecarUrlResolver**: Logic for deriving sidecar URL from service name (may be inline or separate class)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developers can deploy services with only `SERVICE_NAME` environment variable and have sidecar communication work automatically
- **SC-002**: Existing deployments with explicit `SIDECAR_HOST` continue to work unchanged (backward compatible)
- **SC-003**: Configuration priority is clear and documented in SDK README
- **SC-004**: Resolved sidecar URL is logged at startup, enabling quick debugging of connection issues

## Assumptions

- Docker Compose sidecar naming convention is `{service-name}-sidecar` (established in Spec 009)
- Default sidecar port is `7000` (SPAS sidecar standard)
- Services and sidecars run in the same Docker network (can resolve container names)

## Dependencies

- Existing `SpasConfiguration.cs` in `Spas.Sdk.Core.Configuration`
- `SpasServiceExtensions.cs` uses `GetSpasSidecarUrl()` method

## Out of Scope

- Health check/retry logic for sidecar connection
- Service discovery beyond DNS-based container naming
- Multi-sidecar configurations
