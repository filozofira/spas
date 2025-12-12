---

description: "Task list for .NET SPAS SDK feature implementation"
---

# Tasks: .NET SPAS SDK

**Input**: Design documents from `/specs/001-dotnet-spas-sdk/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests are REQUIRED per user story. Integration tests remain OPTIONAL for PoC unless explicitly requested in the spec. Independent test criteria are provided per story for manual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- SDK source: `components/sdk/.net/src/`
- Tests: `components/sdk/.net/test/`
- Feature docs: `specs/001-dotnet-spas-sdk/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create directories for SDK at components/sdk/.net/{src,test,examples}
- [ ] T002 Create solution file at components/sdk/.net/SPAS.SDK.sln
- [ ] T003 [P] Create project Spas.Sdk.Core at components/sdk/.net/src/Spas.Sdk.Core/Spas.Sdk.Core.csproj
- [ ] T004 [P] Create project Spas.Sdk.Metadata at components/sdk/.net/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj
- [ ] T005 [P] Create project Spas.Sdk.Events at components/sdk/.net/src/Spas.Sdk.Events/Spas.Sdk.Events.csproj
- [ ] T006 [P] Create project Spas.Sdk.Inbound at components/sdk/.net/src/Spas.Sdk.Inbound/Spas.Sdk.Inbound.csproj
- [ ] T007 [P] Create project Spas.Sdk.Configuration at components/sdk/.net/src/Spas.Sdk.Configuration/Spas.Sdk.Configuration.csproj
- [ ] T008 [P] Create project Spas.Sdk.Observability at components/sdk/.net/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [ ] T009 [P] Create project Spas.Sdk.Testing at components/sdk/.net/src/Spas.Sdk.Testing/Spas.Sdk.Testing.csproj
- [ ] T010 [P] Create test project components/sdk/.net/test/Spas.Sdk.Core.Tests/Spas.Sdk.Core.Tests.csproj
- [ ] T011 [P] Create test project components/sdk/.net/test/Spas.Sdk.Metadata.Tests/Spas.Sdk.Metadata.Tests.csproj
- [ ] T012 [P] Create test project components/sdk/.net/test/Spas.Sdk.Events.Tests/Spas.Sdk.Events.Tests.csproj
- [ ] T013 [P] Create test project components/sdk/.net/test/Spas.Sdk.Inbound.Tests/Spas.Sdk.Inbound.Tests.csproj
- [ ] T014 [P] Create test project components/sdk/.net/test/Spas.Sdk.Configuration.Tests/Spas.Sdk.Configuration.Tests.csproj
- [ ] T015 [P] Create test project components/sdk/.net/test/Spas.Sdk.Observability.Tests/Spas.Sdk.Observability.Tests.csproj
- [ ] T016 [P] Create test project components/sdk/.net/test/Spas.Sdk.Testing.Tests/Spas.Sdk.Testing.Tests.csproj
- [ ] T017 Scaffold example service at components/sdk/.net/examples/SampleService/Program.cs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T018 Implement ISpasClock abstraction in components/sdk/.net/src/Spas.Sdk.Core/Abstractions/ISpasClock.cs
- [ ] T019 Implement tracing context in components/sdk/.net/src/Spas.Sdk.Core/Tracing/SpasTrace.cs
- [ ] T020 Implement correlation + identity accessors in components/sdk/.net/src/Spas.Sdk.Core/Context/SpasContext.cs
- [ ] T021 Add JSON options factory in components/sdk/.net/src/Spas.Sdk.Core/Serialization/JsonSerializerOptionsFactory.cs
- [ ] T022 Wire solution project references in components/sdk/.net/SPAS.SDK.sln (add Core to all packages)
- [ ] T023 Configure logging usage helpers in components/sdk/.net/src/Spas.Sdk.Core/Logging/Logging.cs
- [ ] T024 Add base config types in components/sdk/.net/src/Spas.Sdk.Configuration/Configuration/SpasConfig.cs
- [ ] T025 Create example service project in components/sdk/.net/examples/SampleService/SampleService.csproj

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Compose Valid Metadata (Priority: P1) 🎯 MVP

**Goal**: Service developers author metadata fragments in code using SDK builders and generate a canonical `spas.json` using SDK composition only.

**Independent Test**: Implement a sample service with minimal builders; compose `spas.json`; verify schema alignment using local schema.

### Tests for User Story 1 (REQUIRED — Unit)

