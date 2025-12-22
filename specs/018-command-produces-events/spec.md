# Feature Specification: Command Produced Events Mapping

**Feature Branch**: `018-command-produces-events`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: Add a PoC capability in `spas.json` metadata that expresses which events each command produces on success, to improve agent-assisted choreography and reduce guesswork.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover produced events per command (Priority: P1)

As a choreography developer (or an AI agent assisting one), I want service metadata to state which events a command produces when it succeeds, so I can design a choreography with fewer assumptions.

**Why this priority**: This directly reduces manual reverse-engineering of service behavior and improves the correctness of generated choreographies.

**Independent Test**: Can be fully tested by inspecting a generated `spas.json` and confirming that each declared command includes the expected `produces` list referencing declared events.

**Acceptance Scenarios**:

1. **Given** a service metadata document that declares commands and events, **When** a command declares it produces an event, **Then** the command’s `produces[]` references an existing `events[]` entry by `(type, version)`.
2. **Given** a command that declares produced events, **When** tooling/agents read the metadata, **Then** they can infer a command→event relationship without scanning source code.

---

### User Story 2 - Declare produced events with minimal developer effort (Priority: P2)

As a service developer using an SDK, I want to declare produced events using event classes/types (not strings), so metadata generation is low-friction and resistant to typos.

**Why this priority**: This keeps the feature practical for services to adopt in a PoC without creating a documentation maintenance burden.

**Independent Test**: Can be fully tested by declaring a command’s produced events using event types and generating metadata, verifying that the SDK resolves event `type` and `version` from the event annotation/attribute.

**Acceptance Scenarios**:

1. **Given** a command that declares produced event types, **When** the SDK generates metadata, **Then** the output includes `produces[].type` and `produces[].version` derived from the referenced event annotation/attribute.
2. **Given** a command that references an event type missing the required event annotation/attribute, **When** the SDK generates metadata, **Then** metadata generation fails with a clear error.

---

### User Story 3 - Fail fast on inconsistent metadata (Priority: P3)

As a platform/tooling maintainer, I want validation that prevents publishing inconsistent command→event mappings, so choreographies and agents aren’t misled.

**Why this priority**: Incorrect metadata is worse than missing metadata; fast-fail validation protects downstream tooling.

**Independent Test**: Can be fully tested by generating metadata that includes an invalid produced event reference and verifying that validation fails.

**Acceptance Scenarios**:

1. **Given** a command that declares a produced `(type, version)` pair not present in `events[]`, **When** validation runs, **Then** validation fails with a clear “missing event reference” error.
2. **Given** a command that declares duplicate produced `(type, version)` pairs, **When** validation runs, **Then** validation fails with a clear “duplicate produced event” error.

---

### Edge Cases

- A command declares `produces[]` but `when` is missing or not `"success"`.
- A command name is not kebab-case.
- A command declares a produced event that is not declared in `events[]`.
- A command declares the same produced `(type, version)` more than once.
- A developer references an event class/type that is missing the SDK’s event annotation/attribute.
- The service has commands but declares no produced events (valid; mapping is optional).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Service metadata MUST allow each command to declare a `produces` list of events produced on success.
- **FR-002**: The `produces` field MUST be an array of objects (not strings).
- **FR-003**: Each `produces[]` element MUST include `type`, `version`, and `when`.
- **FR-004**: For the PoC, each `produces[]` element MUST set `when` to exactly `"success"`.
- **FR-005**: `when: "success"` MUST mean the event is expected only when the command completes successfully; on failure, the event MUST NOT be assumed to occur.

- **FR-006**: Command identifiers MUST be canonical and stable: command `name` MUST be kebab-case and is the canonical identifier.
- **FR-007**: SDKs MUST support developer-declared mapping by letting developers declare produced events using event classes/types, and SDKs MUST resolve `produces[].type` and `produces[].version` from the referenced event annotation/attribute.
- **FR-008**: SDK metadata generation MUST fail with a clear error when a referenced event class/type lacks the required event annotation/attribute.

- **FR-009**: Validation MUST require that every `(produces[].type, produces[].version)` pair exists in the service’s `events[]` list.
- **FR-010**: Validation MUST fail fast with a clear error when a produced event reference does not exist in `events[]`.
- **FR-011**: Validation MUST require uniqueness: within a single command, `produces[]` MUST NOT contain duplicate `(type, version)` pairs.

- **FR-012**: The specification MUST include at least one JSON example demonstrating a command with `produces[]` referencing `events[].type` and `events[].version`.
- **FR-013**: The specification/principles documentation MUST be updated (where appropriate) so agents and developers can discover and correctly interpret the command→produced events mapping rules.

- **FR-014**: Both the .NET SDK and Java SDK MUST support the developer-declared mapping model and MUST emit the `produces[]` metadata in `spas.json` according to this specification.

Notes:
- For PoC scope, only commands participate; queries do not declare `produces`.
- The model MUST remain extensible to future producer types (e.g., background jobs) without changing the meaning of `when: "success"`.

### Assumptions & Dependencies

- Services already declare their events in `events[]` (including `type` and `version`).
- SDKs already support a service-level metadata generation workflow; this feature extends that workflow.
- This feature depends on updating the SPAS metadata specification and the principles documentation that governs service metadata and event contracts.
- The PoC assumes all participating services and tools adopt the updated metadata format (no transitional compatibility requirements).

### Key Entities *(include if feature involves data)*

- **Command**: A named write operation exposed by a service that may produce events when it succeeds.
- **Produced Event Reference**: A reference to a declared event by `(type, version)` plus a `when` condition.
- **Event**: A declared event contract with `type`, `version`, and `schemaRef`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a service that adopts the feature, a choreography developer can identify command→event relationships by reading metadata alone (no source code inspection needed) for at least 1 representative service.
- **SC-002**: Metadata generation fails in under 10 seconds when a produced `(type, version)` reference is missing from `events[]` (fast feedback).
- **SC-003**: In an agent-assisted choreography workflow, the agent can propose a command→event flow using only `spas.json` with no more than 1 follow-up question for a representative service.
- **SC-004**: The mapping can be added to a service with no more than one additional declaration per command (low developer burden).

## JSON Example (informative)

The example below shows a command that declares produced events using references that must exist in `events[]`.

```json
{
  "commands": [
    {
      "name": "create-order",
      "version": "1.0.0",
      "produces": [
        {
          "type": "order-created",
          "version": "1.0.0",
          "when": "success"
        }
      ]
    }
  ],
  "events": [
    {
      "type": "order-created",
      "version": "1.0.0",
      "schemaRef": "schemas/events/order-created.schema.json"
    }
  ]
}
```
