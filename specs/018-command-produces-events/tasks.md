---

description: "Task list for implementing command→produced events mapping"
---

# Tasks: Command Produced Events Mapping

**Input**: Design documents from `/specs/018-command-produces-events/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**Non-goal**: Do NOT manually update any `examples/**/spas.json` files as part of this work; examples will be regenerated during e2e testing.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Confirm current schema/validator entrypoints in components/repository/schemas/*.schema.json and components/repository/src/validation/SpasSchemaValidator.ts
- [x] T002 Confirm SDK metadata generation entrypoints in components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs and components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Update principles documentation in principles/service/06-service-metadata.md to define `commands[]`, `commands[].name` kebab-case, and `commands[].produces[]` semantics
- [ ] T004 [P] Update principles documentation in principles/protocol/09-event-protocol.md to clarify that produced-event references use the same `(type, version)` pair as `events[]`
- [ ] T005 [P] Extend design-time schema in components/repository/schemas/design-time-metadata-v1.schema.json to add `commands[]` with `produces[]` objects `{ type, version, when: "success" }`
- [ ] T006 [P] Extend runtime schema in components/repository/schemas/runtime-metadata-v1.schema.json to add `commands[]` with `produces[]` objects `{ type, version, when: "success" }`
- [ ] T007 [P] Add TypeScript model types in components/repository/src/models/types.ts for `Command` and `ProducedEventRef`, and add `commands?: Command[]` to `ServiceMetadata`

**Checkpoint**: Repository and docs recognize the `commands[].produces[]` shape.

---

## Phase 3: User Story 1 - Discover produced events per command (Priority: P1) 🎯 MVP

**Goal**: Metadata format supports explicit command→produced event relationships.

**Independent Test**: A `spas.json` containing `commands[].produces[]` passes schema validation using Ajv (via Repository validator).

- [ ] T008 [US1] Add schema-level kebab-case enforcement for `commands[].name` (pattern) in components/repository/schemas/design-time-metadata-v1.schema.json
- [ ] T009 [US1] Add schema-level `when` enforcement (`const: "success"`) in components/repository/schemas/design-time-metadata-v1.schema.json
- [ ] T010 [US1] Ensure runtime schema mirrors the same `commands[].name` pattern and `when` const in components/repository/schemas/runtime-metadata-v1.schema.json

---

## Phase 4: User Story 2 - Declare produced events with minimal developer effort (Priority: P2)

**Goal**: Developers declare produced events using event types/classes; SDK emits `(type, version)` without string duplication.

**Independent Test**: In each SDK, declaring produced events via event types/classes results in `spas.json` containing `commands[].produces[]` with correct `(type, version)` derived from the event annotation/attribute.

- [ ] T011 [P] [US2] Add produced-events declaration to .NET attribute in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs (e.g., `Type[] Produces` on `SpasCommandAttribute`)
- [ ] T012 [P] [US2] Add metadata models in components/sdk/dotnet/src/Spas.Sdk.Metadata/Models/MetadataModels.cs for `CommandContract` and `ProducedEventRefContract`, and add `Commands` to `ServiceContracts`
- [ ] T013 [P] [US2] Update metadata builder in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/ContractsBuilder.cs to build `ServiceContracts.Commands` from `SpasCommandAttribute`, converting command name to kebab-case and resolving produced event `(type, version)` from `[SpasEvent]`
- [ ] T014 [P] [US2] Update JSON emission in components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs to include `commands` serialized from `ServiceContracts.Commands` (with `when: "success"`)

- [ ] T015 [P] [US2] Add produced-events declaration to Java annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasCommand.java (e.g., `Class<?>[] produces() default {}`)
- [ ] T016 [P] [US2] Add Java model types in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/ (e.g., `CommandContract`, `ProducedEventRef`) and add `commands` to io.spas.sdk.metadata.model.ServiceMetadata
- [ ] T017 [P] [US2] Update metadata generation in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java to populate `commands[]` and resolve produced event `(type, version)` from `@SpasEvent` on referenced event classes (and set `when: "success"`)

---

## Phase 5: User Story 3 - Fail fast on inconsistent metadata (Priority: P3)

**Goal**: Prevent publishing/consuming inconsistent command→produced event mappings.

**Independent Test**: Invalid metadata fails fast with clear errors for missing references and duplicates.

- [ ] T018 [P] [US3] Add repository cross-field validation in components/repository/src/validation/SpasSchemaValidator.ts to fail when a produced `(type, version)` does not exist in `events[]`
- [ ] T019 [P] [US3] Add repository cross-field validation in components/repository/src/validation/SpasSchemaValidator.ts to fail when a command contains duplicate produced `(type, version)` pairs

- [ ] T020 [P] [US3] Add .NET SDK fail-fast validation in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/ContractsBuilder.cs for: referenced produced event type missing `[SpasEvent]`, missing `(type, version)` in declared `events[]`, and duplicates
- [ ] T021 [P] [US3] Add Java SDK fail-fast validation in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java for: referenced produced event class missing `@SpasEvent`, missing `(type, version)` in declared `events[]`, and duplicates

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Ensure feature docs remain consistent with implementation in specs/018-command-produces-events/{spec.md,research.md,data-model.md,quickstart.md}
- [ ] T023 Ensure no tasks require editing `examples/**/spas.json` and that examples remain regeneratable via e2e workflow (no committed example metadata updates)

---

## Dependencies & Execution Order

### Dependency Graph

```mermaid
graph TD
  P1[Phase 1: Setup] --> P2[Phase 2: Foundational]
  P2 --> US1[Phase 3: US1 (P1)]
  US1 --> US2[Phase 4: US2 (P2)]
  US2 --> US3[Phase 5: US3 (P3)]
  US3 --> PN[Phase 6: Polish]
