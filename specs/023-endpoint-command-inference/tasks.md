# Tasks: SDK Simplification for AI-Assisted Development

**Input**: Design documents from `/specs/023-endpoint-command-inference/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Unit tests included per Constitution requirement (SDK: Quality Gates).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Prepare workspace and verify existing test baseline

- [X] T001 Verify all existing SDK tests pass before modifications by running `dotnet test` in components/sdk/dotnet/
- [X] T002 Create feature branch checkpoint commit with message "chore: baseline before 023-endpoint-command-inference changes"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Attribute modifications that MUST complete before schema inference changes

**⚠️ CRITICAL**: These changes remove DTO attribute targets, which will cause compile errors in examples until Phase 5 completes

- [X] T003 Modify SpasCommandAttribute to remove Class|Struct from AttributeUsage in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs
- [X] T004 [P] Modify SpasQueryAttribute to remove Class|Struct from AttributeUsage in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs
- [X] T005 Update SpasContractAttributesTests.cs to verify attributes can only target methods/delegates in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SpasContractAttributesTests.cs
- [X] T006 Run attribute tests to verify changes with `dotnet test --filter "SpasContractAttributes"` in components/sdk/dotnet/

**Checkpoint**: Attributes restricted to methods only. Example services will not compile until Phase 5.

---

## Phase 3: User Story 1 - Plain DTO Schema Inference (Priority: P1) 🎯 MVP

**Goal**: Infer JSON schema from endpoint handler parameter type instead of requiring attributes on DTOs

**Independent Test**: Create endpoint with `[SpasCommand]` on handler and plain record as request body, verify schema generated correctly

### Tests for User Story 1

- [X] T007 [P] [US1] Add test for schema inference from plain DTO parameter in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/WebApplicationDiscoveryExtensionsTests.cs
- [X] T008 [P] [US1] Add test for endpoint with no request body parameter in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/WebApplicationDiscoveryExtensionsTests.cs
- [X] T009 [P] [US1] Add test for endpoint with primitive parameter type in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/WebApplicationDiscoveryExtensionsTests.cs
- [X] T010 [P] [US1] Add test for deduplication when multiple endpoints use same DTO in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataArchiveGeneratorTests.cs
- [X] T011 [P] [US1] Add test for nested complex types in DTO schema in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SchemaGeneratorTests.cs

### Implementation for User Story 1

- [X] T012 [US1] Add GenerateSchemaForType method that accepts Type parameter (no attribute required) in components/sdk/dotnet/src/Spas.Sdk.Metadata/Schema/SchemaGenerator.cs
- [X] T013 [US1] Add helper method to extract request body parameter type from endpoint delegate in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [X] T014 [US1] Modify ProcessEndpoint to call parameter extraction and pass type to schema generator in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [X] T015 [US1] Update MetadataArchiveGenerator to accept parameter type for schema generation in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [X] T016 [US1] Add logic to skip schema generation for primitive types and null parameters in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [X] T017 [US1] Add schema path deduplication tracking when same DTO used by multiple endpoints in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [X] T018 [US1] Run US1 tests to verify implementation with `dotnet test --filter "US1|PlainDto|ParameterInference"` in components/sdk/dotnet/

**Checkpoint**: Plain DTO schema inference working. Endpoint-centric metadata generation complete.

---

## Phase 4: User Story 4 - Simplified Event Publishing API (Priority: P1)

**Goal**: Hide error-prone `PublishAsync(string eventName, object payload)` overload

**Independent Test**: Verify generic `PublishAsync<TEvent>` is public, string overload is internal

### Tests for User Story 4

- [X] T019 [P] [US4] Add test verifying PublishAsync(string, object) is internal (reflection test) in components/sdk/dotnet/test/Spas.Sdk.Events.Tests/EventPublisherTests.cs
- [X] T020 [P] [US4] Add test verifying PublishAsync<TEvent> remains public and functional in components/sdk/dotnet/test/Spas.Sdk.Events.Tests/EventPublisherTests.cs
- [X] T021 [P] [US4] Add test for InvalidOperationException when event type lacks SpasEvent attribute in components/sdk/dotnet/test/Spas.Sdk.Events.Tests/EventPublisherTests.cs

### Implementation for User Story 4

- [X] T022 [US4] Change PublishAsync(string eventName, object payload) visibility from public to internal in components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs
- [X] T023 [US4] Verify generic PublishAsync<TEvent> still calls internal method correctly in components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs
- [X] T024 [US4] Add or verify clear InvalidOperationException when TEvent lacks SpasEvent attribute in components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs
- [X] T025 [US4] Run US4 tests to verify implementation with `dotnet test --filter "EventPublisher"` in components/sdk/dotnet/

**Checkpoint**: Event publishing API simplified. Only type-safe method is publicly accessible.

---

## Phase 5: User Story 2 - AI Agent Service Scaffolding (Priority: P1)

**Goal**: Verify AI-generated services with plain DTOs produce valid metadata

**Independent Test**: Generate service via AI prompt, run metadata generation, validate archive

### Tests for User Story 2

- [X] T026 [P] [US2] Add integration test that scaffolds service with plain DTOs and validates metadata output in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataArchiveGeneratorTests.cs

### Implementation for User Story 2

- [X] T027 [US2] Update AI agent context/prompts to remove DTO attribute requirements in specs/023-endpoint-command-inference/ (documentation task)
- [X] T028 [US2] Run full metadata generation test suite with `dotnet test --filter "MetadataArchive"` in components/sdk/dotnet/

**Checkpoint**: AI-generated services work without DTO attributes.

---

## Phase 6: User Story 3 - Remove DTO Attributes from Existing Services (Priority: P2)

**Goal**: Clean up example services by removing redundant DTO attributes

**Independent Test**: Remove attributes from example service, regenerate metadata, compare output

### Implementation for User Story 3

- [ ] T029 [P] [US3] Remove SpasCommand attributes from all DTOs in examples/services/order-service/DTOs/
- [ ] T030 [P] [US3] Remove SpasCommand attributes from all DTOs in examples/services/inventory-service/ (if present)
- [ ] T031 [P] [US3] Remove SpasCommand attributes from all DTOs in examples/services/subscription-service/ (if present)
- [ ] T032 [P] [US3] Remove SpasCommand attributes from all DTOs in examples/services/basket-service/ (if present)
- [ ] T033 [P] [US3] Remove SpasCommand attributes from all DTOs in examples/services/fulfillment-service/ (if present)
- [ ] T034 [P] [US3] Remove SpasCommand attributes from all DTOs in examples/services/product-service/ (if present)
- [ ] T035 [US3] Run metadata generation for order-service to verify equivalent output
- [ ] T036 [US3] Verify all example services compile after DTO attribute removal with `dotnet build` in examples/services/

**Checkpoint**: All example services cleaned up. No DTO classes have SPAS attributes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final cleanup

- [ ] T037 [P] Update SDK README.md to reflect simplified DTO usage in components/sdk/dotnet/README.md
- [ ] T038 [P] Update CONVENTIONS.md to remove DTO decoration requirements in components/sdk/CONVENTIONS.md
- [ ] T039 Run quickstart.md validation steps to verify migration guide accuracy
- [ ] T040 Run full SDK test suite with `dotnet test` in components/sdk/dotnet/
- [ ] T041 Run metadata archive validation script with `.\scripts\validate-metadata-archives.ps1`
- [ ] T042 Commit all changes with message "feat(sdk): implement endpoint-centric schema inference and event API simplification"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - verify baseline first
- **Phase 2 (Foundational)**: Depends on Phase 1 - attribute changes block example compilation
- **Phase 3 (US1)**: Depends on Phase 2 - schema inference implementation
- **Phase 4 (US4)**: Can run in parallel with Phase 3 (different projects)
- **Phase 5 (US2)**: Depends on Phase 3 (needs schema inference working)
- **Phase 6 (US3)**: Depends on Phase 2 and Phase 3 (needs attribute restrictions + inference)
- **Phase 7 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Foundational phase → then independent
- **User Story 4 (P1)**: No dependencies on other stories - can run parallel with US1
- **User Story 2 (P1)**: Depends on US1 completion (needs inference working for validation)
- **User Story 3 (P2)**: Depends on US1 completion (needs inference to generate metadata without DTO attrs)

### Parallel Opportunities

```
Phase 2: T003, T004 can run in parallel (different attributes)

