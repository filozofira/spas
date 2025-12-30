# Implementation Tasks: .NET Controller Support for SPAS SDK

**Feature**: 026-dotnet-controller-support  
**Feature Name**: Extend .NET SDK metadata generation to support Controllers  
**Status**: Ready for Implementation  
**Created**: 2025-12-30

---

## Overview

This document organizes the implementation tasks for adding ASP.NET Core MVC Controller support to the SPAS .NET SDK metadata generation system. Tasks are structured by user story to enable independent, incremental delivery.

**Key Constraints**:
- NON-BREAKING EXTENSION: All existing Minimal API functionality preserved
- Offline metadata generation (no runtime endpoints)
- Performance target: <5 seconds generation time
- Testing requirement: ≥80% coverage per SDK Quality Gates

**Total Tasks**: 34 tasks (T001-T034)

---

## Phase 1: Setup

**Purpose**: Project initialization and environment preparation

- [x] T000 Create feature branch 026-dotnet-controller-support
- [x] T001 Add Microsoft.AspNetCore.Mvc.Core 10.0.0 dependency to SDK csproj (Note: Already available via Microsoft.AspNetCore.App framework reference)
- [x] T002 Configure IDE/tooling for ASP.NET Core MVC development

---

## Phase 2: Foundational Prerequisites

**Purpose**: Core infrastructure that BLOCKS all user stories - must complete before any user story work

⚠️ **CRITICAL**: This phase must be 100% complete before starting any user story implementation

- [x] T003 Add IActionDescriptorCollectionProvider service accessor to SDK
- [x] T004 Create test harness infrastructure for controller testing
- [x] T005 Add controller test fixtures in test project

**Checkpoint**: Foundation ready - all user stories can now proceed

---

## Phase 3: User Story 1 - Controller Metadata Discovery (Priority: P1 - MVP)

**Goal**: Discover and extract metadata from ASP.NET Core MVC Controllers so SPAS SDK can generate metadata for controller-based services

**Independent Test**: 
- Create a simple controller with [SpasCommand] attribute
- Run `dotnet spas-generate` 
- Verify metadata archive includes controller endpoint with correct route, verb, and capability type
- Verify Minimal API endpoints still work unchanged

### Implementation for User Story 1

- [x] T006 [P] [US1] Implement DiscoverControllerActions() method in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [x] T007 [P] [US1] Add ExtractRouteFromController() helper in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [x] T008 [P] [US1] Add ExtractHttpVerbFromController() helper in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [x] T009 [US1] Integrate DiscoverControllerActions() into DiscoverSpasMetadata() in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [x] T010 [US1] Add controller fixture with [SpasCommand] in test project
- [x] T011 [US1] Add unit tests for controller discovery in test project

**Checkpoint**: Controller discovery working - can generate metadata for simple controller with [SpasCommand]

---

## Phase 4: User Story 2 - Mixed Routing Support (Priority: P2)

**Goal**: Support services that use both Minimal API and Controllers together, ensuring both routing patterns work correctly

**Independent Test**:
- Create a service with BOTH Minimal API endpoint AND Controller endpoint
- Run `dotnet spas-generate`
- Verify metadata archive includes both endpoints with correct routes
- Test route resolution accuracy (no token conflicts, proper base routes)

### Implementation for User Story 2

- [ ] T012 [P] [US2] Add route template normalization logic in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [ ] T013 [P] [US2] Add mixed routing test fixture (Minimal API + Controllers) in test project
- [ ] T014 [US2] Add integration test for mixed routing scenarios in test project
- [ ] T015 [US2] Verify Minimal API preservation with regression tests in test project

**Checkpoint**: Mixed routing working - services can use both patterns without conflicts

---

## Phase 5: User Story 3 - Schema Inference (Priority: P2)

**Goal**: Infer request/response schemas from controller parameters and return types, reusing Feature 023 patterns

**Independent Test**:
- Create controller with typed parameters (FromBody, FromQuery) and ActionResult<T> return type
- Run `dotnet spas-generate`
- Verify metadata includes correct JSON schemas for request/response
- Verify schema generation for Task<ActionResult<T>> async actions

### Implementation for User Story 3

