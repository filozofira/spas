---

description: "Task list for implementing metadata descriptions"
---

# Tasks: Metadata Descriptions for AI-Assisted Choreography

**Input**: Design documents from `/specs/017-metadata-descriptions/`

**Prerequisites**:

- Required: [specs/017-metadata-descriptions/plan.md](specs/017-metadata-descriptions/plan.md), [specs/017-metadata-descriptions/spec.md](specs/017-metadata-descriptions/spec.md)
- Optional: [specs/017-metadata-descriptions/research.md](specs/017-metadata-descriptions/research.md), [specs/017-metadata-descriptions/data-model.md](specs/017-metadata-descriptions/data-model.md), [specs/017-metadata-descriptions/contracts/repository-service.openapi.yaml](specs/017-metadata-descriptions/contracts/repository-service.openapi.yaml), [specs/017-metadata-descriptions/quickstart.md](specs/017-metadata-descriptions/quickstart.md)

**Tests**: REQUIRED by spec (FR-016, FR-023, SC-008)

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: User story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm inputs, locate implementation targets, and align on MVP sequence.

- [X] T001 Confirm feature requirements and acceptance scenarios in specs/017-metadata-descriptions/spec.md
- [X] T002 Confirm implementation targets and paths in specs/017-metadata-descriptions/plan.md
- [X] T003 [P] Confirm quickstart scenarios and expected outputs in specs/017-metadata-descriptions/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure repository schema validation can use real schema files and ship them at runtime.

**⚠️ CRITICAL**: No user story work should merge until this phase is complete.

- [X] T004 Add repository-local design-time schema copy in components/repository/schemas/design-time-metadata-v1.schema.json
- [X] T005 Update repository container to ship schemas directory in components/repository/Dockerfile
- [X] T006 Update default repository schema path to a real file in components/repository/src/config.ts
- [X] T007 Load and compile the schema file passed to the validator in components/repository/src/validation/SpasSchemaValidator.ts

**Checkpoint**: Repository validation can read a schema from disk in both dev + container.

---

## Phase 3: User Story 1 - Schema Extensions for Descriptions (Priority: P1) 🎯 MVP

**Goal**: Extend both metadata schemas to allow optional `description` on service/endpoints/events, and ensure repository validation + transformer preserve and accept the new fields.

**Independent Test**: Schema validation passes for metadata with/without descriptions; repository design-time → runtime transformation preserves description fields.

### Tests for User Story 1 ⚠️

- [ ] T008 [P] [US1] Add schema validation tests for endpoint/event descriptions in components/repository/test/unit/validation/publish-validation.test.ts
- [ ] T009 [P] [US1] Add transformer pass-through test for descriptions in components/repository/test/unit/utils/metadata-transformer.test.ts

### Implementation for User Story 1

- [ ] T010 [US1] Add optional endpoint.description and event.description to components/sdk/schemas/design-time-metadata-v1.schema.json
- [ ] T011 [US1] Add optional endpoint.description and event.description to components/repository/schemas/runtime-metadata-v1.schema.json
- [ ] T012 [US1] Update repository metadata types to make service description optional and add event description in components/repository/src/models/types.ts
- [ ] T013 [US1] Ensure repository validator does not require service description and accepts new fields in components/repository/src/validation/SpasSchemaValidator.ts
- [ ] T014 [US1] Verify transformer preserves descriptions (no stripping) in components/repository/src/utils/metadata-transformer.ts
- [ ] T015 [US1] Confirm repository API returns descriptions unchanged in components/repository/src/routes/services.ts

**Checkpoint**: US1 complete when repository can accept/persist/return metadata containing optional descriptions at all levels.

---

## Phase 4: User Story 2 - Java SDK Description Support (Priority: P1) 🎯 MVP

**Goal**: Enable Java developers to author descriptions via annotations and ensure generated `spas.json` omits empty/default descriptions.

**Independent Test**: Compile-time generation and runtime /_spas/metadata output include descriptions when provided and omit when absent.

### Tests for User Story 2 ⚠️

- [ ] T016 [P] [US2] Extend annotation processor tests for description emission/omission in components/sdk/java/spas-sdk-metadata-processor/src/test/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessorTest.java
- [ ] T017 [P] [US2] Add runtime metadata controller test coverage for descriptions in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/test/samples/SampleController.java

### Implementation for User Story 2

- [ ] T018 [P] [US2] Add optional description() to command annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasCommand.java
- [ ] T019 [P] [US2] Add optional description() to query annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasQuery.java
- [ ] T020 [P] [US2] Add optional description() to event annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasEvent.java
- [ ] T021 [US2] Add optional description field to endpoint model in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/EndpointContract.java
- [ ] T022 [US2] Add optional description field to event model in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/EventContract.java
- [ ] T023 [US2] Emit descriptions from compile-time processor (omit empty string) in components/sdk/java/spas-sdk-metadata-processor/src/main/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessor.java
- [ ] T024 [US2] Include descriptions in runtime metadata ZIP generation (omit empty string) in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java

**Checkpoint**: US2 complete when Java generated metadata contains `description` only when non-empty, across service/endpoints/events.