```

### User Story Dependencies

- **US1 (P1)** depends on Phase 2 (schema + types + principles)
- **US2 (P2)** depends on US1 (schema available for SDK output)
- **US3 (P3)** depends on US2 (validation targets produced mappings)

### Parallel Opportunities

- .NET SDK tasks (T011–T014, T020) can be done in parallel with Java SDK tasks (T015–T017, T021)
- Repository schema tasks (T005–T007) can be done in parallel, but must converge before US1/US2
- Repository validation tasks (T018–T019) can be done in parallel with SDK validation tasks (T020–T021)

---

## Parallel Example: User Story 2

- .NET in parallel:
  - Task: "T011 Add produced-events declaration to .NET attribute in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs"
  - Task: "T012 Add metadata models in components/sdk/dotnet/src/Spas.Sdk.Metadata/Models/MetadataModels.cs"

- Java in parallel:
  - Task: "T015 Add produced-events declaration to Java annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasCommand.java"
  - Task: "T016 Add Java model types in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/"

---

## Parallel Example: User Story 1

- Schema work in parallel:
  - Task: "T008 Add schema-level kebab-case enforcement for commands[].name in components/repository/schemas/design-time-metadata-v1.schema.json"
  - Task: "T010 Ensure runtime schema mirrors the same constraints in components/repository/schemas/runtime-metadata-v1.schema.json"

---

## Parallel Example: User Story 3

- Validation work in parallel:
  - Task: "T018 Add repository cross-field validation in components/repository/src/validation/SpasSchemaValidator.ts"
  - Task: "T020 Add .NET SDK fail-fast validation in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/ContractsBuilder.cs"
  - Task: "T021 Add Java SDK fail-fast validation in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java"

---

## Implementation Strategy

- MVP first: complete through **Phase 3 (US1)** so the metadata format is defined and accepted.
- Then implement SDK emission (**Phase 4 / US2**) in .NET and Java in parallel.
- Finally add fail-fast validation (**Phase 5 / US3**) across repository and both SDKs.
