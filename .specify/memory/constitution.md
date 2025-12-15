<!--
Sync Impact Report (v1.0.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: 1.0.4 → 1.0.5 (PATCH)
Amended: 2025-12-15 (PoC Phase)

Changes:
  • Renamed spas-compose command: `choreography deploy` → `choreography build`
  • Updated principles/13-cli.md: Moved from command syntax details to responsibility-focused design
  • Updated all spec files (006, 007), README, and decision log with new command name

Impact:
  • `spas-compose choreography build --docker` now is the primary command
  • Better clarity: build = generate artifacts; deploy = run containers (docker compose up)
  • Principles now focus on responsibilities; component READMEs document syntax

Previous (v1.0.4):
  • Updated spas-compose CLI commands: init, services pull, choreography deploy (replaces context init, choreography init, choreography generate)
  • Added AI-in-the-loop composition approach (/spas.compose agent prompt)
  • Aligned with ADR-036 (JSONata), ADR-037 (AI composition), ADR-038 (sidecar language flexibility)

Impact:
  • spas-compose spec (005) should use simplified command structure
  • Transformation files use .jsonata format for sidecar language flexibility
  • Agent prompt at .github/agents/spas-compose.md drives choreography composition

Previous (v1.0.3):
  • Clarified Events boundary (SDK prepares payload/context; Sidecar wraps CloudEvents)
  • Softened inbound path convention from mandatory to recommended (route-agnostic SDK)
  • Clarified SpecKit testing defaults for PoC task generation: unit tests are mandatory; integration test tasks may be omitted unless explicitly requested. Independent test criteria remain mandatory. Does not relax SDK quality gates for non‑PoC releases.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# SPAS Framework Constitution

## Core Principles

These principles apply universally to all SPAS framework components, services, tools, and documentation.

### I. Single Bounded Context Per Service (NON-NEGOTIABLE)

**Rule**: Each SPAS service MUST encapsulate exactly one bounded context with its own domain model, state, and invariants.

**Rationale**: Enforces strong boundaries, prevents distributed monoliths, enables independent evolution and deployment.

**Verification**:

- Conceptual: Service name and purpose align to single domain concept
- Machine: Service metadata (`spas.json`) declares single `boundedContext` field
- Review: Architecture reviews validate bounded context isolation

**Consequences of Violation**: Service cannot be certified as SPAS-compliant; deployment blocked by validation gates.

---

### II. No Direct Service-to-Service Communication (NON-NEGOTIABLE)

**Rule**: All service-to-service traffic MUST flow through sidecars. Services MAY NOT make direct HTTP/gRPC calls to other services.

**Rationale**: Enables transformation, observability, policy enforcement, and protocol evolution without service code changes.

**Verification**:

- Machine: Network policies deny direct service-to-service routes
- Machine: Choreography configuration validates all invocations route through sidecars
- Runtime: Observability traces show sidecar mediation

**Consequences of Violation**: Runtime network policy blocks unauthorized traffic; service fails compliance validation.

---

### III. Event-First Integration

**Rule**: East-West (service-to-service) communication MUST default to asynchronous events. Synchronous invocation patterns (commands/queries) are permitted only when explicitly configured in `choreography.yaml` and mediated by sidecars.

**Rationale**: Decouples services, enables eventual consistency, supports choreography patterns, maintains system resilience.

**Verification**:

- Machine: Service contract declares `events.published[]` and `events.subscribed[]`
- Machine: Choreography configuration validates event routing and transformations
- Machine: Direct invocation rules explicitly configured in choreography

**Consequences of Violation**: Choreography validation fails; deployment blocked.

---

### IV. Convention Over Configuration

**Rule**: Services MUST follow naming conventions:

- `SERVICE_NAME` is the single source of identity
- Sidecar hostname: `${SERVICE_NAME}-sidecar`
- Service invocation: sidecar composes URL from `SERVICE_NAME` + `SERVICE_PORT`
- Recommended inbound base path: `/incoming` (relative path). SDKs SHOULD be route‑agnostic; services MAY choose a different path. Sidecar/choreography mappings MUST NOT rely on a fixed path.

**Rationale**: Reduces per-service configuration, ensures consistency, simplifies choreography composition, enables automation.

**Verification**:

- Machine: Service metadata validates `SERVICE_NAME` format (lowercase, hyphen-separated)
- Machine: Deployment manifests follow hostname conventions
- Machine: Choreography references use `SERVICE_NAME` identifiers; inbound route is discoverable via service metadata or configuration where applicable (not hard‑coded)

**Consequences of Violation**: Service discovery fails; choreography generation produces invalid configuration.

---

### V. Security by Default (Zero-Trust)

**Rule**: All components MUST implement zero-trust security:

- **PoC**: OIDC/JWT at edge; identity in CloudEvents payload (East-West)
- **Production**: mTLS for all East-West communication; SPIFFE/SPIRE for identity

Services MUST:

- Declare data classification in metadata
- Declare network enclosure level (`strict` | `moderate` | `open`)
- Accept and propagate W3C Trace Context for correlation

**Rationale**: Prevents unauthorized access, ensures data protection, enables audit trails, supports regulatory compliance.

**Verification**:

- Machine: Metadata validation checks `security.dataClassification` and `security.enclosureLevel` fields
- Machine (Production): mTLS certificate validation on all connections
- Machine: Trace context validation in all requests/events

**Consequences of Violation**: Security gates block deployment; runtime policy enforcement denies unauthorized traffic.

---

### VI. Observability First

**Rule**: All components MUST emit:

- **Traces**: W3C Trace Context propagated through all operations
- **Metrics**: Prometheus format (request rate, errors, latency p50/p95/p99)
- **Logs**: Structured JSON logs with correlation IDs
- **Health**: Liveness (`/health`) and readiness (`/ready`) endpoints

**Rationale**: Enables debugging, performance analysis, incident response, capacity planning, SLO monitoring.

**Verification**:

- Machine: Service metadata declares health endpoint paths
- Runtime: Distributed tracing validates trace ID propagation
- Runtime: Metrics endpoint returns valid Prometheus format

**Consequences of Violation**: Service fails health checks; deployment blocked; operational visibility lost.

---

### VII. Portable Packaging

**Rule**: All services MUST be packaged as OCI container images with:

- Non-root user execution
- Minimal base image (distroless preferred)
- Health endpoints
- No host-specific dependencies

Services MUST run unchanged across Kubernetes, Docker Compose, and bare metal environments.

**Rationale**: Enables deployment flexibility, improves security posture, reduces operational overhead, supports local development.

**Verification**:

- Machine: Image scanning validates non-root user, minimal layers
- Integration tests: Same image tested on Kubernetes + Docker Compose
- Machine: Dockerfile lint checks for best practices

**Consequences of Violation**: Image fails security scan; deployment blocked.

---

### VIII. Adaptable Through Configuration

**Rule**: Services MUST join Domain Contexts through configuration (`choreography.yaml`), not code changes. Services expose internal schemas; sidecars perform transformations defined in choreography.

**Rationale**: Enables service reuse across domains, decouples domain-specific logic from service implementation, supports multi-tenancy patterns.

**Verification**:

- Machine: Service exposes internal schema unchanged across deployments
- Machine: Choreography validates transformation mappings reference correct schemas
- Integration tests: Same service image deployed to multiple Domain Contexts

**Consequences of Violation**: Service coupling detected; domain composition fails validation.

---

## PoC vs Production Distinction

**PoC Simplifications** (Current Phase):

- HTTP transport (not gRPC)
- Identity in CloudEvents payload (not mTLS/SPIFFE)
- Zipkin-only observability (not full OpenTelemetry + Prometheus)
- SQLite repository storage (not PostgreSQL + S3)
- No contract testing framework
- Declarative-only security policies (not runtime enforcement)
- SpecKit testing policy: Unit test tasks MUST be included per user story in generated task lists. Integration test tasks MAY be omitted during PoC unless explicitly requested in the feature spec. Independent test criteria per user story are MANDATORY. This simplification does NOT waive component Quality Gates for non‑PoC releases.

**Production Requirements** (Future):

- gRPC for all service APIs
- mTLS with SPIFFE/SPIRE for identity
- Full OpenTelemetry + Prometheus metrics
- PostgreSQL (JSONB) + S3 for repository storage
- Contract testing framework (Pact-style)
- Runtime policy enforcement via service mesh

**Rationale**: PoC prioritizes rapid validation of architecture patterns over production-grade infrastructure. All PoC implementations MUST be designed for future production migration.

**Verification**: Specifications marked with `> PoC vs Production` admonition blocks distinguish requirements.

> Note (Testing Policy, SpecKit): Where a feature spec omits explicit test requirements, SpecKit may generate tasks without automated test tasks. This is a planning convenience during PoC and does not modify component Quality Gates defined in this Constitution. Prior to any non‑PoC SDK release, teams MUST meet applicable Quality Gates (e.g., unit/integration test expectations).

---

## Component Constitutions

### SDK Components

**Scope**: .NET, Java, Node.js, Python, Go SDKs enabling SPAS service development.

**Mandatory Capabilities**:

- Metadata authoring and validation (`spas.json`)
- CloudEvents helpers with W3C Trace Context propagation
- Event publishing to sidecar with basic reliability
- Inbound endpoint scaffolding (attributes/base classes)
- Configuration loading (env variables, files, secret sources)
- Testing utilities (schema-driven fixtures, stub generators)

**Design Constraints**:

- NO mandatory external infrastructure (work locally with file/env config)
- NO duplication of sidecar concerns (avoid mesh-specific clients)
- Pluggable abstractions for transport, storage, secrets

**Design-time Metadata Endpoint — Intent & Boundaries**:

- Optional, dev/local only: expose `/_spas/metadata` to aggregate SDK‑registered metadata fragments into a canonical, schema‑valid `spas.json` for CLI consumption.
- Aggregation only: no persistence or publishing; the CLI orchestrates composition, pack, and publish operations.
- Production guidance: endpoint SHOULD be disabled; CLI composes from design‑time files/SDK outputs and publishes to the repository.
- Validation: fail fast with clear diagnostics when fragments are incomplete or inconsistent.

**Quality Gates**:
Unit tests are non‑negotiable in both PoC and Production phases. During PoC, integration tests MAY be deferred unless the feature scope requires them; prior to any non‑PoC release, integration tests MUST be in place per capability.
**Events — Preparation vs Wrapping (Explicit Boundary)**:

- SDK Responsibilities: Prepare event payloads, attach and propagate W3C Trace Context and correlation identifiers, and surface identity claims to publishing code. Provide helpers to construct payloads and pass context to the sidecar publish endpoint.
- Sidecar Responsibilities: Wrap outgoing events into CloudEvents 1.0 envelopes, inject/propagate trace and correlation context, and perform any required domain/internal transformations configured in choreography.
- Prohibitions: SDK MUST NOT construct CloudEvents envelopes or duplicate transformation logic owned by sidecar; this prevents coupling and preserves observability/policy boundaries.

- Unit test coverage ≥ 80%
- Integration tests for metadata round-trip serialization (MAY be deferred in PoC; REQUIRED before non‑PoC release)
- Examples demonstrating each capability
- Clear error messages for validation failures

**Consequences of Non-Compliance**: SDK release blocked; language support delayed.

---

### CLI Tools

**Scope**: `spas-service` and `spas-compose` command-line tools.

**Mandatory Commands** (PoC):

- Service: `init`, `publish` (with `--dry-run`, `--archive` flags), `pull`
- Compose: `init`, `services pull`, `choreography build` (with `--docker`, `--dry-run` flags)

> **AI-in-the-Loop**: Choreography composition uses `/spas.compose` agent prompt for iterative contract analysis and transformation generation. CLI provides scaffolding and deployment; AI assists with semantic composition.

**Design Constraints**:

- Text I/O protocol: stdin/args → stdout, errors → stderr
- Support JSON + human-readable formats
- Exit codes: 0 (success), non-zero (failure with descriptive stderr)
- Idempotent operations (safe to re-run)

**Responsibilities & Boundaries**:

- Composition: Deterministically compose canonical `spas.json` from design‑time files and/or SDK outputs.
- Packaging: Produce distributable artifacts per package format (images, metadata bundles).
- Publishing: Push canonical metadata and schemas to the Repository via its API.
- Dev Integration: MAY call the service’s dev‑only `/_spas/metadata` endpoint to fetch an aggregated view; MUST NOT rely on it in production.
- No Aggregation Logic Ownership: CLI orchestrates composition but does not persist runtime metadata; Repository is the source of truth post‑publish.

**Quality Gates**:

- Integration tests for complete workflows (init → pack → publish → pull → generate)
- Error messages include actionable remediation steps
- Help text follows consistent format across commands

**Consequences of Non-Compliance**: CLI release blocked; developer workflows broken.

---

### Repository Service

**Scope**: SPAS Repository for metadata and schema storage.

**Mandatory Endpoints**:

- `GET /services` - List all services
- `GET /services/{name}/{version}` - Get service metadata
- `POST /services/{name}/{version}` - Publish service metadata
- `GET /schemas/{schemaId}` - Get schema definition

**Design Constraints**:

- RESTful API design
- PoC: SQLite (embedded, ACID, JSON queries); Production: PostgreSQL (JSONB) + S3
- Storage abstraction layer (IStorageProvider) for migration path
- Metadata validation against `spas.json` JSON schema
- Schema versioning and compatibility checks (additive-only evolution)

**Responsibilities & Boundaries**:

- Storage of canonical service metadata (`spas.json`) and schemas; becomes source of truth after publish.
- Validation on publish: enforce schema validity, versioning rules, and additive‑only evolution for events/schemas.
- Retrieval: serve metadata and schemas to CLI and other tooling; no design‑time aggregation responsibilities.
- No Dev Endpoint: Repository does not host the service’s aggregation; design‑time aggregation remains in the service/SDK domain when enabled.

**Quality Gates**:

- API contract tests validate all endpoints
- Metadata validation catches malformed `spas.json`
- Storage abstraction enables swapping PoC → Production backend

**Consequences of Non-Compliance**: Repository release blocked; service discovery broken.

---

### Sidecar Component

**Scope**: SPAS Sidecar for transformation, messaging, and policy enforcement.

**Mandatory Capabilities**:

- Event transformation (inbound: domain→internal, outbound: internal→domain)
- CloudEvents 1.0 wrapping with W3C Trace Context embedding
- Redis Streams pub/sub (PoC); configurable message broker (Production)
- Sidecar-mediated invocation for commands/queries
- Distributed tracing (Zipkin PoC; OpenTelemetry Production)
- Configuration-driven routing and transformation

**Design Constraints**:

- Configuration via sidecar config files (business logic) + environment variables (infrastructure)
- No service code changes required for new transformations
- Stateless operation (transformations are pure functions)

**Quality Gates**:

- End-to-end trace correlation verified (same trace ID through full flow)
- Transformation mappings validated against schemas
- Performance: <10ms transformation latency at p95

**Consequences of Non-Compliance**: Choreography broken; distributed tracing lost; deployment blocked.

---

### SPAS Services

**Scope**: Application services implementing business logic.

**Mandatory Requirements**:

- Align to single bounded context (ADR-008)
- Provide service contract (HTTP OpenAPI PoC; gRPC proto Production)
- Provide event contracts (`events.published[]`, `events.subscribed[]`)
- Package as OCI image with health endpoints
- Provide `spas.json` metadata
- Emit OpenTelemetry traces, Prometheus metrics, structured JSON logs
- Accept identity propagation (JWT PoC; SPIFFE Production)

**Design Freedoms**:

- State management pattern (CRUD, event sourcing, CQRS, etc.)
- Persistence choice (external store, in-memory, etc.)
- Consistency model (ACID for commands, eventual for queries)
- Programming language (any with SDK support)

**Quality Gates**:

- Service metadata passes JSON schema validation
- Health endpoints return 200 OK when ready
- Contract tests verify published/subscribed event schemas
- Integration tests validate choreography participation

**Consequences of Non-Compliance**: Service fails SPAS compliance validation; deployment blocked.

---

## Governance

### Amendment Process

1. **Proposal**: Submit ADR (Architecture Decision Record) to `principles/appendix/28-decision-log.md`
2. **Discussion**: Review with framework maintainers and community
3. **Approval**: Consensus required from core maintainers
4. **Migration Plan**: Document impact on existing components and migration path
5. **Constitution Update**: Increment version using semantic versioning:
   - **MAJOR**: Backward-incompatible governance/principle changes
   - **MINOR**: New principle/section added or materially expanded
   - **PATCH**: Clarifications, wording, typo fixes

### Compliance Enforcement

- All PRs MUST verify compliance with applicable constitutional principles
- Automated validation gates check machine-verifiable rules
- Manual reviews validate conceptual adherence (bounded context alignment, etc.)
- Non-compliant code MAY NOT be merged or deployed

### Conflict Resolution

1. **Constitution supersedes all other documentation** (TASKS.md, README.md, individual specs)
2. If conflict exists: Constitution takes precedence → Update conflicting documents
3. If ambiguity exists: File ADR to clarify → Update constitution

### Version Control

All constitution changes MUST:

- Update `LAST_AMENDED_DATE` to current date (ISO 8601 format)
- Increment `CONSTITUTION_VERSION` per semantic versioning rules
- Prepend Sync Impact Report (HTML comment at top of file)
- Update dependent templates/docs within same PR

**Version**: 1.0.4 | **Ratified**: 2025-12-12 | **Last Amended**: 2025-12-14
