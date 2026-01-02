# Tasks: Schema Nullable Handling and Transformation Validation

**Input**: Design documents from `/specs/029-schema-nullable-validation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project initialization required - this feature modifies existing components.

*(No setup tasks - all components already exist)*

---

## Phase 2: Foundational

**Purpose**: No blocking prerequisites - each user story modifies independent components.

*(No foundational tasks - user stories can proceed independently)*

---

## Phase 3: User Story 1 - Required Array Generation for Non-Nullable Properties (Priority: P1) 🎯 MVP

**Goal**: SDK schema generation automatically includes a `required` array in JSON Schema output containing all non-nullable properties

**Independent Test**: Generate a schema for a type with both required and optional properties. Verify the output JSON Schema contains a `required` array listing only non-nullable properties.

### Implementation for User Story 1

- [ ] T001 [P] [US1] Configure NJsonSchema to emit `required` array for non-nullable properties in components/sdk/dotnet/src/Spas.Sdk.Metadata/Schema/SchemaGenerator.cs (FR-001, FR-005, FR-006)
- [ ] T002 [P] [US1] Add unit tests for .NET required array generation in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Schema/SchemaGeneratorTests.cs
- [ ] T003 [P] [US1] Configure victools to emit `required` array using `withRequiredCheck()` for fields without @Nullable in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasSchemaGenerator.java (FR-002, FR-005, FR-006)
- [ ] T004 [P] [US1] Add unit tests for Java required array generation in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasSchemaGeneratorTest.java

**Checkpoint**: At this point, both SDKs should generate `required` arrays containing non-nullable property names

---

## Phase 4: User Story 2 - Nullable Property Type Representation (Priority: P1)

**Goal**: Nullable properties are represented as `"type": ["null", "<base-type>"]` in generated JSON Schema

**Independent Test**: Generate a schema for a type with nullable properties. Verify nullable fields use the JSON Schema nullable type syntax.

### Implementation for User Story 2

- [ ] T005 [P] [US2] Configure NJsonSchema with `GenerateNullableProperties = true` to emit `["null", "<type>"]` for nullable properties in components/sdk/dotnet/src/Spas.Sdk.Metadata/Schema/SchemaGenerator.cs (FR-003)
- [ ] T006 [P] [US2] Add unit tests for .NET nullable type representation in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Schema/SchemaGeneratorTests.cs
- [ ] T007 [P] [US2] Configure victools with `withNullableCheck()` to detect @Nullable annotations (package-agnostic via `getSimpleName().equals("Nullable")`) in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasSchemaGenerator.java (FR-004)
- [ ] T008 [P] [US2] Add unit tests for Java nullable type representation using @Nullable annotation in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasSchemaGeneratorTest.java

**Checkpoint**: At this point, both SDKs should generate proper nullable type syntax for nullable properties

---

## Phase 5: User Story 3 - Transformation Validation Stage in Agent Prompt (Priority: P1)

**Goal**: Agent prompt includes a "Validate" stage that instructs the agent to verify mandatory fields are mapped in transformations

**Independent Test**: Run `spas-compose init` and verify the generated agent prompt includes validation instructions for mandatory field mapping in transformations.

### Implementation for User Story 3

- [ ] T009 [US3] Add "Mandatory Field Mapping Validation" action to Phase 4 (Validate) in components/cli/spas-compose/src/templates/partials/workflow-phases.eta (FR-007, FR-008, FR-009)
- [ ] T010 [US3] Include instruction to read target schema's `required` array to determine mandatory fields in components/cli/spas-compose/src/templates/partials/workflow-phases.eta (FR-010)
- [ ] T011 [US3] Include instruction to report specific missing field names when transformation omits required fields in components/cli/spas-compose/src/templates/partials/workflow-phases.eta (FR-011)
- [ ] T012 [US3] Add unit tests for Phase 4 mandatory field validation instructions in components/cli/spas-compose/test/templates/workflow-phases.test.ts

**Checkpoint**: At this point, `spas-compose init` generates agent prompts with mandatory field validation in Phase 4

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, examples, and validation

- [ ] T013 [P] Document @Nullable annotation requirement in Java SDK README at components/sdk/java/README.md (FR-013)
- [ ] T014 [P] Update CreateShipmentRequest DTO to demonstrate @Nullable usage in examples/services/fulfillment-service/src/main/java/io/spas/examples/fulfillment/dto/CreateShipmentRequest.java (FR-014)
- [ ] T015 Verify JSON Schema draft-07 compliance for generated schemas (FR-012)
- [ ] T016 Run quickstart.md verification steps to validate all components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - no setup needed
- **Foundational (Phase 2)**: N/A - no blocking prerequisites
- **User Story 1 (Phase 3)**: Can start immediately - modifies .NET and Java SDK independently
- **User Story 2 (Phase 4)**: Can start immediately - same files as US1 but different settings
- **User Story 3 (Phase 5)**: Can start immediately - modifies CLI only (independent of SDK changes)
- **Polish (Phase 6)**: Depends on User Stories 1-3 completion for verification

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - `required` array generation
- **User Story 2 (P1)**: No dependencies - nullable type representation (can run in parallel with US1)
- **User Story 3 (P1)**: No dependencies - agent prompt validation (can run in parallel with US1/US2)

**Note**: US1 and US2 modify the same SDK files (`SchemaGenerator.cs` and `SpasSchemaGenerator.java`). When implementing:
- Implement US1 changes first (required array)
- Then add US2 changes (nullable types) to the same files
- Or combine both user stories into a single implementation pass per SDK

### Within Each User Story

- .NET and Java implementations can run in parallel [P]
- Tests should be added alongside or immediately after implementation
- Verify each SDK independently before proceeding

### Parallel Opportunities

- T001, T002, T003, T004 (US1) can all run in parallel (different files/languages)
- T005, T006, T007, T008 (US2) can all run in parallel (different files/languages)
- T009-T012 (US3) are sequential (same file), but can run in parallel with US1/US2
- T013, T014 (Polish) can run in parallel (different files)
- All three user stories (US1, US2, US3) can be worked on in parallel by different developers

---

## Parallel Example: All User Stories

```bash
# Developer A: .NET SDK (US1 + US2)
Task: T001 - Configure required array in SchemaGenerator.cs
Task: T005 - Configure nullable properties in SchemaGenerator.cs
Task: T002, T006 - Add .NET unit tests