- [ ] T016 [P] [US3] Implement InferControllerRequestSchema() using Feature 023 patterns in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [ ] T017 [P] [US3] Implement InferControllerResponseSchema() with ActionResult<T> unwrapping in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [ ] T018 [P] [US3] Add schema inference test fixtures in test project
- [ ] T019 [US3] Add unit tests for FromBody parameter schema generation in test project
- [ ] T020 [US3] Add unit tests for ActionResult<T> response schema generation in test project
- [ ] T021 [US3] Add integration test verifying schema inference end-to-end in test project

**Checkpoint**: Schema inference working - controller metadata includes correct request/response schemas

---

## Phase 6: User Story 4 - Event Production Support (Priority: P3)

**Goal**: Support [SpasEvent] attribute on controller actions to declare event production metadata

**Independent Test**:
- Create controller with [SpasEvent] attribute on action method
- Run `dotnet spas-generate`
- Verify metadata includes "produces" section with correct event type and schema
- Verify event schema inference from return type

### Implementation for User Story 4

- [ ] T022 [P] [US4] Add [SpasEvent] attribute detection for controllers in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [ ] T023 [P] [US4] Add event schema extraction logic in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [ ] T024 [US4] Add event production test fixture in test project
- [ ] T025 [US4] Add unit tests for [SpasEvent] on controllers in test project

**Checkpoint**: Event production working - controllers can declare event production via [SpasEvent]

---

## Phase 7: Documentation Updates

**Purpose**: Update all documentation to reflect controller support

- [ ] T026 [P] Fix misleading comments in components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs lines 21 and 70
- [ ] T027 [P] Update README.md line 84 to include controller examples in components/sdk/dotnet/README.md
- [ ] T028 [P] Update agent-prompt.eta to remove Minimal API restrictions in components/cli/spas-service/templates/agent-prompt.eta
- [ ] T029 [P] Update sdk-patterns.eta with controller examples in components/cli/spas-service/templates/sdk-patterns.eta
- [ ] T030 [P] Add Controllers/ folder with OrdersController.cs example in examples/services/order-service/
- [ ] T031 Update Program.cs in order-service to show AddControllers/MapControllers in examples/services/order-service/Program.cs
- [ ] T032 Update quickstart.md with final validation results in specs/026-dotnet-controller-support/quickstart.md

**Checkpoint**: Documentation complete - all references updated to include controller support

---

## Phase 8: Integration Testing & Polish

**Purpose**: End-to-end validation and quality assurance

- [ ] T033 [P] Run order-service example validation from quickstart.md
- [ ] T034 [P] Run regression test suite verifying Minimal API preservation
- [ ] T035 [P] Verify metadata generation performance (<5 seconds)
- [ ] T036 Verify test coverage ≥80% per SDK Quality Gates
- [ ] T037 Run constitution compliance check against 6 SDK principles
- [ ] T038 Final code review and merge preparation

**Checkpoint**: Feature complete and validated - ready for merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User Stories 1, 2, 3, 4 can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P2) → US3 (P2) → US4 (P3)
- **Documentation (Phase 7)**: Should complete after user stories, can proceed once US1 is stable
- **Integration Testing (Phase 8)**: Depends on all phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable  
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable

### Within Each User Story

- Implementation tasks before tests
- Core discovery/generation logic before integration tests
- Models/helpers before main integration points
- Story complete and independently validated before moving to next priority

### Parallel Opportunities

**Within Setup (Phase 1)**:
- All 3 tasks can run in parallel

**Within Foundational (Phase 2)**:
- Tasks T003-T005 can run in parallel (different files)

**Within User Story 1 (Phase 3)**:
- Tasks T006, T007, T008 can run in parallel (different methods in same file)
- Tasks T010, T011 can run in parallel after T009 (different test files)

**Within User Story 2 (Phase 4)**:
- Tasks T012, T013 can run in parallel (different files)
- Task T014, T015 can run in parallel (different test files)

**Within User Story 3 (Phase 5)**:
- Tasks T016, T017, T018 can run in parallel (different methods/files)
- Tasks T019, T020 can run in parallel (different test files)

