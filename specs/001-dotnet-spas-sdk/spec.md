# Feature Specification: .NET SPAS SDK

**Feature Branch**: [001-dotnet-spas-sdk]  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User description: ".Net SPAS SDK component to support building .Net SPAS compliant services."

## User Scenarios & Testing *(mandatory)*

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

Service developers author metadata fragments in code using SDK builders and generate a canonical `spas.json` via the CLI and repository validation. [NEEDS CLARIFICATION] What do you mean by `via the CLI and repository validation.`? I thought that this is plain SDK, just authoring metadata fragments using SDK builders. CLI and repo will be implemented later.

**Why this priority**: Metadata is foundational for service identity, contracts, and governance; without it, no SPAS-compliant service can exist.

**Independent Test**: Implement a sample service with minimal builders; run CLI to compose and validate `spas.json`; verify success without other SDK features.

**Acceptance Scenarios**:

1. **Given** a service using SDK builders for identity and contracts, **When** the CLI composes metadata, **Then** a schema-valid `spas.json` is produced with clear diagnostics on failure.
2. **Given** incomplete metadata fragments, **When** validation runs, **Then** developers receive actionable errors referencing missing sections and constraints.

---

### User Story 2 - Dev Metadata Endpoint (Priority: P2)

Developers enable a dev-only endpoint `/_spas/metadata` to surface current metadata fragments for local aggregation and quick validation.

**Why this priority**: Speeds local iteration and feedback loops, reducing friction in early development.

**Independent Test**: Enable the endpoint in a sample service; request the endpoint; validate the returned JSON matches schema and fragments.

**Acceptance Scenarios**:

1. **Given** a service in development mode, **When** `/_spas/metadata` is queried, **Then** the endpoint returns composed metadata matching the schema. [NEEDS CLARIFICATION] I am missing the message schemas which should also be downloaded via this endpoint. I.e. some early dialogs we spoke about returning a package with spas.json and all contract schemas as an archive file. Do you remember?
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

[NEEDS CLARIFICATION] Missing the user story for observability, i.e. some middleware that can write tracelogs should developer of SPAS service choose to enable this functionality. Is this planned for later features? 

[NEEDS CLARIFICATION] Missing the user story for identity propagation, i.e. some component which can be used to get hold of identity principle with claims etc. Is this planned for later features?

[NEEDS CLARIFICATION] Missing the user story for authorisation, i.e. should we already now add to SDK things like `services.AddAuthentication().AddMicrosoftIdentityWebApi(...)` in .Net, allowing developer to enable this when implementing SPAS compliant service. Is this planned for later features?

### Edge Cases

- What happens when metadata fragments conflict? SDK should detect and surface deterministic merge errors with guidance.
- How does system handle validation when schema evolves? Provide versioned schema checks and clear migration notes via diagnostics.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: SDK MUST provide builders for identity, contracts, security, and health metadata.
- **FR-002**: SDK MUST enable composing `spas.json` that validates against the repository schema with clear diagnostics.
- **FR-003**: SDK MUST provide a dev-only `/_spas/metadata` endpoint, disabled in production and controlled by environment/config.
- **FR-004**: SDK MUST provide CloudEvents helpers to build and publish events with W3C Trace Context and correlation identifiers.
- **FR-005**: SDK MUST offer inbound endpoint scaffolding (attributes/base classes) for commands, queries, and events.
- **FR-006**: SDK MUST include configuration helpers for environment/file loading and a hook for secret sources.
- **FR-007**: SDK MUST offer testing utilities including fixtures and stub generators for contracts and events.

### Key Entities *(include if feature involves data)*

- **Service Metadata**: Identity, contracts, security, health; composed into `spas.json`.
- **Event Envelope**: CloudEvents fields plus correlation/trace identifiers; payload carries identity in PoC.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Developers can compose a valid `spas.json` in under 2 minutes from a new project scaffold.
- **SC-002**: 95% of published events include trace and correlation identifiers end-to-end.
- **SC-003**: Dev metadata endpoint returns schema-valid content consistently during local runs.
- **SC-004**: A sample service demonstrates publish/subscribe flows mediated by the sidecar.

## Assumptions

- PoC uses HTTP transport and identity embedded in payloads.
- Repository validation is file-based; production may move to a managed store.
- Sidecar runs on Node.js with Zipkin-compatible tracing via OpenTelemetry.

## Dependencies

- Constitution boundaries: SDK vs CLI vs Repository.
- Sidecar configuration and event protocol.

## Out of Scope

- Production-grade outbox, mTLS/SPIFFE enforcement, and gRPC scaffolding.
