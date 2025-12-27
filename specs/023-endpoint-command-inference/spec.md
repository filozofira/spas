# Feature Specification: SDK Simplification for AI-Assisted Development

**Feature Branch**: `023-endpoint-command-inference`  
**Created**: 2025-12-27  
**Completed**: 2025-12-27
**Status**: ✅ Complete (PoC)  
**Input**: User description: "Simplify .Net SDK to support Endpoint-Centric Command Schema Inference. Allow plain DTOs without [SpasCommand] attribute. Simplify EventPublisher to expose only the type-safe generic method. Reduces 'forgot to decorate DTO' and 'used wrong publish method' errors from developers and AI agents."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plain DTO Schema Inference (Priority: P1)

As a developer, I want to define a command endpoint using `[SpasCommand]` on the handler method and use a plain DTO (record/class) as the request body **without any attributes on the DTO**, so that I write minimal boilerplate and eliminate "forgot to decorate" errors.

**Why this priority**: This is the core value proposition. Developers and AI agents should only need to place `[SpasCommand]` on the endpoint handler—the SDK infers the schema entirely from the parameter type. DTOs remain plain data structures with no SPAS-specific attributes.

**Independent Test**: Can be fully tested by creating a minimal API endpoint with `[SpasCommand]` on the handler and a plain record as the request body, then verifying that metadata generation produces a correct JSON schema for that DTO.

**Acceptance Scenarios**:

1. **Given** an endpoint decorated with `[SpasCommand("CreateOrder", "1.0")]` that accepts a plain `CreateOrderRequest` record as a parameter, **When** metadata generation runs, **Then** a JSON schema is generated for `CreateOrderRequest` at `schemas/endpoints/create-order.schema.json` and the endpoint metadata references this schema.
2. **Given** an endpoint with `[SpasCommand]` that accepts a primitive type (e.g., `string`, `int`) as a parameter, **When** metadata generation runs, **Then** a minimal schema (or no schema) is generated for that primitive and the endpoint still appears in metadata.
3. **Given** an endpoint with `[SpasCommand]` that accepts no body parameter (e.g., route-only), **When** metadata generation runs, **Then** the endpoint metadata is generated without a schema reference.

---

### User Story 2 - AI Agent Service Scaffolding (Priority: P1)

As an AI agent generating SPAS service code, I want to create command endpoints with plain DTOs and have the SDK automatically infer schemas, so that I produce working services without needing to remember any DTO-specific attributes.

**Why this priority**: AI agents frequently generate DTOs without attributes, causing metadata generation failures. By removing the requirement entirely, AI-generated code works correctly by default.

**Independent Test**: Can be fully tested by generating a service with the AI agent prompt, running metadata generation, and verifying complete metadata is produced with schemas for all command endpoints.

**Acceptance Scenarios**:

1. **Given** an AI agent generates code with `[SpasCommand]` on endpoints and plain record DTOs (no attributes), **When** the developer runs `--generate-metadata`, **Then** metadata generation succeeds and includes schemas for all command DTOs.
2. **Given** an AI agent generates a complete service following the prompt guidance, **When** metadata validation runs, **Then** no errors are reported and the metadata archive is valid.

---

### User Story 3 - Remove DTO Attributes from Existing Services (Priority: P2)

As a developer with existing SPAS services, I want to remove `[SpasCommand]` attributes from my DTO classes and have metadata generation continue to work, so that I can simplify my codebase.

**Why this priority**: Migration story. Existing services should be able to clean up redundant DTO attributes without breaking anything.

**Independent Test**: Can be fully tested by taking an existing example service, removing all `[SpasCommand]` attributes from DTOs, and verifying metadata generation produces identical output.

**Acceptance Scenarios**:

1. **Given** an existing service with `[SpasCommand]` on both endpoints and DTOs, **When** the developer removes all `[SpasCommand]` attributes from DTO classes and runs metadata generation, **Then** the generated metadata is functionally equivalent to before.
2. **Given** a DTO class that previously had `[SpasCommand]` with a custom description, **When** the attribute is removed, **Then** the endpoint's `[SpasCommand]` description (if any) is used instead, or the schema has no description.

---

### User Story 4 - Simplified Event Publishing API (Priority: P1)

As an AI agent generating SPAS service code, I want only one way to publish events—using the generic `PublishAsync<TEvent>(payload)` method—so that I cannot accidentally use a wrong method that bypasses event type validation.

**Why this priority**: The current `EventPublisher` exposes `PublishAsync(string eventName, object payload)` which allows AI agents to hardcode event names instead of using the type-safe generic method. This creates the same class of errors as DTO attributes: agents pick the "easier" method and introduce bugs.

**Independent Test**: Can be fully tested by verifying that generated service code uses `PublishAsync<TEvent>(...)` and that the explicit `eventName` overload is not accessible from consuming code.

**Acceptance Scenarios**:

