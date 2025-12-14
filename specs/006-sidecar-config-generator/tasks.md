# Tasks: Sidecar Config Generator

**Input**: Design documents from `/specs/006-sidecar-config-generator/`  
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/sidecar-config.ts, quickstart.md

**Tests**: Included per spec.md Definition of Done (target: 10+ tests)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Target: `components/cli/spas-compose/` (enhancement to existing CLI)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add types and prepare project for new service class

- [x] T001 [P] Add SidecarConfig types to `components/cli/spas-compose/src/types.ts` from contracts/sidecar-config.ts
- [x] T002 [P] Create empty `SidecarConfigGenerator` class skeleton in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T003 [P] Create test file skeleton in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`

**Checkpoint**: Type definitions and file structure ready for implementation ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core generator infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `getAllParticipants()` method to extract unique service names from choreography in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T005 Implement `buildOutboundEntries()` method to extract outbound entries for a service from all flows in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T006 Implement `buildInboundEntries()` method to extract inbound entries for a service from all flow targets in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T007 Add unit tests for `getAllParticipants()` in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [x] T008 Add unit tests for `buildOutboundEntries()` and `buildInboundEntries()` in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`

**Checkpoint**: Foundation ready - core extraction methods tested and working ✅

---

## Phase 3: User Story 1 - Generate Sidecar Configs During Deploy (Priority: P1) 🎯 MVP

**Goal**: `spas-compose choreography deploy --docker` generates `config.{service}.json` files alongside docker-compose.yaml

**Independent Test**: Run `spas-compose choreography deploy --docker` with valid choreography and verify config files are generated for each service

### Tests for User Story 1

- [x] T009 [P] [US1] Test `generate()` returns correct SidecarConfig structure per service in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [x] T010 [P] [US1] Test config aggregation from multiple flows where service participates in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [x] T011 [P] [US1] Test empty inbound/outbound arrays for services with no entries in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Implement main `generate(choreography: Choreography)` method that returns `ConfigGeneratorResult` in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T013 [US1] Implement `buildSummary()` method to create `ConfigSummary` for CLI output in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T014 [US1] Integrate `SidecarConfigGenerator` into `choreography-deploy.ts` after docker-compose generation in `components/cli/spas-compose/src/commands/choreography-deploy.ts`
- [x] T015 [US1] Add file writing logic for config files to workspace root in `components/cli/spas-compose/src/commands/choreography-deploy.ts`
- [x] T016 [US1] Add human-readable success messages for config generation in `components/cli/spas-compose/src/commands/choreography-deploy.ts`

**Checkpoint**: User Story 1 complete - config files generated alongside docker-compose.yaml ✅

---

## Phase 4: User Story 2 - Validate Config Generation in Dry Run (Priority: P1)

**Goal**: `--dry-run` shows sidecar config summaries without writing files

**Independent Test**: Run `spas-compose choreography deploy --docker --dry-run` and verify output shows config summaries but no files are written

### Tests for User Story 2

- [x] T017 [P] [US2] Test dry-run mode includes config summary in result in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`

### Implementation for User Story 2

- [x] T018 [US2] Add dry-run output for sidecar configs showing service names and entry counts in `components/cli/spas-compose/src/commands/choreography-deploy.ts`
- [x] T019 [US2] Add JSON mode output for sidecar configs in `--dry-run --json` mode in `components/cli/spas-compose/src/commands/choreography-deploy.ts`
- [x] T020 [US2] Ensure no config files are written when `--dry-run` is specified in `components/cli/spas-compose/src/commands/choreography-deploy.ts`

**Checkpoint**: User Story 2 complete - dry run shows complete output preview ✅

---

## Phase 5: User Story 3 - Handle Missing Transformation References (Priority: P2)

**Goal**: Clear error messages when transformation files referenced in choreography don't exist

**Independent Test**: Reference non-existent transformation in choreography.yaml and verify error includes file path

### Tests for User Story 3

- [x] T021 [P] [US3] Test error returned for missing transformation file in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [x] T022 [P] [US3] Test all missing files reported (not just first) in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`

### Implementation for User Story 3

- [x] T023 [US3] Add `validateTransformationPaths()` method to check existence of all transformation files in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T024 [US3] Integrate validation before generation, returning `ConfigError[]` for all missing files in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T025 [US3] Add human-readable error output for missing transformation files in `components/cli/spas-compose/src/commands/choreography-deploy.ts`

