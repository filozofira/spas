# Tasks: Remove Publish Service Prompt

**Feature**: 020-publish-no-prompt  
**Input**: Design documents from `/specs/020-publish-no-prompt/`  
**Status**: Ready for implementation

## Task Format

- `- [ ]` Checkbox for tracking completion
- `[T###]` Sequential task ID
- `[P]` Parallelizable (different files, no blocking dependencies)
- `[US#]` User story label (US1, US2, etc.)
- File path in description

---

## Phase 1: Setup

**Purpose**: Verify environment and existing codebase

- [X] T001 Review existing publish workflow in components/cli/spas-service/src/services/publish-service.ts
- [X] T002 Verify current test coverage in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T003 Run existing tests to establish baseline: `npm test` in components/cli/spas-service/

---

## Phase 2: Foundational (Prerequisites)

**Purpose**: Prepare shared infrastructure for both user stories

- [X] T004 Remove `promptUser()` method from components/cli/spas-service/src/services/publish-service.ts (~20 lines)
- [X] T005 Remove call to `promptUser()` in `publish()` method in components/cli/spas-service/src/services/publish-service.ts
- [X] T006 Remove readline import and related dependencies from components/cli/spas-service/src/services/publish-service.ts
- [X] T007 [P] Add `--no-retry` flag to publish command definition in components/cli/spas-service/src/commands/publish.ts
- [X] T008 Remove tests that verify prompt behavior from components/cli/spas-service/test/unit/services/publish-service.test.ts

**Checkpoint**: Prompt removed - all tests should now fail or require updates

---

## Phase 3: User Story 1 - Direct Publish Without Prompt (Priority: P1) 🎯 MVP

**Goal**: Remove interactive prompt so `spas-service publish` immediately attempts metadata download, enabling CI/CD automation

**Independent Test**: Run `spas-service publish http://localhost:5000 --repo http://localhost:3000` with service already running and verify CLI downloads metadata immediately without any prompt

### Implementation for User Story 1

- [X] T009 [US1] Modify `downloadMetadata()` method to attempt immediate download in components/cli/spas-service/src/services/publish-service.ts
- [X] T010 [US1] Update `publish()` method to call `downloadMetadata()` directly (no prompt) in components/cli/spas-service/src/services/publish-service.ts
- [X] T011 [US1] Ensure `--archive` mode behavior unchanged (no service download) in components/cli/spas-service/src/services/publish-service.ts
- [X] T012 [US1] Add test: successful immediate download when service available in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T013 [US1] Add test: immediate failure when service unavailable (no retry yet) in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T014 [US1] Add test: `--archive` mode bypasses service download in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T015 [US1] Update integration tests to not expect prompt in components/cli/spas-service/test/integration/ (if any)
- [X] T016 [US1] Verify CI/CD compatibility: test command in non-interactive environment (bash script with `< /dev/null`)

**Checkpoint**: US1 complete - publish works without prompt, fails immediately if service unavailable

---

## Phase 4: User Story 2 - Retry on Service Unavailable (Priority: P2)

**Goal**: Add automatic retry with exponential backoff (4 attempts: 1s, 2s, 4s, 8s) to handle services still starting up

**Independent Test**: Start service with 2-second delay, immediately run publish, verify CLI retries and succeeds when service becomes available

### Implementation for User Story 2

- [X] T017 [US2] Create `retryWithBackoff()` utility method in components/cli/spas-service/src/services/publish-service.ts (~50 lines)
- [X] T018 [US2] Implement error classification logic (connection vs HTTP errors) in components/cli/spas-service/src/services/publish-service.ts
- [X] T019 [US2] Add status message display before each retry: "Waiting for service... (attempt X/Y)" in components/cli/spas-service/src/services/publish-service.ts
- [X] T020 [US2] Wrap `downloadMetadata()` HTTP call in `retryWithBackoff()` when `--no-retry` is false in components/cli/spas-service/src/services/publish-service.ts
- [X] T021 [US2] Implement `--no-retry` flag behavior (skip retry logic) in components/cli/spas-service/src/services/publish-service.ts
- [X] T022 [US2] Format exhaustion error message with URL, attempts, time, suggestion per FR-005 in components/cli/spas-service/src/services/publish-service.ts
- [X] T023 [US2] Add test: successful retry after 1-2 failed attempts in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T024 [US2] Add test: error message after all retries exhausted in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T025 [US2] Add test: retry only on connection errors (ECONNREFUSED, ETIMEDOUT) in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T026 [US2] Add test: fail immediately on HTTP errors (404, 500) without retry in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T027 [US2] Add test: `--no-retry` flag disables retry logic in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T028 [US2] Add test: retry status messages displayed correctly in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T029 [US2] Add test: exponential backoff timing (1s, 2s, 4s, 8s) in components/cli/spas-service/test/unit/services/publish-service.test.ts
- [X] T030 [US2] Verify `--dry-run` still applies retry logic in components/cli/spas-service/test/unit/services/publish-service.test.ts

