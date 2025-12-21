# Feature Specification: Metadata Descriptions for AI-Assisted Choreography

**Feature Branch**: `017-metadata-descriptions`  
**Created**: December 21, 2025  
**Status**: Draft  
**Input**: User description: "Extend SPAS metadata schemas and SDKs to support optional description fields on services, endpoints (commands/queries), and events. Update agent prompts to prioritize descriptions when reasoning about choreographies. Currently when AI agents propose choreographies, they rely solely on endpoint/event names which are often ambiguous. This causes volatile and frequently incorrect choreography suggestions, especially for complex domains or when multiple services have similar-sounding operations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schema Extensions for Descriptions (Priority: P1) 🎯 MVP

**Scenario**: As a **SPAS framework maintainer**, I need to extend metadata schemas to support optional description fields so that developers can provide semantic context for their services, endpoints, and events.

**Why this priority**: Foundation for all other stories. Without schema support, descriptions cannot be authored or consumed. Enables backward compatibility validation.

**Independent Test**: Can be fully tested by validating schema files accept optional description fields, reject invalid schemas, and pass-through existing metadata unchanged.

**Acceptance Scenarios**:

1. **Given** `design-time-metadata-v1.schema.json` and `runtime-metadata-v1.schema.json`, **When** a service metadata includes optional `description` on service, endpoints, and events, **Then** schema validation passes
2. **Given** existing service metadata without descriptions, **When** validated against new schemas, **Then** validation passes (backward compatible)
3. **Given** metadata with description fields, **When** transformed from design-time to runtime via repository, **Then** descriptions are preserved in output

---

### User Story 2 - Java SDK Description Support (Priority: P1) 🎯 MVP

**Scenario**: As a **Java service developer**, I want to add `description` attributes to `@SpasService`, `@SpasCommand`, `@SpasQuery`, and `@SpasEvent` annotations so that I can document the purpose of my service's capabilities for AI choreography agents.

**Why this priority**: Java is already in use (fulfillment-service, sample-service). Immediate value for existing services.

**Independent Test**: Can be tested by annotating a service with descriptions, running Maven compile, and verifying `spas.json` contains the descriptions in correct schema format.

**Acceptance Scenarios**:

1. **Given** a service class with `@SpasService(description = "Manages order fulfillment")`, **When** Maven compile runs, **Then** generated `spas.json` includes service description
2. **Given** an endpoint with `@SpasCommand(description = "Creates new shipment")`, **When** annotation processor runs, **Then** endpoint metadata includes description
3. **Given** an event with `@SpasEvent(description = "Shipment status updated")`, **When** metadata generated, **Then** event includes description
4. **Given** annotations without descriptions (backward compat), **When** metadata generated, **Then** description fields are omitted (not null/empty strings)

---

### User Story 3 - .NET SDK Description Support (Priority: P2)

**Scenario**: As a **.NET service developer**, I want to add `Description` properties to `[SpasService]`, `[SpasCommand]`, `[SpasQuery]`, and `[SpasEvent]` attributes so that I can provide semantic context for AI-driven choreography.

**Why this priority**: .NET SDK exists (order-service). Important for parity but Java already validated the pattern.

**Independent Test**: Can be tested by decorating a .NET service with descriptions, running build, and verifying metadata output matches schema requirements.

**Acceptance Scenarios**:

1. **Given** a service decorated with `[SpasService(Description = "Order management")]`, **When** metadata generation runs, **Then** output includes service description
2. **Given** endpoints with description attributes, **When** metadata published, **Then** repository stores descriptions
3. **Given** existing .NET services without descriptions, **When** rebuilt, **Then** metadata generation succeeds without descriptions

---

### User Story 4 - Agent Prompt Enhancement (Priority: P1) 🎯 MVP

**Scenario**: As a **SPAS choreography agent**, I need instructions to prioritize endpoint/event descriptions when proposing service compositions so that I make better-informed decisions and reduce incorrect suggestions.

**Why this priority**: Directly addresses the root problem. Without this, descriptions are ignored by agents.

**Independent Test**: Can be tested by giving agent a choreography task with services that have descriptions and verifying the agent references descriptions in its reasoning and selection logic.

**Acceptance Scenarios**:

1. **Given** agent instructions updated with description-first guidance, **When** agent proposes choreography for ambiguous requirement, **Then** agent references endpoint descriptions in reasoning
2. **Given** multiple endpoints with similar names but different descriptions, **When** agent matches user intent, **Then** agent selects endpoint whose description best matches intent
3. **Given** services pulled via `spas-compose services pull`, **When** agent analyzes contracts, **Then** descriptions are visible in agent's context

---

### User Story 5 - Example Service with Descriptions (Priority: P3)