**Checkpoint**: User Story 3 complete - missing transformation files reported clearly ✅

**Note**: T024-T025 satisfied by existing JsonataValidator integration in choreography-deploy.ts which validates and reports all missing transformation files before any file generation.

---

## Phase 6: User Story 4 - Support Optional Transformations (Priority: P2)

**Goal**: Event routes without transformations work as passthrough (no transform field in config)

**Independent Test**: Define event route without `transform` field and verify generated config omits transform property

### Tests for User Story 4

- [x] T026 [P] [US4] Test inbound entry omits transform when not specified in choreography in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [x] T027 [P] [US4] Test outbound entry omits transform when not specified in choreography in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`

### Implementation for User Story 4

- [x] T028 [US4] Ensure `buildInboundEntries()` conditionally adds transform only when present in target in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [x] T029 [US4] Ensure `buildOutboundEntries()` conditionally adds transform only when present (future support) in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`

**Checkpoint**: User Story 4 complete - optional transformations handled correctly ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and final integration testing

- [x] T030 [P] Export SidecarConfigGenerator from services index in `components/cli/spas-compose/src/services/index.ts` (if exists) or update imports — N/A: no index.ts exists, direct imports used
- [x] T031 [P] Add edge case tests: empty choreography, duplicate topic entries in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [x] T032 Run all 67+ existing tests to verify no regressions — 95 tests pass
- [x] T033 Run quickstart.md validation scenarios end-to-end — implementation matches all scenarios
- [x] T034 Update README.md to document new config generation behavior in `components/cli/spas-compose/README.md`

**Checkpoint**: Phase 7 complete - all 34 tasks done ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 (P1) must complete before full integration testing
  - US2 (P1) can proceed in parallel with US1 (different code paths)
  - US3 (P2) and US4 (P2) can proceed in parallel after US1
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core generation - no dependencies on other stories
- **User Story 2 (P1)**: Dry-run - uses same generator, different output path
- **User Story 3 (P2)**: Validation - can add validation to existing generate flow
- **User Story 4 (P2)**: Optional transforms - refinement of existing logic

### Within Each User Story

- Tests written first, verified to exist
- Implementation follows tests
- Integration with choreography-deploy.ts last

### Parallel Opportunities

**Phase 1 (all parallel)**:

- T001, T002, T003 can run simultaneously

**Phase 2 (sequential)**:

- T004 → T005 → T006 → T007 → T008 (methods depend on each other)

**Phase 3-6 Tests (parallel within story)**:

- T009, T010, T011 can run simultaneously
- T017 independent
- T021, T022 can run simultaneously
- T026, T027 can run simultaneously

---

## Parallel Example: Phase 1 Setup

```bash
# All three setup tasks can run in parallel:
Task T001: "Add SidecarConfig types to types.ts"
Task T002: "Create SidecarConfigGenerator class skeleton"
Task T003: "Create test file skeleton"
```

## Parallel Example: User Story 1 Tests

```bash
# All US1 tests can be written in parallel:
Task T009: "Test generate() returns correct structure"
Task T010: "Test config aggregation from multiple flows"
Task T011: "Test empty arrays for services with no entries"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T016)
4. **STOP and VALIDATE**: Test with sample choreography.yaml
5. If working: Proceed to remaining stories

### Incremental Delivery

1. Setup + Foundational → Generator skeleton ready
2. Add User Story 1 → Basic config generation works (MVP!)
3. Add User Story 2 → Dry-run shows complete preview
4. Add User Story 3 → Missing file errors are clear
5. Add User Story 4 → Optional transforms supported
6. Polish → Documentation and edge cases

### Task Count Summary

| Phase                 | Tasks  | Description             |
| --------------------- | ------ | ----------------------- |
| Phase 1: Setup        | 3      | Types and skeletons     |
| Phase 2: Foundational | 5      | Core extraction methods |
| Phase 3: User Story 1 | 8      | Config generation (MVP) |
| Phase 4: User Story 2 | 4      | Dry-run support         |
| Phase 5: User Story 3 | 5      | Missing file handling   |
| Phase 6: User Story 4 | 4      | Optional transforms     |
| Phase 7: Polish       | 5      | Validation and docs     |
| **Total**             | **34** |                         |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Target: 10+ unit tests (T007-T011, T017, T021-T022, T026-T027, T031 = 12 test tasks)
- Existing 67 tests must continue to pass (T032)
- Integration with `choreography-deploy.ts` is the key merge point
- Commit after each task or logical group