# Developer B: Java SDK (US1 + US2)
Task: T003 - Configure required array in SpasSchemaGenerator.java
Task: T007 - Configure nullable check in SpasSchemaGenerator.java
Task: T004, T008 - Add Java unit tests

# Developer C: CLI (US3) + Polish
Task: T009-T011 - Update workflow-phases.eta
Task: T012 - Add CLI tests
Task: T013, T014 - Documentation and examples
```

---

## Implementation Strategy

### MVP First (All Stories are P1)

All three user stories are Priority P1 and form the complete MVP:
1. Complete T001-T004: Required array generation
2. Complete T005-T008: Nullable type representation
3. Complete T009-T012: Agent prompt validation
4. **VALIDATE**: Run quickstart.md verification (T016)
5. Complete T013-T015: Documentation and compliance

### Incremental Delivery

Since all stories are P1, the recommended order:
1. **SDK Changes First** (US1 + US2): Schema generation improvements in both .NET and Java
2. **CLI Changes Second** (US3): Agent prompt validation that uses the improved schemas
3. **Documentation Last** (Polish): README and example updates

### Single Developer Strategy

If working sequentially:
1. T001 + T002 (.NET required array)
2. T005 + T006 (.NET nullable types)
3. T003 + T004 (Java required array)
4. T007 + T008 (Java nullable types)
5. T009-T012 (Agent prompt)
6. T013-T016 (Polish)

---

## Notes

- **[P]** tasks = different files, no dependencies (can run in parallel)
- **[Story]** label maps task to specific user story for traceability
- US1 and US2 modify same files but different aspects - recommend implementing together per SDK
- US3 is independent of SDK changes - can proceed in parallel
- All generated schemas must remain JSON Schema draft-07 compliant (FR-012)
- Java @Nullable detection must be package-agnostic (support any @Nullable annotation)
- Commit after each task or logical group
- Run tests after each SDK modification
