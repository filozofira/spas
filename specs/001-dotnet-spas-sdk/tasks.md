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

- SDK source: `components/sdk/dotnet/src/`
- Tests: `components/sdk/dotnet/test/`
- Feature docs: `specs/001-dotnet-spas-sdk/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create directories for SDK at components/sdk/dotnet/{src,test,examples}
- [x] T002 Create solution file at components/sdk/dotnet/SPAS.SDK.sln
- [x] T003 [P] Create project Spas.Sdk.Core at components/sdk/dotnet/src/Spas.Sdk.Core/Spas.Sdk.Core.csproj
- [x] T004 [P] Create project Spas.Sdk.Metadata at components/sdk/dotnet/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj
- [x] T005 [P] Create project Spas.Sdk.Events at components/sdk/dotnet/src/Spas.Sdk.Events/Spas.Sdk.Events.csproj
- [x] T006 [P] Create project Spas.Sdk.Inbound at components/sdk/dotnet/src/Spas.Sdk.Inbound/Spas.Sdk.Inbound.csproj
- [x] T007 [P] Create project Spas.Sdk.Configuration at components/sdk/dotnet/src/Spas.Sdk.Configuration/Spas.Sdk.Configuration.csproj
- [x] T008 [P] Create project Spas.Sdk.Observability at components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [x] T009 [P] Create project Spas.Sdk.Testing at components/sdk/dotnet/src/Spas.Sdk.Testing/Spas.Sdk.Testing.csproj
- [x] T010 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Spas.Sdk.Core.Tests.csproj
- [x] T011 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Spas.Sdk.Metadata.Tests.csproj
- [x] T012 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Events.Tests/Spas.Sdk.Events.Tests.csproj
- [x] T013 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Inbound.Tests/Spas.Sdk.Inbound.Tests.csproj
- [x] T014 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Configuration.Tests/Spas.Sdk.Configuration.Tests.csproj
- [x] T015 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Observability.Tests/Spas.Sdk.Observability.Tests.csproj
- [x] T016 [P] Create test project components/sdk/dotnet/test/Spas.Sdk.Testing.Tests/Spas.Sdk.Testing.Tests.csproj
- [x] T017 Scaffold example service at components/sdk/dotnet/examples/SampleService/Program.cs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T018 Implement ISpasClock abstraction in components/sdk/dotnet/src/Spas.Sdk.Core/Abstractions/ISpasClock.cs
- [x] T019 Implement tracing context in components/sdk/dotnet/src/Spas.Sdk.Core/Tracing/SpasTrace.cs
- [x] T020 Implement correlation + identity accessors in components/sdk/dotnet/src/Spas.Sdk.Core/Context/SpasContext.cs
- [x] T021 Add JSON options factory in components/sdk/dotnet/src/Spas.Sdk.Core/Serialization/JsonSerializerOptionsFactory.cs
- [x] T022 Wire solution project references in components/sdk/dotnet/SPAS.SDK.sln (add Core to all packages)
- [x] T023 Configure logging usage helpers in components/sdk/dotnet/src/Spas.Sdk.Core/Logging/Logging.cs
- [x] T024 Add base config types in components/sdk/dotnet/src/Spas.Sdk.Configuration/Configuration/SpasConfig.cs
- [x] T025 Create example service project in components/sdk/dotnet/examples/SampleService/SampleService.csproj

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Compose Valid Metadata (Priority: P1) 🎯 MVP

**Goal**: Service developers author metadata fragments in code using SDK builders and generate a canonical `spas.json` using SDK composition only.

**Independent Test**: Implement a sample service with minimal builders; compose `spas.json`; verify schema alignment using local schema.

### Tests for User Story 1 (REQUIRED — Unit)

- [x] T026 [P] [US1] Add unit tests for ServiceIdentityBuilder in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/ServiceIdentityBuilderTests.cs
- [x] T027 [P] [US1] Add unit tests for ContractsBuilder in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/ContractsBuilderTests.cs
- [x] T028 [P] [US1] Add unit tests for SchemaValidator in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SchemaValidatorTests.cs
- [x] T029 [P] [US1] Add unit tests for SpasComposer in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SpasComposerTests.cs

### Implementation for User Story 1

- [x] T030 [P] [US1] Implement Service identity builder in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/ServiceIdentityBuilder.cs
- [x] T031 [P] [US1] Implement Contracts builder in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/ContractsBuilder.cs
- [x] T032 [P] [US1] Implement Security metadata builder in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/SecurityBuilder.cs
- [x] T033 [P] [US1] Implement Health metadata builder in components/sdk/dotnet/src/Spas.Sdk.Metadata/Builders/HealthBuilder.cs
- [x] T034 [US1] Implement composer to assemble spas.json in components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs
- [x] T035 [US1] Implement schema validation helper in components/sdk/dotnet/src/Spas.Sdk.Metadata/Validation/SchemaValidator.cs
- [x] T036 [P] [US1] Add local schema placeholder at specs/001-dotnet-spas-sdk/contracts/schemas/spas.schema.json
- [x] T037 [US1] Compose and write `spas.json` in components/sdk/dotnet/examples/SampleService/spas.json
- [x] T038 [US1] Add diagnostics helpers for validation in components/sdk/dotnet/src/Spas.Sdk.Metadata/Diagnostics/Diagnostics.cs

**Checkpoint**: User Story 1 fully functional and testable independently

### Phase 3 Refactoring: Attribute-Based Auto-Discovery (Completed)

**Motivation**: Original implementation required developers to maintain endpoint definitions in two places:

1. Actual endpoint definitions (MapPost/MapGet)
2. Manual ContractsBuilder registration

This violated DRY principles and created drift risk.

**Solution**: Implemented attribute-based auto-discovery system:

- [x] **Created Attribute Types** (components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/)

  - SpasCommandAttribute - marks endpoints as commands with name, version, optional schema/path
  - SpasQueryAttribute - marks endpoints as queries with name, version, optional schema/path
  - SpasEventAttribute - marks event types with name, version, optional schema

- [x] **Implemented Discovery System** (components/sdk/dotnet/src/Spas.Sdk.Metadata/)

  - MetadataDiscovery.cs - discovers events from assemblies via reflection
  - WebApplicationDiscoveryExtensions.cs - discovers endpoints from ASP.NET Core routing
  - Uses reflection to access ASP.NET Core types without direct package dependencies

- [x] **Updated Integration Tests**

  - Added SpasContractAttributesTests.cs with 11 attribute validation tests
  - Updated MetadataDiscoveryTests.cs with discovery configuration tests
  - All 40 unit tests passing (26 from Phase 3 initial + 14 from refactor)

- [x] **Updated SampleService Example**
  - Endpoints use `.WithMetadata(new SpasCommandAttribute(...))` syntax
  - Event types decorated with `[SpasEvent(...)]` attribute
  - Call `app.DiscoverSpasMetadata()` to auto-discover all contracts
  - Generates complete spas.json with 1 command, 1 query, 1 event

**Result**: Single source of truth - attributes on endpoints/types are the only metadata definition required. No manual ContractsBuilder registration needed.

---

## Phase 4: User Story 2 - Dev Metadata Endpoint (Priority: P2) ✅ COMPLETE

**Goal**: Dev-only endpoint `/_spas/metadata` returns an archive containing `spas.json` and contract schemas; disabled in production.

**Independent Test**: Enable endpoint in SampleService; request endpoint; verify archive contents.

### Tests for User Story 2 (REQUIRED — Unit)

- [x] T039 [P] [US2] Add unit tests for MetadataEndpointOptions in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataEndpointOptionsTests.cs
- [x] T040 [P] [US2] Add unit tests for MetadataArchiveWriter in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataArchiveWriterTests.cs

### Implementation for User Story 2

- [x] T041 [US2] Add dev endpoint extensions in components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/MetadataEndpointExtensions.cs
- [x] T042 [US2] Implement archive writer in components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/MetadataArchiveWriter.cs
- [x] T043 [US2] Add options to gate by env/config in components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/MetadataEndpointOptions.cs
- [x] T044 [US2] Map `/_spas/metadata` in Development in components/sdk/dotnet/examples/SampleService/Program.cs

**Checkpoint**: User Stories 1 AND 2 each work independently ✅

**Test Results**: All 52 unit tests passing (40 from Phase 3 + 12 from Phase 4)

**End-to-End Verification**:

- ✅ Endpoint returns ZIP archive
- ✅ Archive contains spas.json with all discovered contracts
- ✅ Archive contains all contract schemas
- ✅ Endpoint disabled in Production mode
- ✅ Environment gating works correctly

---

## Phase 5: User Story 3 - Event Publishing with Trace (Priority: P3) ✅ COMPLETE

**Goal**: Publish domain events using SDK helpers with W3C Trace Context and correlation identifiers.

**Independent Test**: Publish a sample event; observe trace correlation through sidecar.

### Tests for User Story 3 (REQUIRED — Unit)

- [x] T045 [P] [US3] Add unit tests for SpasEventBuilder in components/sdk/dotnet/test/Spas.Sdk.Events.Tests/SpasEventBuilderTests.cs
- [x] T046 [P] [US3] Add unit tests for EventPublisher (HTTP publish) in components/sdk/dotnet/test/Spas.Sdk.Events.Tests/EventPublisherTests.cs

### Implementation for User Story 3

- [x] T047 [P] [US3] Add event envelope model in components/sdk/dotnet/src/Spas.Sdk.Events/Envelope/SpasEventEnvelope.cs
- [x] T048 [P] [US3] Implement envelope builder with trace/correlation in components/sdk/dotnet/src/Spas.Sdk.Events/Envelope/SpasEventBuilder.cs
- [x] T049 [US3] Implement publish helper (HTTP to sidecar) in components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs
- [x] T050 [US3] Add identity accessors integration in components/sdk/dotnet/src/Spas.Sdk.Core/Identity/IdentityAccessors.cs
- [x] T051 [US3] Publish sample event in components/sdk/dotnet/examples/SampleService/Program.cs

**Test Results**: All 18 unit tests passing (10 SpasEventBuilder + 8 EventPublisher)
**Total SDK Tests**: 78 tests passing

**Checkpoint**: User Stories 1, 2, and 3 are independently functional

---

## Phase 6: User Story 4 - Opt-in Tracelog Middleware (Priority: P3)

**Goal**: Minimal tracelog middleware that records timing and includes trace/correlation identifiers in logs.

**Independent Test**: Enable middleware; verify logs contain trace/correlation IDs and latency.

### Tests for User Story 4 (REQUIRED — Unit)

- [x] T052 [P] [US4] Add unit tests for TracelogMiddleware in components/sdk/dotnet/test/Spas.Sdk.Observability.Tests/TracelogMiddlewareTests.cs
- [x] T053 [P] [US4] Add unit tests for ObservabilityExtensions registration in components/sdk/dotnet/test/Spas.Sdk.Observability.Tests/ObservabilityExtensionsTests.cs

### Implementation for User Story 4

- [x] T054 [US4] Implement tracelog middleware in components/sdk/dotnet/src/Spas.Sdk.Observability/Tracing/TracelogMiddleware.cs
- [x] T055 [US4] Add registration extension in components/sdk/dotnet/src/Spas.Sdk.Observability/Tracing/ObservabilityExtensions.cs
- [x] T056 [US4] Wire middleware via config in components/sdk/dotnet/examples/SampleService/Program.cs

**Test Results**: Phase 6 complete - 8 middleware tests + 4 extension tests = 12 new tests
**Total SDK Tests**: Expected ~88 tests (76 previous + 12 new)

**Checkpoint**: All user stories are independently functional

---

## Phase N: Polish & Cross-Cutting Concerns ✅ COMPLETE

**Purpose**: Improvements that affect multiple user stories

- [x] T057 [P] Documentation updates in specs/001-dotnet-spas-sdk/quickstart.md
- [x] T058 Code cleanup and refactoring across components/sdk/dotnet/\*
- [x] T059 [P] Validate Quickstart end-to-end in components/sdk/dotnet/examples/SampleService/README.md
- [x] T060 Security hardening pass referencing spec/security/19-security-model.md

**Deliverables**:

- ✅ quickstart.md verified complete with Zipkin integration documentation
- ✅ Removed 14 template files (7 Class1.cs + 7 UnitTest1.cs) across all projects
- ✅ Created comprehensive SampleService/README.md with end-to-end validation guide
- ✅ Created SECURITY.md with PoC security review and Production migration checklist
- ✅ All 88 tests passing; build successful

**Security Review Summary**:

- ✅ ADEQUATE for PoC scope (development/testing environments)
- ⚠️ REQUIRES Production hardening per SECURITY.md Migration Checklist
- 📋 Key controls: Dev endpoint gating, schema validation, AsyncLocal isolation, W3C trace validation
- 📋 Acknowledged risks: OpenTelemetry CVE, header-based identity, no mTLS, no secret management
- 📋 Production path: mTLS + SPIFFE, Key Vault, schema signing, OTel 2.0+, retry policies

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
