# Feature Specification: .NET SPAS SDK

**Feature Branch**: [001-dotnet-spas-sdk]  
**Created**: 2025-12-12  
**Completed**: 2025-12-12  
**Status**: ✅ Complete (PoC)  
**Input**: User description: ".Net SPAS SDK component to support building .Net SPAS compliant services."

> **Outdated (Historical)**: This spec includes references to a dev-only runtime metadata endpoint at `/_spas/metadata`.
> The current supported approach is **offline** metadata archive generation (SDK-triggered) and archive-based publishing; the runtime endpoint workflow has been removed.
> The original text is preserved for historical context.

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Compose Valid Metadata (Priority: P1)

Service developers author metadata fragments in code using SDK builders and generate a canonical `spas.json` using SDK composition only (CLI and repository validation are deferred to later features).

**Why this priority**: Metadata is foundational for service identity, contracts, and governance; without it, no SPAS-compliant service can exist.

**Independent Test**: Implement a sample service with minimal builders; use SDK composition to produce `spas.json`; verify local schema alignment where applicable without relying on CLI/repository.

**Acceptance Scenarios**:

1. **Given** a service using SDK builders for identity and contracts, **When** the SDK composes metadata, **Then** a valid `spas.json` is produced with clear diagnostics on failure.
2. **Given** incomplete metadata fragments, **When** SDK validation runs, **Then** developers receive actionable errors referencing missing sections and constraints.

---

### User Story 2 - Dev Metadata Endpoint (Priority: P2)

Developers enable a dev-only endpoint `/_spas/metadata` to surface current metadata fragments for local aggregation and quick validation.

**Why this priority**: Speeds local iteration and feedback loops, reducing friction in early development.

**Independent Test**: Enable the endpoint in a sample service; request the endpoint; validate the returned archive contains `spas.json` and all contract schemas, each matching expected schema versions.

**Acceptance Scenarios**:

1. **Given** a service in development mode, **When** `/_spas/metadata` is queried, **Then** the endpoint returns an archive containing composed metadata (`spas.json`) and all contract schemas.
2. **Given** production mode, **When** `/_spas/metadata` is queried, **Then** the endpoint is disabled and responds with a safe message indicating non-availability.

---

### User Story 3 - Event Publishing with Trace (Priority: P3)

Publish domain events using SDK helpers with W3C Trace Context propagation for correlation through the sidecar.

**Why this priority**: Enables observability and consistent event-first workflows across services.

**Independent Test**: Publish a sample event; observe trace correlation via sidecar and tracing backend; verify headers and CloudEvents fields are populated.

**Acceptance Scenarios**:

1. **Given** an incoming request with trace headers, **When** the service publishes an event, **Then** the event includes trace and correlation identifiers.
2. **Given** no existing trace, **When** the service publishes an event, **Then** a new trace context is generated and propagated consistently.

---

[Add more user stories as needed, each with an assigned priority]

### User Story 4 - Opt-in Tracelog Middleware (Priority: P3)

Developers can enable a minimal tracelog middleware that captures request/response timing and attaches trace/correlation identifiers to logs for debugging.

**Why this priority**: Provides immediate observability value without over-scoping; advanced telemetry can follow later.

**Independent Test**: Enable middleware in a sample service; perform a request; verify logs contain trace/correlation IDs and timing metrics.

**Acceptance Scenarios**:

1. **Given** the tracelog middleware is enabled, **When** a request is processed, **Then** a log entry includes trace/correlation IDs and latency.
2. **Given** the middleware is disabled, **When** a request is processed, **Then** no tracelog entries are emitted by the SDK.

### Edge Cases

- What happens when metadata fragments conflict? SDK should detect and surface deterministic merge errors with guidance.
- How does system handle validation when schema evolves? Provide versioned schema checks and clear migration notes via diagnostics.

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: SDK MUST provide builders for identity, contracts, security, and health metadata.
- **FR-002**: SDK MUST enable composing `spas.json` that validates against the repository schema with clear diagnostics.
- **FR-003**: SDK MUST provide a dev-only `/_spas/metadata` endpoint, disabled in production and controlled by environment/config.
- **FR-004**: SDK MUST provide event publishing helpers that send raw payload via HTTP POST with CloudEvents metadata propagated via HTTP headers (`traceparent`, `x-service-name`, `x-event-type`, `x-correlation-id`, `x-user-id`, `x-tenant-id`) for sidecar envelope construction.
- **FR-005**: SDK MUST offer inbound endpoint scaffolding (attributes/base classes) for commands, queries, and events. **[PoC: DEFERRED - using native ASP.NET Core minimal APIs with SPAS attributes instead]**
- **FR-006**: SDK MUST include configuration helpers for environment/file loading and a hook for secret sources. **[PoC: DEFERRED - using standard ASP.NET Core configuration]**
- **FR-007**: SDK MUST offer testing utilities including fixtures and stub generators for contracts and events.
- **FR-008**: SDK MUST provide lightweight identity propagation helpers (principal/claims accessors) for handlers and event publishing.
- **FR-009**: SDK MUST provide an opt-in tracelog middleware that records request/response timing and includes trace/correlation identifiers in logs.

### Testing Approach

- Unit tests are REQUIRED for each user story (PoC and Production). SpecKit task generation MUST include unit test tasks per story.
- Integration tests are OPTIONAL during PoC unless explicitly requested in this spec; they become REQUIRED before any non-PoC SDK release.

### Key Entities _(include if feature involves data)_

- **Service Metadata**: Identity, contracts, security, health; composed into `spas.json`.
- **Event Publishing Context**: Topic (routing), eventType (CloudEvents type), payload (domain data), propagated via HTTP headers to sidecar.
- **Inbound Request Context**: Trace context, correlation ID, identity claims; propagated via HTTP headers from sidecar to service.

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Developers can compose a valid `spas.json` in under 2 minutes from a new project scaffold.
- **SC-002**: 95% of published events include trace and correlation identifiers end-to-end.
- **SC-003**: Dev metadata endpoint returns schema-valid content consistently during local runs.
- **SC-004**: A sample service demonstrates publish/subscribe flows mediated by the sidecar.

## Clarifications

### Session 2025-12-12

- Q: Should P1 include CLI/repository involvement for metadata composition? → A: SDK-only; defer CLI/repo.
- Q: What should `/_spas/metadata` return in dev mode? → A: Archive including `spas.json` + all contract schemas.
- Q: Should identity propagation and authorization integrations be included now? → A: Include identity helpers now; defer authorization integrations to later.
- Q: Should observability middleware be included now? → A: Include minimal opt-in tracelog middleware now; defer advanced observability features.

## Assumptions

- PoC uses HTTP transport and identity embedded in payloads.
- Repository validation is file-based; production may move to a managed store.
- Sidecar runs on Node.js with Zipkin-compatible tracing via OpenTelemetry.

## Dependencies

- Constitution boundaries: SDK vs CLI vs Repository.
- Sidecar configuration and event protocol.

## Out of Scope

- Production-grade outbox, mTLS/SPIFFE enforcement, and gRPC scaffolding.
- Full authorization middleware integrations (e.g., provider-specific authentication wiring) for this feature.
- Advanced observability features (metrics pipelines, span exporters, configurable sinks) beyond minimal tracelog middleware.
- Inbound handler scaffolding (FR-005) - deferred in favor of native ASP.NET Core minimal APIs.
- Custom configuration helpers (FR-006) - using standard ASP.NET Core configuration instead.