Phase 3: T007, T008, T009, T010, T011 can run in parallel (different test files/scenarios)

Phase 4 can run in PARALLEL with Phase 3 (different SDK projects):
  - Developer A: Phase 3 (Spas.Sdk.Metadata)
  - Developer B: Phase 4 (Spas.Sdk.Events)

Phase 6: T029, T030, T031, T032, T033, T034 can run in parallel (different services)
Phase 7: T037, T038 can run in parallel (different docs)
```

---

## Parallel Example: Phase 3 + Phase 4 (Two Developers)

```bash
# Developer A - User Story 1 (Spas.Sdk.Metadata):
T007 → T008 → T009 → T010 → T011 (tests in parallel)
T012 → T013 → T014 → T015 → T016 → T017 (implementation sequential)
T018 (verify)

# Developer B - User Story 4 (Spas.Sdk.Events):
T019 → T020 → T021 (tests in parallel)
T022 → T023 → T024 (implementation sequential)
T025 (verify)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 4)

1. Complete Phase 1: Setup (baseline verification)
2. Complete Phase 2: Foundational (attribute restrictions)
3. Complete Phase 3: User Story 1 (plain DTO inference) ← **Core value**
4. Complete Phase 4: User Story 4 (event API simplification) ← Can run parallel
5. **STOP and VALIDATE**: Run all tests, verify example service metadata generation
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Attributes restricted to methods
2. Add US1 (Schema Inference) → Test independently → **MVP!**
3. Add US4 (Event API) → Test independently → **Enhanced MVP**
4. Add US2 (AI Validation) → Confirm AI workflow works
5. Add US3 (Migration) → Clean up examples
6. Polish → Documentation complete

---

## Notes

- [P] tasks = different files, no dependencies on other tasks in same phase
- [US#] label maps task to specific user story
- Phase 4 (US4) can run fully parallel with Phase 3 (US1) - different SDK projects
- Phase 6 (US3) depends on Phase 2 because DTO attribute removal will fail to compile until attribute targets are restricted
- Commit after each phase to enable rollback
- Run `dotnet test` after each phase to verify no regressions