**Checkpoint**: US2 complete - publish retries gracefully with clear feedback, handles all error scenarios

---

## Phase 5: Integration & Validation

**Purpose**: End-to-end validation using quickstart scenarios

- [ ] T031 Run Quickstart Scenario 1: Service already running (expect <5s completion) per quickstart.md
- [ ] T032 Run Quickstart Scenario 2: Service startup delay (expect retry and success) per quickstart.md
- [ ] T033 Run Quickstart Scenario 3: Service never available (expect clear error after 15s) per quickstart.md
- [ ] T034 Run Quickstart Scenario 4: HTTP 404 error (expect immediate failure, no retry) per quickstart.md
- [ ] T035 Run Quickstart Scenario 5: `--no-retry` flag (expect immediate failure) per quickstart.md
- [ ] T036 Run Quickstart Scenario 6: CI/CD script (expect non-interactive success) per quickstart.md
- [ ] T037 Run Quickstart Scenario 7: `--archive` mode (expect no retry logic) per quickstart.md
- [ ] T038 Run Quickstart Scenario 8: `--dry-run` with retry (expect retry applies) per quickstart.md

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final verification

- [ ] T039 Update components/cli/spas-service/README.md if it documents prompt behavior (verify no changes needed)
- [ ] T040 Run full test suite: `npm test` in components/cli/spas-service/
- [ ] T041 Verify all success criteria from spec.md:
  - SC-001: No stdin required ✓
  - SC-002: CI/CD compatible ✓
  - SC-003: Fast publish <5s ✓
  - SC-004: Retry window 15s ✓
- [ ] T042 Update CHANGELOG or release notes with breaking change notice
- [ ] T043 Verify backward compatibility: `--archive`, `--dry-run`, `--repo` flags unchanged

---

## Dependencies

### User Story Completion Order

1. **Phase 1-2**: Setup and Foundational (blocking all stories)
2. **Phase 3 (US1)**: Must complete before US2 (US2 builds on US1's direct download)
3. **Phase 4 (US2)**: Can start immediately after US1 checkpoint
4. **Phase 5-6**: Integration and Polish (after both stories complete)

### Parallel Opportunities

**Within US1** (after foundational complete):
- T012, T013, T014 (tests) can run in parallel after T009-T011 complete

**Within US2**:
- T023-T030 (tests) can run in parallel after T017-T022 complete

**Between US1 and US2**:
- Cannot parallelize - US2 depends on US1's downloadMetadata() implementation

---

## Implementation Strategy

### MVP Scope (Recommended)

**MVP = User Story 1 only** (Tasks T001-T016)

Delivers immediate value:
- Removes prompt friction
- Enables basic CI/CD automation
- Fails fast when service unavailable

Deploy and validate before adding retry complexity.

### Incremental Delivery

1. **Iteration 1 (MVP)**: US1 - Remove prompt, immediate download
2. **Iteration 2**: US2 - Add retry with backoff for graceful handling

---

## Task Summary

- **Total Tasks**: 43
- **Setup**: 3 tasks (T001-T003)
- **Foundational**: 5 tasks (T004-T008)
- **User Story 1**: 8 tasks (T009-T016)
- **User Story 2**: 14 tasks (T017-T030)
- **Integration**: 8 tasks (T031-T038)
- **Polish**: 5 tasks (T039-T043)

**Estimated Complexity**:
- Low: T001-T003, T039, T042-T043
- Medium: T004-T016, T023-T038
- Medium-High: T017-T022

**Total Lines Changed**: ~150 lines (production code) + ~100 lines (tests)