- [ ] T026 [P] [US1] Add unit tests for ServiceIdentityBuilder in components/sdk/.net/test/Spas.Sdk.Metadata.Tests/ServiceIdentityBuilderTests.cs
- [ ] T027 [P] [US1] Add unit tests for ContractsBuilder in components/sdk/.net/test/Spas.Sdk.Metadata.Tests/ContractsBuilderTests.cs
- [ ] T028 [P] [US1] Add unit tests for SchemaValidator in components/sdk/.net/test/Spas.Sdk.Metadata.Tests/SchemaValidatorTests.cs
- [ ] T029 [P] [US1] Add unit tests for SpasComposer in components/sdk/.net/test/Spas.Sdk.Metadata.Tests/SpasComposerTests.cs

### Implementation for User Story 1

- [ ] T030 [P] [US1] Implement Service identity builder in components/sdk/.net/src/Spas.Sdk.Metadata/Builders/ServiceIdentityBuilder.cs
- [ ] T031 [P] [US1] Implement Contracts builder in components/sdk/.net/src/Spas.Sdk.Metadata/Builders/ContractsBuilder.cs
- [ ] T032 [P] [US1] Implement Security metadata builder in components/sdk/.net/src/Spas.Sdk.Metadata/Builders/SecurityBuilder.cs
- [ ] T033 [P] [US1] Implement Health metadata builder in components/sdk/.net/src/Spas.Sdk.Metadata/Builders/HealthBuilder.cs
- [ ] T034 [US1] Implement composer to assemble spas.json in components/sdk/.net/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs
- [ ] T035 [US1] Implement schema validation helper in components/sdk/.net/src/Spas.Sdk.Metadata/Validation/SchemaValidator.cs
- [ ] T036 [P] [US1] Add local schema placeholder at specs/001-dotnet-spas-sdk/contracts/schemas/spas.schema.json
- [ ] T037 [US1] Compose and write `spas.json` in components/sdk/.net/examples/SampleService/spas.json
- [ ] T038 [US1] Add diagnostics helpers for validation in components/sdk/.net/src/Spas.Sdk.Metadata/Diagnostics/Diagnostics.cs

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Dev Metadata Endpoint (Priority: P2)

**Goal**: Dev-only endpoint `/_spas/metadata` returns an archive containing `spas.json` and contract schemas; disabled in production.

**Independent Test**: Enable endpoint in SampleService; request endpoint; verify archive contents.

### Tests for User Story 2 (REQUIRED — Unit)

- [ ] T039 [P] [US2] Add unit tests for MetadataEndpointOptions in components/sdk/.net/test/Spas.Sdk.Metadata.Tests/MetadataEndpointOptionsTests.cs
- [ ] T040 [P] [US2] Add unit tests for MetadataArchiveWriter in components/sdk/.net/test/Spas.Sdk.Metadata.Tests/MetadataArchiveWriterTests.cs

### Implementation for User Story 2

- [ ] T041 [US2] Add dev endpoint extensions in components/sdk/.net/src/Spas.Sdk.Metadata/Dev/MetadataEndpointExtensions.cs
- [ ] T042 [US2] Implement archive writer in components/sdk/.net/src/Spas.Sdk.Metadata/Dev/MetadataArchiveWriter.cs
- [ ] T043 [US2] Add options to gate by env/config in components/sdk/.net/src/Spas.Sdk.Metadata/Dev/MetadataEndpointOptions.cs
- [ ] T044 [US2] Map `/_spas/metadata` in Development in components/sdk/.net/examples/SampleService/Program.cs

**Checkpoint**: User Stories 1 AND 2 each work independently

---

## Phase 5: User Story 3 - Event Publishing with Trace (Priority: P3)

**Goal**: Publish domain events using SDK helpers with W3C Trace Context and correlation identifiers.

**Independent Test**: Publish a sample event; observe trace correlation through sidecar.

### Tests for User Story 3 (REQUIRED — Unit)

- [ ] T045 [P] [US3] Add unit tests for SpasEventBuilder in components/sdk/.net/test/Spas.Sdk.Events.Tests/SpasEventBuilderTests.cs
- [ ] T046 [P] [US3] Add unit tests for EventPublisher (HTTP publish) in components/sdk/.net/test/Spas.Sdk.Events.Tests/EventPublisherTests.cs

### Implementation for User Story 3

