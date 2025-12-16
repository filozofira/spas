# Tasks: Sidecar Transform File Loading

**Input**: Design documents from `/specs/010-sidecar-transform-loading/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

**Tests**: Unit tests included per user story (PoC policy: unit tests mandatory, integration tests optional)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Component**: `components/sidecar/` (existing sidecar component)
- **Source**: `components/sidecar/src/`
- **Tests**: `components/sidecar/test/unit/`

---

## Phase 1: Setup

**Purpose**: Verify existing test infrastructure and prepare for changes

- [ ] T001 Verify sidecar tests pass with `npm test` in components/sidecar/
- [ ] T002 [P] Create test fixture directory at components/sidecar/test/fixtures/transforms/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core file loading infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add `isFilePath()` helper function to detect `.jsonata` extension in components/sidecar/src/services/transformer.ts
- [ ] T004 Add `loadTransformContent()` function to read file content with error handling in components/sidecar/src/services/transformer.ts
- [ ] T005 Add `resolveTransformPath()` function to handle relative path resolution in components/sidecar/src/services/transformer.ts

**Checkpoint**: File loading utilities ready - user story implementation can begin

---

## Phase 3: User Story 1 - Apply File-Based Transform to Inbound Events (Priority: P1) 🎯 MVP

**Goal**: Sidecar loads JSONata expressions from `.jsonata` files and applies them to inbound events

**Independent Test**: Configure sidecar with transform file path, verify file content is loaded and applied

### Unit Tests for User Story 1

- [ ] T006 [P] [US1] Add test fixture file `passthrough.jsonata` with `$` expression in components/sidecar/test/fixtures/transforms/
- [ ] T007 [P] [US1] Add test fixture file `extract-order.jsonata` with object construction in components/sidecar/test/fixtures/transforms/
- [ ] T008 [US1] Add unit tests for `isFilePath()` helper in components/sidecar/test/unit/services/transformer.test.ts
- [ ] T009 [US1] Add unit tests for file-based transform loading (success case) in components/sidecar/test/unit/services/transformer.test.ts
- [ ] T010 [US1] Add unit tests for file not found error in components/sidecar/test/unit/services/transformer.test.ts
- [ ] T011 [US1] Add unit tests for invalid JSONata syntax in file in components/sidecar/test/unit/services/transformer.test.ts
- [ ] T012 [US1] Add unit tests for inline expression backward compatibility in components/sidecar/test/unit/services/transformer.test.ts

### Implementation for User Story 1

- [ ] T013 [US1] Modify `applyTransform()` to detect file paths and load content before compilation in components/sidecar/src/services/transformer.ts
- [ ] T014 [US1] Update `validateTransform()` to support file-based validation in components/sidecar/src/services/transformer.ts
- [ ] T015 [US1] Run tests to verify User Story 1 complete with `npm test` in components/sidecar/

**Checkpoint**: Inbound file-based transforms work. Events with `.jsonata` paths are transformed correctly.

---

## Phase 4: User Story 2 - Cache Compiled Transform Expressions (Priority: P2)

**Goal**: Transform expressions (file-based and inline) are cached after first compilation

**Independent Test**: Process multiple events with same transform, verify file is read only once

### Unit Tests for User Story 2

- [ ] T016 [US2] Add unit test verifying file-based transform cache hit (file read once) in components/sidecar/test/unit/services/transformer.test.ts
- [ ] T017 [US2] Add unit test verifying cache key uses file path not content in components/sidecar/test/unit/services/transformer.test.ts

### Implementation for User Story 2

- [ ] T018 [US2] Verify existing cache mechanism handles file paths correctly (cache key = file path string) in components/sidecar/src/services/transformer.ts
- [ ] T019 [US2] Add logging for cache hit/miss to aid debugging in components/sidecar/src/services/transformer.ts
- [ ] T020 [US2] Run tests to verify User Story 2 complete with `npm test` in components/sidecar/

**Checkpoint**: Caching works. Same file path reuses compiled expression.

---

## Phase 5: User Story 3 - Apply File-Based Transform to Outbound Events (Priority: P3)

**Goal**: Outbound event transforms from files work via EventPublisher

**Independent Test**: Configure outbound transform file, invoke publish endpoint, verify transform applied

### Unit Tests for User Story 3

- [ ] T021 [P] [US3] Add test fixture file `outbound-stock-reserved.jsonata` in components/sidecar/test/fixtures/transforms/
- [ ] T022 [US3] Add unit test for outbound file-based transform in components/sidecar/test/unit/services/event-publisher.test.ts

### Implementation for User Story 3

- [ ] T023 [US3] Replace placeholder `applyTransform` in EventPublisher with import from transformer.ts in components/sidecar/src/services/event-publisher.ts
- [ ] T024 [US3] Run tests to verify User Story 3 complete with `npm test` in components/sidecar/

**Checkpoint**: Outbound transforms work. Both inbound and outbound support file-based transforms.

---

## Phase 6: Polish & Validation

**Purpose**: Final validation and documentation

- [ ] T025 Run full test suite to verify all changes in components/sidecar/
- [ ] T026 [P] Update sidecar README with file-based transform documentation in components/sidecar/README.md
- [ ] T027 Run quickstart.md validation (manual verification of transform file workflow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - verify baseline
- **Phase 2 (Foundational)**: Depends on Phase 1 - creates file loading utilities
- **Phase 3 (US1)**: Depends on Phase 2 - implements inbound transform loading
- **Phase 4 (US2)**: Depends on Phase 3 - verifies caching behavior
- **Phase 5 (US3)**: Depends on Phase 2 (can parallel with US1/US2) - implements outbound transforms
- **Phase 6 (Polish)**: Depends on all user stories

### User Story Independence

- **US1 (P1)**: Core file loading - can be delivered as MVP
- **US2 (P2)**: Caching verification - builds on US1 but is independently testable
- **US3 (P3)**: Outbound transforms - can start after Phase 2, independent of US1 implementation details

### Parallel Opportunities

```text
Phase 2 (Foundational):
  T003, T004, T005 - Sequential (build on each other)

Phase 3 (US1):
  T006, T007 - Parallel (fixture files)
  T008-T012 - Sequential (tests first)
  T013, T014 - Sequential (implementation)

Phase 5 (US3):
  T021 - Can start as soon as Phase 2 complete (fixture file)
  T022-T024 - After US1 complete (uses same transformer module)

Phase 6 (Polish):
  T025, T026, T027 - T025 first, then T026/T027 parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: User Story 1 (T006-T015)
4. **STOP and VALIDATE**: Inbound file transforms work
5. Deploy/demo if ready

### Full Delivery

1. Complete MVP (Phases 1-3)
2. Add Phase 4: User Story 2 (caching verification)
3. Add Phase 5: User Story 3 (outbound transforms)
4. Complete Phase 6: Polish and documentation

---

## Notes

- Primary file to modify: `components/sidecar/src/services/transformer.ts`
- Secondary file: `components/sidecar/src/services/event-publisher.ts` (US3 only)
- Test file: `components/sidecar/test/unit/services/transformer.test.ts`
- New fixtures: `components/sidecar/test/fixtures/transforms/*.jsonata`
- All tasks use absolute paths relative to repository root