1. **Given** an AI agent scaffolds a service that publishes events, **When** the agent generates event publishing code, **Then** only `PublishAsync<TEvent>(object payload)` is available as a public API.
2. **Given** a developer attempts to call `PublishAsync(string eventName, object payload)`, **When** they compile the code, **Then** the method is not accessible (internal/private) and compilation fails.
3. **Given** an existing service that uses `PublishAsync<TEvent>(payload)`, **When** the SDK is updated, **Then** the service continues to compile and function correctly.

---

### Edge Cases

- **No request body**: Endpoint with `[SpasCommand]` but no body parameter (e.g., `DELETE /orders/{id}`) should generate endpoint metadata without a schema reference.
- **Primitive body**: Endpoint accepting a primitive type (e.g., `string orderId`) should generate a minimal schema or skip schema generation gracefully.
- **Complex nested types**: DTO containing nested records/classes should have all nested types included in the generated schema.
- **Query endpoints**: `[SpasQuery]` endpoints should follow the same inference pattern for request DTOs.
- **Multiple endpoints using same DTO**: When multiple endpoints use the same DTO type, each endpoint should reference the same generated schema (deduplication).
- **DTO with leftover attributes**: If a DTO still has `[SpasCommand]` (legacy code), the SDK should ignore it and use endpoint-based inference only.
- **Event type without attribute**: If `PublishAsync<TEvent>` is called with a type lacking `[SpasEvent]`, the SDK should throw a clear exception at runtime.

## Requirements *(mandatory)*

### Functional Requirements

#### Command/Query Schema Inference

- **FR-001**: SDK MUST infer the JSON schema from the endpoint handler's request body parameter type. DTOs do not require any SPAS attributes.
- **FR-002**: SDK MUST ignore any `[SpasCommand]` or `[SpasQuery]` attributes on DTO types—schema inference is always endpoint-centric.
- **FR-003**: SDK MUST generate a JSON schema file for each DTO type at the path `schemas/endpoints/{command-name}.schema.json` (matching existing convention).
- **FR-004**: SDK MUST handle endpoints with no request body parameter by omitting the schema reference in metadata.
- **FR-005**: SDK MUST handle endpoints with primitive request types by generating a minimal schema or omitting the schema reference.
- **FR-006**: SDK MUST deduplicate schema generation when multiple endpoints use the same DTO type, producing only one schema file.
- **FR-007**: SDK MUST apply the same inference logic to `[SpasQuery]` endpoints for consistency.

#### Event Publishing API Simplification

- **FR-008**: SDK MUST expose only `PublishAsync<TEvent>(object payload)` as a public method for event publishing; the `PublishAsync(string eventName, object payload)` overload MUST be made internal or private.
- **FR-009**: SDK MUST throw a clear `InvalidOperationException` if `PublishAsync<TEvent>` is called with a type that lacks `[SpasEvent]` attribute.
- **FR-010**: SDK MUST preserve the internal implementation that derives event name from `[SpasEvent]` attribute (no functional change to event routing).

### Key Entities

- **Endpoint Metadata**: The `[SpasCommand]` or `[SpasQuery]` attribute on the handler method, containing name, version, description, and optional schema path override.
- **Request DTO**: A plain class or record type used as the request body parameter for an endpoint. No SPAS attributes required or expected.
- **Generated Schema**: A JSON Schema document describing the structure of the request DTO, derived from the .NET type.
- **Event Type**: A class decorated with `[SpasEvent]` attribute, used as the type parameter for `PublishAsync<TEvent>`.

### Out of Scope

- **Removing `[SpasCommand]` attribute class from SDK**: The attribute remains for use on endpoints; it is simply no longer used on DTOs.
- **DTO-level metadata (e.g., custom schema path on DTO)**: All schema configuration comes from the endpoint attribute.
- **Removing `[SpasEvent]` attribute requirement**: Events still require the attribute for name/version; only the explicit eventName publishing overload is removed.

## Assumptions

- The SDK already has infrastructure for generating JSON schemas from .NET types (via `SchemaGenerator`).
- Minimal API parameter binding conventions are used (request body is the first complex-type parameter not bound to route/query).
- The schema naming convention uses kebab-case derived from the command/query name (e.g., `CreateOrder` → `create-order.schema.json`).
- All example services and tests currently use `PublishAsync<TEvent>(payload)`, not the explicit eventName overload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can define a command endpoint with a plain DTO (no attributes on DTO) and successfully generate complete metadata in under 30 seconds.
- **SC-002**: Existing example services generate functionally equivalent metadata after removing `[SpasCommand]` from all DTOs.
- **SC-003**: 100% of AI-agent-generated services with plain DTOs produce valid metadata archives on first attempt.
- **SC-004**: The SDK documentation and agent prompts are simplified by removing all references to DTO decoration requirements and explicit eventName publishing.
- **SC-005**: Zero DTO classes in example services require `[SpasCommand]` attributes after migration.
- **SC-006**: AI agents cannot generate code that uses the explicit `PublishAsync(string eventName, ...)` overload (method not publicly accessible).
