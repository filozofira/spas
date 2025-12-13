# Feature Specification: Service Metadata Schema Alignment

**Feature Branch**: `002-metadata-schema-alignment`  
**Created**: 2025-12-13  
**Status**: Draft  
**Input**: User description: "Service Metadata Schema Alignment - Align .NET SDK spas.json output with 06-service-metadata.md specification"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Schema Consistency Across Framework (Priority: P1)

Service developers using the .NET SDK must generate `spas.json` that exactly matches the structure defined in the SPAS specification (06-service-metadata.md), ensuring repository validation, CLI tooling, and cross-language SDK implementations all work with a consistent schema.

**Why this priority**: Schema alignment is foundational - mismatched schemas break repository validation, CLI commands, and prevent services from being SPAS-compliant. This blocks all downstream features (repository, CLI, choreography).

**Independent Test**: Generate `spas.json` from SDK; validate against spec schema; verify all required fields present and correctly structured.

**Acceptance Scenarios**:

1. **Given** a service using SDK metadata builders, **When** `spas.json` is composed, **Then** the output matches the flat structure with `id`, `version`, `boundedContext`, `capabilities`, `endpoints[]`, etc. as defined in 06-service-metadata.md
2. **Given** SDK-generated metadata, **When** validated against the specification JSON schema, **Then** validation passes without errors
3. **Given** multiple SDK language implementations (future), **When** each generates metadata, **Then** all produce identical structure for equivalent service definitions

---

### Edge Cases

- How do we migrate existing nested SDK output (`identity`, `contracts`) to the flat schema without ambiguity?
- How are HTTP vs gRPC endpoints represented consistently across PoC and Production?
- How is outbound-only events modeling enforced so inbound events are handled via choreography/sidecar rather than metadata entries?
- How are missing required fields handled (`boundedContext`, `capabilities`, `runtime`, `consistency`, `network`) and surfaced with diagnostics?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: SDK MUST generate and validate design-time metadata against `design-time-metadata-v1` (no runtime emission from SDK)
- **FR-002**: SDK MUST include required fields: `id`, `name`, `description`, `version`, `boundedContext`, `capabilities`, `endpoints[]`, `events[]`, `consistency`, `network.requiredEgress`, `security`, `license`, and `schemaVersion`
- **FR-003**: SDK MUST represent commands and queries as a single `endpoints[]` array with `type` (`Command`|`Query`), `protocol` (`Http`|`gRPC`), `methodPath` (HTTP route or gRPC method path), `version`, `schemaRef` (reference to registry or local schema)
- **FR-004**: SDK MUST support outbound-only `events[]` with `type`, `version`, `schemaRef`; inbound events are handled via choreography/sidecar, not listed in metadata
- **FR-005**: SDK MUST include `consistency` (`commands`: ACID, `queries`: STRONG|EVENTUAL)
- **FR-006**: SDK MUST include `network.requiredEgress[]`; `allowedEgress` is determined later by choreography/domain context
- **FR-007**: SDK MUST include `security.authentication` (optional, e.g., jwt + requiredScopes) and required `dataClassification[]`; the prior `level` field is removed and determined later by choreography/domain context
- **FR-008**: SDK MUST emit `schemaVersion` corresponding to the design-time schema version
- **FR-009**: SDK MUST emit `schemaVersion` but is not required to ship the design-time JSON schema; validation artifacts can be provided by CLI/repository later
- **FR-010**: Runtime metadata schema (`runtime-metadata-v1`) is defined in spec but will be owned/validated by the Repository component (SDK does not emit runtime metadata)

### Key Entities

- **Service Metadata (Design-Time)**: identity, capabilities, endpoints (commands/queries), outbound events, consistency, required egress, authentication (optional), data classification, license, schemaVersion
- **Service Metadata (Runtime, for repository)**: design-time fields plus runtime image/env/resources (emitted by repository tooling, not SDK)
- **Endpoint Contract**: protocol-agnostic path (`methodPath`) with type and version
- **Event Contract**: outbound events with CloudEvents `type` and schemaRef

## Clarifications (Resolved)

### Session 2025-12-13

- Q: Should endpoints carry `schemaRef` (like events) or inline `schema`? → A: Endpoints use `schemaRef` (reference to registry or local schema)
- Endpoint field strategy: use `methodPath` (protocol-agnostic) with `protocol` to distinguish HTTP vs gRPC; single endpoints array for commands/queries
- Security model: replace `level` with optional `authentication` (e.g., jwt + requiredScopes) plus `dataClassification[]`; choreography governs domain-context security level
- Health representation: rely on standard health endpoints/convention; no dedicated health block in the schema
- Events direction: outbound-only `events[]`; inbound handled via choreography/sidecar
- Schema versioning: define two schemas (`design-time-metadata-v1`, `runtime-metadata-v1`) and emit `schemaVersion`
- Ownership split: SDK generates/validates design-time metadata only; repository will own runtime metadata emission/validation

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of SDK-generated design-time metadata validates against `design-time-metadata-v1` schema
- **SC-002**: SDK emits `schemaVersion=design-time-metadata-v1`; schema file distribution is deferred to CLI/repository for validation (SDK stays slim)
- **SC-003**: No structural diffs between SDK design-time output and aligned examples (methodPath, outbound-only events, authentication block, requiredEgress)
- **SC-004**: CLI consumes SDK-generated design-time metadata directly without compatibility layers
- **SC-005**: Runtime schema `runtime-metadata-v1` is defined in spec for repository consumption (validation owned by repository phase)

## Assumptions

- 06-service-metadata.md will be updated to the aligned design-time/runtime schemas and becomes authoritative
- PoC uses HTTP `protocol` with `methodPath` as HTTP route; Production uses `protocol: gRPC` with `methodPath` as gRPC method path
- Authentication block is optional; dataClassification is required; idempotency remains deferred in PoC
- Repository validation (Phase 2) will consume runtime schema; CLI will consume design-time schema; SDK generates design-time metadata only
- Design-time schema will live in the spec repo and may be distributed with CLI/repository for validation; SDK need not ship it

## Dependencies

- Constitution boundaries and SDK responsibilities
- Repository specification (11-repository-spec.md) expects specific schema format
- CLI tools (Phase 3) will consume this metadata format
- Existing .NET SDK implementation (specs/001-dotnet-spas-sdk)

## Platform

- SDK and sample projects target **.NET net10.0** (per csproj). Plans, tasks, and validation should assume net10.0 unless explicitly overridden.
- Testing framework: **xUnit** for SDK unit tests and validation tasks.

## Out of Scope

- Changing fundamental SDK architecture or builder patterns
- Adding new capability enums (use existing predefined list)
- Production-specific fields beyond PoC requirements (gRPC, mTLS, etc.)
- Backward compatibility layer for old schema format (breaking change acceptable for alignment)