**Scenario**: As a **SPAS adopter**, I need to see a working example of description usage so that I understand best practices for writing useful descriptions.

**Why this priority**: Education and validation. Demonstrates the feature but not required for technical capability.

**Independent Test**: Can be tested by reviewing example service annotations, verifying descriptions follow documented best practices, and confirming metadata generation works end-to-end.

**Acceptance Scenarios**:

1. **Given** fulfillment-service updated with descriptions, **When** service compiled and published, **Then** metadata includes descriptions at service, endpoint, and event levels
2. **Given** descriptions in example service, **When** developer reviews annotations, **Then** descriptions demonstrate good vs. bad patterns (purpose, inputs, side effects)
3. **Given** choreography using described services, **When** agent proposes connections, **Then** agent leverages descriptions for better matching

---

### Edge Cases

- What happens when a description contains special characters (quotes, newlines, unicode)?
- How does the system handle very long descriptions (>1000 characters)?
- What happens when design-time metadata has descriptions but runtime transformer strips them?
- How do agents handle services that mix described and undescribed endpoints?
- What if a description contradicts the endpoint name (misleading documentation)?

## Requirements *(mandatory)*

### Functional Requirements

#### Schema Changes

- **FR-001**: `design-time-metadata-v1.schema.json` MUST add optional `description` field (type: string) to service root object
- **FR-002**: `design-time-metadata-v1.schema.json` MUST add optional `description` field (type: string) to each object in `endpoints` array
- **FR-003**: `design-time-metadata-v1.schema.json` MUST add optional `description` field (type: string) to each object in `events` array
- **FR-004**: `runtime-metadata-v1.schema.json` MUST add optional `description` field (type: string) to service root object
- **FR-005**: `runtime-metadata-v1.schema.json` MUST add optional `description` field (type: string) to each object in `endpoints` array
- **FR-006**: `runtime-metadata-v1.schema.json` MUST add optional `description` field (type: string) to each object in `events` array
- **FR-007**: Schema validation MUST pass for metadata without description fields (backward compatibility)
- **FR-008**: Schema validation MUST reject description fields with non-string types

#### Java SDK

- **FR-009**: `@SpasService` annotation MUST support optional `description()` attribute (type: String, default: "")
- **FR-010**: `@SpasCommand` annotation MUST support optional `description()` attribute (type: String, default: "")
- **FR-011**: `@SpasQuery` annotation MUST support optional `description()` attribute (type: String, default: "")
- **FR-012**: `@SpasEvent` annotation MUST support optional `description()` attribute (type: String, default: "")
- **FR-013**: `SpasAnnotationProcessor` MUST emit `description` field in generated `spas.json` when annotation provides non-empty description
- **FR-014**: `SpasAnnotationProcessor` MUST omit `description` field (not emit empty string) when annotation has empty/default description
- **FR-015**: `SpasMetadataController` (runtime endpoint) MUST include descriptions when composing metadata response
- **FR-016**: Java SDK unit tests MUST validate description emission for all annotation types

#### .NET SDK

- **FR-017**: `[SpasService]` attribute MUST support optional `Description` property (type: string, default: null)
- **FR-018**: `[SpasCommand]` attribute MUST support optional `Description` property (type: string, default: null)
- **FR-019**: `[SpasQuery]` attribute MUST support optional `Description` property (type: string, default: null)
- **FR-020**: `[SpasEvent]` attribute MUST support optional `Description` property (type: string, default: null)
- **FR-021**: .NET metadata generation MUST emit `description` field when attribute provides non-null/non-empty description
- **FR-022**: .NET metadata generation MUST omit `description` field when attribute has null/empty description
- **FR-023**: .NET SDK unit tests MUST validate description emission for all attribute types

#### Repository & Transformer

- **FR-024**: `metadata-transformer.ts` (design-time → runtime) MUST preserve description fields from input metadata
- **FR-025**: Repository storage MUST accept and persist metadata with description fields
- **FR-026**: Repository API (`GET /services/{id}/versions/{version}`) MUST return descriptions in runtime-metadata response
- **FR-027**: Repository validation MUST accept metadata with and without descriptions

#### Agent Guidance

- **FR-028**: `.github/agents/copilot-instructions.md` MUST include instruction: "When proposing choreographies, prioritize endpoints and events whose descriptions match the user's intent. Descriptions are the authoritative source of semantic purpose."
- **FR-029**: Agent instruction MUST specify: "If multiple endpoints have similar names, use descriptions to disambiguate. Quote relevant description snippets in your reasoning."
- **FR-030**: Agent instruction MUST specify: "If a service/endpoint lacks descriptions, rely on naming conventions and context. Do not invent or assume descriptions."

#### Documentation