---

## Phase 5: User Story 3 - .NET SDK Description Support (Priority: P2)

**Goal**: Enable .NET developers to author descriptions via attributes and ensure emitted metadata omits null/empty descriptions.

**Independent Test**: Build and unit tests validate metadata includes description when provided and omits otherwise.

### Tests for User Story 3 ⚠️

- [ ] T025 [P] [US3] Add unit tests for attribute description emission and omission in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SpasComposerTests.cs
- [ ] T026 [P] [US3] Add unit tests for event description propagation in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/ContractsBuilderTests.cs

### Implementation for User Story 3

- [ ] T027 [P] [US3] Add Description property to command/query/event attributes in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs
- [ ] T028 [US3] Add Description to EventContract model in components/sdk/dotnet/src/Spas.Sdk.Metadata/Models/MetadataModels.cs
- [ ] T029 [US3] Thread event description through builder in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/ContractsBuilder.cs
- [ ] T030 [US3] Thread event description through discovery in components/sdk/dotnet/src/Spas.Sdk.Metadata/Discovery/MetadataDiscovery.cs
- [ ] T031 [US3] Ensure endpoint discovery passes description when present in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs

**Checkpoint**: US3 complete when .NET metadata generation supports service/endpoints/events descriptions and omits null/empty values.

---

## Phase 6: User Story 4 - Agent Prompt Enhancement (Priority: P1) 🎯 MVP

**Goal**: Update SPAS compose agent guidance to use descriptions as the primary semantic signal for matching intent and to quote relevant snippets.

**Independent Test**: A choreography run references descriptions for disambiguation and does not invent missing descriptions.

- [ ] T032 [US4] Update description-first guidance and disambiguation rules in .github/agents/spas.compose.agent.md
- [ ] T033 [US4] Add a small verification section (manual test steps) to specs/017-metadata-descriptions/quickstart.md

**Checkpoint**: US4 complete when the agent prompt explicitly instructs description-first matching and safe fallback behavior.

---

## Phase 7: User Story 5 - Example Service with Descriptions (Priority: P3)

**Goal**: Provide a concrete example of good vs bad descriptions and validate end-to-end metadata output.

**Independent Test**: Example service emits descriptions at service/endpoints/events levels and docs show best practices.

### Implementation for User Story 5

- [ ] T034 [US5] Add service-level description to fulfillment-service metadata annotation in examples/services/fulfillment-service/src/main/java/**
- [ ] T035 [US5] Add endpoint-level descriptions to fulfillment-service command/query annotations in examples/services/fulfillment-service/src/main/java/**
- [ ] T036 [US5] Add event-level descriptions to fulfillment-service event annotations in examples/services/fulfillment-service/src/main/java/**
- [ ] T037 [US5] Document best practices and examples (good vs bad) in components/sdk/java/README.md
- [ ] T038 [US5] Document best practices and examples (good vs bad) in components/sdk/dotnet/README.md

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Ensure schemas, SDKs, repository, and prompt changes are consistent and validated end-to-end.

- [ ] T039 [P] Update any checked-in domain runtime schema copies to match runtime schema changes in examples/domains/**/.spas/schemas/runtime-metadata-v1.schema.json
- [ ] T040 Run quickstart validation end-to-end and record outcomes in specs/017-metadata-descriptions/quickstart.md

---

## Dependencies & Execution Order

### User Story Completion Order

- **MVP path**: US1 → US2 → US4
- **Then**: US3 (parity) → US5 (examples/docs)

### Notes on Dependencies

- US2 (Java) can be implemented in parallel with US1, but end-to-end publishing/validation depends on US1.
- US4 (Prompt) can be implemented in parallel with US1/US2, but is only meaningful once descriptions are present in pulled metadata.

---

## Parallel Execution Examples (per Story)

### US1 Parallel Example

- Task: T010 Add endpoint/event description to design-time schema in components/sdk/schemas/design-time-metadata-v1.schema.json
- Task: T011 Add endpoint/event description to runtime schema in components/repository/schemas/runtime-metadata-v1.schema.json
- Task: T009 Add transformer pass-through test in components/repository/test/unit/utils/metadata-transformer.test.ts

### US2 Parallel Example

- Task: T018 Add description() to components/sdk/java/spas-sdk-metadata/.../SpasCommand.java
- Task: T019 Add description() to components/sdk/java/spas-sdk-metadata/.../SpasQuery.java
- Task: T020 Add description() to components/sdk/java/spas-sdk-metadata/.../SpasEvent.java

### US3 Parallel Example

- Task: T027 Add Description properties to attributes in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs
- Task: T028 Add Description to EventContract in components/sdk/dotnet/src/Spas.Sdk.Metadata/Models/MetadataModels.cs

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 + Phase 2 (repo schema validation is real and shippable)
2. Implement US1 (schemas + repository acceptance)
3. Implement US2 (Java authoring + emission)
4. Implement US4 (prompt update)
5. Validate with specs/017-metadata-descriptions/quickstart.md

### Incremental Delivery

- After MVP: add US3 (.NET parity), then US5 (example + docs), then Polish tasks.