**Within User Story 4 (Phase 6)**:
- Tasks T022, T023 can run in parallel (different files)
- Tasks T024, T025 can run in parallel (different test files)

**Within Documentation (Phase 7)**:
- Tasks T026, T027, T028, T029, T030 can all run in parallel (different files)

**Within Integration Testing (Phase 8)**:
- Tasks T033, T034, T035 can run in parallel (different validation types)

**Across User Stories** (once Foundational complete):
- All user stories (US1, US2, US3, US4) can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch core implementation tasks together:
Task T006: "Implement DiscoverControllerActions() method"
Task T007: "Add ExtractRouteFromController() helper"
Task T008: "Add ExtractHttpVerbFromController() helper"

# After T009 completes, launch test tasks together:
Task T010: "Add controller fixture with [SpasCommand]"
Task T011: "Add unit tests for controller discovery"
```

---

## Parallel Example: Documentation Phase

```bash
# Launch all documentation tasks together:
Task T026: "Fix SpasContractAttributes.cs comments"
Task T027: "Update README.md with controller examples"
Task T028: "Update agent-prompt.eta"
Task T029: "Update sdk-patterns.eta"
Task T030: "Add OrdersController.cs example"
# T031 runs after T030 (same example service)
```

---

## Implementation Strategy

### Recommended Approach: MVP First

1. **Complete Phase 1**: Setup (T000-T002)
2. **Complete Phase 2**: Foundational (T003-T005) - **CRITICAL blocking phase**
3. **Complete Phase 3**: User Story 1 - Controller Metadata Discovery (T006-T011)
4. **STOP and VALIDATE**: 
   - Test US1 independently using quickstart.md scenarios
   - Verify Minimal API still works (regression test)
   - Generate metadata from test controller
5. **Deploy/Demo MVP**: Basic controller support is now functional

### Incremental Delivery Path

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **Deploy/Demo (MVP!)**
3. Add User Story 2 → Test mixed routing → Deploy/Demo
4. Add User Story 3 → Test schema inference → Deploy/Demo
5. Add User Story 4 → Test event production → Deploy/Demo
6. Complete Documentation → Update all references
7. Integration Testing → Final validation

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (Phases 1-2)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Phase 3) - T006-T011
   - **Developer B**: User Story 2 (Phase 4) - T012-T015  
   - **Developer C**: User Story 3 (Phase 5) - T016-T021
   - **Developer D**: User Story 4 (Phase 6) - T022-T025
3. Team collaborates on Documentation (Phase 7)
4. Team runs Integration Testing (Phase 8)

Stories complete and integrate independently.

---

## Success Criteria Mapping

- **SC-001**: User Story 1 (T006-T011) + Integration test (T034)
- **SC-002**: User Story 2 (T012-T015)
- **SC-003**: User Story 3 (T016-T021)
- **SC-004**: User Story 4 (T022-T025)
- **SC-005**: Integration test (T035) validates <5 second performance
- **SC-006**: Documentation phase (T026-T032) fixes all false claims
- **SC-007**: Documentation phase (T028-T029) updates CLI templates

---

## Notes

- **[P] marker**: Tasks that can run in parallel (different files, no dependencies on incomplete tasks)
- **[US#] marker**: Maps task to specific user story for traceability
- **NON-BREAKING**: All tasks must preserve existing Minimal API functionality
- **Test Coverage**: Each user story has unit tests and integration tests to reach ≥80% coverage
- **Constitution Compliance**: All tasks validated against 6 SDK principles (see plan.md)
- **File Paths**: All file paths are absolute from repository root (C:\Source\Spas\spas\)
- **Commit Strategy**: Commit after each task or logical group
- **Stop at Checkpoints**: Validate story independently before proceeding

---

## Related Documents

- [spec.md](spec.md) - Feature specification with user stories and requirements
- [plan.md](plan.md) - Implementation plan with technical context
- [research.md](research.md) - Technical research and decisions
- [quickstart.md](quickstart.md) - Developer usage guide and test scenarios
- [checklists/requirements.md](checklists/requirements.md) - Validation checklist

---

**Last Updated**: 2025-12-30  
**Ready for Implementation**: Yes  
**Estimated Effort**: 34 tasks across 8 phases
