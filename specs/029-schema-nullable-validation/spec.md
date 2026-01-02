# Feature Specification: Schema Nullable Handling and Transformation Validation

**Feature Branch**: `029-schema-nullable-validation`  
**Created**: 2026-01-02  
**Status**: Draft  
**Input**: User description: "SDK Schema Offline Generation must generate 'required' array containing all non-nullable properties. Both SDKs should generate 'type': ['null', '...'] or equivalent for nullable properties. spas-compose init cli command must generate agent prompt 'Validate stage' to instruct agent to validate that mandatory fields are specified in transformations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Required Array Generation for Non-Nullable Properties (Priority: P1)

As a developer generating service metadata, I want the SDK schema generation to automatically include a `required` array in JSON Schema output containing all non-nullable properties, so that downstream consumers (agents, sidecars, validators) can identify which fields must be present in payloads.

**Why this priority**: The `required` array is fundamental to JSON Schema validation. Without it, schema consumers cannot distinguish mandatory fields from optional ones, leading to runtime validation failures and incorrect agent transformations.

**Independent Test**: Generate a schema for a type with both required and optional properties. Verify the output JSON Schema contains a `required` array listing only non-nullable properties.

**Acceptance Scenarios**:

1. **Given** a .NET class with non-nullable properties (e.g., `string OrderId`), **When** the SchemaGenerator generates a schema, **Then** the output JSON Schema contains a `required` array including `"orderId"`.
2. **Given** a Java class with non-nullable fields, **When** the SpasSchemaGenerator generates a schema, **Then** the output JSON Schema contains a `required` array including those field names.
3. **Given** a type with only nullable properties, **When** the schema is generated, **Then** the `required` array is either empty or omitted.
4. **Given** a complex type with nested objects, **When** the schema is generated, **Then** nested objects also include appropriate `required` arrays for their non-nullable properties.

---

### User Story 2 - Nullable Property Type Representation (Priority: P1)

As a developer generating service metadata, I want nullable properties to be represented as `"type": ["null", "<base-type>"]` (or equivalent) in the generated JSON Schema, so that schema consumers understand which fields accept null values.

**Why this priority**: Correct nullable type representation is essential for proper validation and transformation generation. Agents use this information to generate null-safe transformations.

**Independent Test**: Generate a schema for a type with nullable properties. Verify nullable fields use the JSON Schema nullable type syntax.

**Acceptance Scenarios**:

1. **Given** a .NET class with a nullable property (e.g., `string? Notes`), **When** the SchemaGenerator generates a schema, **Then** the property definition uses `"type": ["null", "string"]` or an equivalent nullable representation.
2. **Given** a Java class with a field annotated with `@Nullable` (e.g., `@Nullable String notes`), **When** the SpasSchemaGenerator generates a schema, **Then** the property definition indicates nullability via `"type": ["null", "string"]` or equivalent.
3. **Given** a non-nullable property, **When** the schema is generated, **Then** the property type does NOT include `"null"` in the type array.
4. **Given** nullable array or object properties, **When** the schema is generated, **Then** the nullable representation is correctly applied (e.g., `"type": ["null", "array"]`).

---

### User Story 3 - Transformation Validation Stage in Agent Prompt (Priority: P1)

As a domain architect using spas-compose init, I want the generated agent prompt to include a "Validate" stage that instructs the agent to verify mandatory fields are mapped in transformations, so that transformation errors are caught during design rather than at runtime.

**Why this priority**: Transformations that omit mandatory fields cause runtime failures. Catching these during the AI-assisted choreography workflow prevents production issues.

**Independent Test**: Run `spas-compose init` and verify the generated agent prompt includes validation instructions for mandatory field mapping in transformations.

**Acceptance Scenarios**:

1. **Given** a domain workspace, **When** `spas-compose init <domain>` is executed, **Then** the generated agent prompt includes a "Validate" phase that instructs the agent to verify mandatory fields from target schemas are present in transformations.
2. **Given** the Validate phase instructions, **When** an agent processes them, **Then** the agent checks that all fields in the target schema's `required` array are mapped in the transformation.
3. **Given** a transformation missing a required field, **When** the agent executes the Validate phase, **Then** the agent reports the missing field(s) and requests correction before proceeding.
4. **Given** a transformation that maps all required fields, **When** the agent executes the Validate phase, **Then** validation passes and the agent proceeds to the next phase.

---

### Edge Cases

- What happens when a property is marked as both `required` and `nullable`? (A field can be required to be present in the payload but still accept null as a valid value)
- How does the SDK handle inherited properties with different nullability in parent/child classes?
- What happens when a transformation maps a field with incorrect casing (e.g., `OrderId` instead of `orderId`)?
- How does the agent handle schemas without a `required` array (legacy or third-party schemas)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: .NET SDK SchemaGenerator MUST generate a `required` array in JSON Schema output containing all non-nullable property names.
- **FR-002**: Java SDK SpasSchemaGenerator MUST generate a `required` array in JSON Schema output containing all non-nullable field names.
- **FR-003**: .NET SDK SchemaGenerator MUST represent nullable properties with `"type": ["null", "<base-type>"]` syntax in JSON Schema output.
- **FR-004**: Java SDK SpasSchemaGenerator MUST represent properties annotated with `@Nullable` as `"type": ["null", "<base-type>"]` in JSON Schema output; fields without `@Nullable` are assumed non-nullable.
- **FR-005**: The `required` array MUST use camelCase property names matching the property definitions in the schema.
- **FR-006**: Nested objects within schemas MUST also include appropriate `required` arrays for their non-nullable properties.
- **FR-007**: `spas-compose init` CLI command MUST generate agent prompt that includes validation instructions for mandatory field mapping in transformations.
- **FR-008**: The agent prompt validation instructions MUST reference the target schema's `required` array to determine mandatory fields.
- **FR-009**: The agent prompt validation instructions MUST appear in Phase 4 (Validate) of the workflow phases.
- **FR-010**: The agent validation MUST check that all `required` fields from the target schema are mapped in each transformation file.
- **FR-011**: The agent validation MUST report specific missing field names when a transformation omits required fields.
- **FR-012**: Generated schemas MUST remain compliant with JSON Schema draft-07 standard.
- **FR-013**: Java SDK README MUST document that `@Nullable` annotation is required to mark fields as nullable in generated schemas, and that fields without this annotation are treated as required (non-nullable).

### Key Entities

- **JSON Schema**: The generated schema document containing `type`, `properties`, `required`, and other standard JSON Schema keywords.
- **Transformation File**: JSONata file that maps source event payloads to target endpoint request formats.
- **Required Array**: JSON array in the schema listing property names that must be present in valid instances.
- **Agent Prompt**: Markdown file generated by `spas-compose init` containing instructions for AI-assisted choreography.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All generated schemas for types with non-nullable properties include a `required` array with 100% coverage of non-nullable fields.
- **SC-002**: All generated schemas for types with nullable properties use the `["null", "<type>"]` format for nullable fields with 100% accuracy.
- **SC-003**: Agent prompt generated by `spas-compose init` includes transformation validation instructions that reference `required` fields.
- **SC-004**: Example services generate schemas that pass validation against JSON Schema draft-07 with correct required/nullable handling.
- **SC-005**: Developers can verify transformation completeness by reviewing agent-generated validation output before deployment.

## Assumptions

- The existing SDK schema generators use NJsonSchema (.NET) and victools/jsonschema-generator (Java), which support required/nullable handling through configuration.
- .NET: Nullable reference types (`?` suffix) are the primary mechanism for determining nullability.
- Java: Explicit `@Nullable` annotation marks fields as nullable; all other fields are assumed required (non-nullable).
- The agent prompt Validate phase already exists in the workflow-phases partial and can be extended with additional validation steps.
- Target schemas are available in the domain workspace at the time of validation.

## Clarifications

### Session 2026-01-02

- Q: How should the Java SDK determine field nullability? → A: Use explicit nullability annotations only (`@Nullable` marks nullable, all else assumed required)