- **FR-031**: SDK documentation MUST provide best practices for writing descriptions (purpose, inputs, side effects, relationships)
- **FR-032**: Documentation MUST include examples of good descriptions (semantic, concise, context-rich)
- **FR-033**: Documentation MUST include examples of bad descriptions (restates name, too generic, misleading)

### Key Entities *(mandatory)*

- **Service Metadata**: Root metadata object with optional `description` explaining service purpose and bounded context
- **Endpoint Metadata**: Command or Query definition with optional `description` explaining operation purpose, expected inputs, and side effects
- **Event Metadata**: Published event definition with optional `description` explaining when the event is emitted and what it signifies
- **Schema Definitions**: JSON Schema files defining structure and validation rules for metadata with descriptions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both metadata schemas (`design-time-metadata-v1` and `runtime-metadata-v1`) validate metadata with optional descriptions and existing metadata without descriptions
- **SC-002**: Java SDK allows developers to add descriptions via annotations, and generated `spas.json` includes descriptions in correct schema format
- **SC-003**: .NET SDK allows developers to add descriptions via attributes, and metadata generation includes descriptions
- **SC-004**: Repository accepts, stores, and returns metadata with descriptions via its API
- **SC-005**: Agent instructions reference descriptions as primary source for choreography decisions
- **SC-006**: At least one example service (fulfillment-service or sample-service) demonstrates description usage with 100% coverage (service, all endpoints, all events)
- **SC-007**: All existing services without descriptions continue to build, publish, and operate unchanged (backward compatibility validated)
- **SC-008**: SDK unit tests achieve ≥80% coverage for description-related code paths

### Non-Functional Requirements

- **Performance**: Adding descriptions to metadata MUST NOT increase schema validation time by more than 10%
- **Size**: Average description length SHOULD be 50-200 characters; schemas MAY enforce maxLength if needed
- **Usability**: Developers SHOULD be able to add descriptions without consulting documentation (attribute names are self-explanatory)

## Scope Boundaries *(mandatory)*

### In Scope

- Optional `description` field on service, endpoints, and events in both metadata schemas
- Java SDK annotation support for descriptions
- .NET SDK attribute support for descriptions
- Repository pass-through of descriptions (no transformation logic needed beyond existing)
- Agent prompt updates to prioritize descriptions
- Documentation of best practices with examples
- Backward compatibility validation

### Out of Scope

- **Structured tags/categories**: Future enhancement for machine-readable classification
- **Description localization**: Multi-language support not included
- **Description validation/linting**: No enforcement of description quality (e.g., minimum length, required keywords)
- **Schema registry integration**: Descriptions for schemas (separate from service metadata)
- **Runtime description updates**: Descriptions are compile-time only; no API to update descriptions post-deployment
- **Description versioning**: Descriptions change with service versions; no separate versioning for descriptions
- **AI-generated descriptions**: No automatic description generation from code analysis

### Assumptions

- Developers will write descriptions in English (localization deferred)
- Descriptions are primarily for AI agents but also serve as human documentation
- Existing metadata transformer logic correctly passes through new optional fields
- JSON Schema `description` keyword does not conflict with custom description field (uses different context)

## Dependencies

- **Schema Files**: `components/repository/schemas/design-time-metadata-v1.schema.json` and `runtime-metadata-v1.schema.json`
- **Java SDK**: `components/sdk/java/spas-sdk-metadata` (annotations and processor)
- **.NET SDK**: `components/sdk/dotnet` (attributes and metadata generation)
- **Repository**: `components/repository/src/utils/metadata-transformer.ts`
- **Agent Instructions**: `.github/agents/copilot-instructions.md`
- **Example Services**: `examples/services/fulfillment-service` or `components/sdk/java/examples/sample-service`

## Open Questions

1. Should descriptions be validated for minimum length (e.g., ≥20 characters) to ensure quality, or trust developers?
2. Should we provide description templates/examples in IDE snippets (e.g., VS Code, IntelliJ)?
3. Should choreography YAML support human-readable descriptions (separate from service metadata)?
4. Do we need a migration guide for updating existing services with descriptions, or is it self-evident?
5. Should descriptions be included in OpenAPI/AsyncAPI exports if we add those in future?

## References

- [Constitution: SDK Quality Gates](../../.specify/memory/constitution.md#sdk-components)
- [Design-Time Metadata Schema](../../components/repository/schemas/design-time-metadata-v1.schema.json)
- [Runtime Metadata Schema](../../components/repository/schemas/runtime-metadata-v1.schema.json)
- [Java SDK Metadata Module](../../components/sdk/java/spas-sdk-metadata/)
- [.NET SDK](../../components/sdk/dotnet/)
- [Metadata Transformer](../../components/repository/src/utils/metadata-transformer.ts)