- [ ] T047 [P] [US3] Add event envelope model in components/sdk/.net/src/Spas.Sdk.Events/Envelope/SpasEventEnvelope.cs
- [ ] T048 [P] [US3] Implement envelope builder with trace/correlation in components/sdk/.net/src/Spas.Sdk.Events/Envelope/SpasEventBuilder.cs
- [ ] T049 [US3] Implement publish helper (HTTP to sidecar) in components/sdk/.net/src/Spas.Sdk.Events/Publish/EventPublisher.cs
- [ ] T050 [US3] Add identity accessors integration in components/sdk/.net/src/Spas.Sdk.Core/Identity/IdentityAccessors.cs
- [ ] T051 [US3] Publish sample event in components/sdk/.net/examples/SampleService/Program.cs

**Checkpoint**: User Stories 1, 2, and 3 are independently functional

---

## Phase 6: User Story 4 - Opt-in Tracelog Middleware (Priority: P3)

**Goal**: Minimal tracelog middleware that records timing and includes trace/correlation identifiers in logs.

**Independent Test**: Enable middleware; verify logs contain trace/correlation IDs and latency.

### Tests for User Story 4 (REQUIRED — Unit)

- [ ] T052 [P] [US4] Add unit tests for TracelogMiddleware in components/sdk/.net/test/Spas.Sdk.Observability.Tests/TracelogMiddlewareTests.cs
- [ ] T053 [P] [US4] Add unit tests for ObservabilityExtensions registration in components/sdk/.net/test/Spas.Sdk.Observability.Tests/ObservabilityExtensionsTests.cs

### Implementation for User Story 4

- [ ] T054 [US4] Implement tracelog middleware in components/sdk/.net/src/Spas.Sdk.Observability/Tracing/TracelogMiddleware.cs
- [ ] T055 [US4] Add registration extension in components/sdk/.net/src/Spas.Sdk.Observability/Tracing/ObservabilityExtensions.cs
- [ ] T056 [US4] Wire middleware via config in components/sdk/.net/examples/SampleService/Program.cs

**Checkpoint**: All user stories are independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T057 [P] Documentation updates in specs/001-dotnet-spas-sdk/quickstart.md
- [ ] T058 Code cleanup and refactoring across components/sdk/.net/*
- [ ] T059 [P] Validate Quickstart end-to-end in components/sdk/.net/examples/SampleService/README.md
- [ ] T060 Security hardening pass referencing spec/security/19-security-model.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies - can start immediately
- Foundational (Phase 2): Depends on Setup completion - BLOCKS all user stories
- User Stories (Phase 3+): All depend on Foundational completion
  - Proceed sequentially by priority or in parallel if staffed
- Polish (Final Phase): After desired user stories are complete

### User Story Dependencies

- User Story 1 (P1): Starts after Foundational; no dependency on other stories
- User Story 2 (P2): Starts after Foundational; independent of US1 runtime but uses its output when present
- User Story 3 (P3): Starts after Foundational; independent of US1/US2 but integrates with Core
- User Story 4 (P3): Starts after Foundational; independent

### Within Each User Story

- Prefer parallel work on models/builders marked [P]
- Compose/integration tasks follow model/builder tasks
- SampleService changes last within each story

### Parallel Opportunities

- Setup: T003–T016 can run in parallel
- Foundational: T018–T021 can run in parallel; T022–T025 follow
- US1: T026–T029 in parallel; T030–T038 follow
- US2: T039–T040 in parallel; T041–T044 follow
- US3: T045–T046 in parallel; T047–T051 follow
- US4: T052–T053 in parallel; T054 integrates

---

## Parallel Examples

### User Story 1

- Parallel: T026, T027, T028, T029
- Then: T030, T031, T032, T033, T034, T035, T036, T037, T038

### User Story 2

- Parallel: T039, T040
- Then: T041, T042, T043, T044

### User Story 3

- Parallel: T045, T046
- Then: T047, T048, T049, T050, T051

### User Story 4

- Parallel: T052, T053
- Then: T054, T055, T056

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Test User Story 1 independently
5. Demo MVP

### Incremental Delivery

1. Foundation ready → Add User Story 1 → Validate/Demo
2. Add User Story 2 → Validate/Demo
3. Add User Story 3 → Validate/Demo
4. Add User Story 4 → Validate/Demo

### Parallel Team Strategy

- After Foundational:
  - Dev A: US1
  - Dev B: US2
  - Dev C: US3/US4

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Avoid cross-story coupling; keep SampleService updates story-local
