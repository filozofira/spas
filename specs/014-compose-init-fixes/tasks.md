# Tasks: spas-compose init Scaffolding Fixes

**Input**: Design documents from `/specs/014-compose-init-fixes/`  
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Test tasks included as this is a bug fix requiring validation

**Organization**: Tasks are grouped by user story (bug fix) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (bug fix) this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Prepare for bug fixes (minimal setup needed)

- [x] T001 Create feature branch `014-compose-init-fixes` and spec directory
- [x] T002 Create planning artifacts (plan.md, research.md, data-model.md, contracts/, quickstart.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Copy runtime metadata schema source for reference

- [x] T003 Extract complete runtime metadata schema from `components/repository/schemas/runtime-metadata-v1.schema.json` for inline generation

**Checkpoint**: Schema source ready - bug fixes can now proceed in parallel

---

## Phase 3: User Story 1 - Complete Schema Scaffolding (Priority: P1) 🎯 MVP

**Goal**: Fix missing runtime-metadata-v1.schema.json in external projects by generating it inline

**Independent Test**: Run `spas-compose init test-domain` outside SPAS repository and verify all three schemas exist

### Tests for User Story 1

- [x] T004 [P] [US1] Add unit test for `generateRuntimeMetadataSchema()` in `components/cli/spas-compose/test/utils/templates.test.ts`
- [x] T005 [P] [US1] Add integration test verifying all three schemas created in `components/cli/spas-compose/test/commands/init.test.ts`

### Implementation for User Story 1

- [x] T006 [US1] Create `generateRuntimeMetadataSchema()` function in `components/cli/spas-compose/src/utils/templates.ts`
- [x] T007 [US1] Update `workspace-service.ts` to call `generateRuntimeMetadataSchema()` instead of file copy in `components/cli/spas-compose/src/services/workspace-service.ts`
- [x] T008 [US1] Remove file copy logic (lines 146-164) in `components/cli/spas-compose/src/services/workspace-service.ts`
- [x] T009 [US1] Update return data to include runtime-metadata schema in success message in `components/cli/spas-compose/src/services/workspace-service.ts`

**Checkpoint**: External projects now receive all three schemas when running `spas-compose init`

---

## Phase 4: User Story 2 - Accurate README Documentation (Priority: P2)

**Goal**: Fix README.md Structure section to list all three schemas

**Independent Test**: Run `spas-compose init test-domain` and verify README lists all three schemas in Structure section

### Tests for User Story 2

- [x] T010 [US2] Add unit test for README schema listing in `components/cli/spas-compose/test/utils/templates.test.ts`

### Implementation for User Story 2

- [x] T011 [US2] Update Structure section in `generateWorkspaceReadme()` to list all three schemas in `components/cli/spas-compose/src/utils/templates.ts`

**Checkpoint**: README documentation now accurately reflects all scaffolded schemas

---

## Phase 5: User Story 3 - Correct Agent Prompt Diagram Guidance (Priority: P2)

**Goal**: Fix Phase 3 agent prompt to specify choreography diagrams instead of sequence diagrams

**Independent Test**: Run `spas-compose init test-domain` and verify `.github/agents/spas.compose.agent.md` Phase 3 says "Choreography Diagram"

### Tests for User Story 3

- [x] T012 [US3] Add unit test for choreography diagram terminology in agent file in `components/cli/spas-compose/test/utils/templates.test.ts`
- [x] T013 [US3] Add unit test verifying mermaid flowchart format is specified in `components/cli/spas-compose/test/utils/templates.test.ts`

### Implementation for User Story 3

- [x] T014 [US3] Update Phase 3: Propose section to say "Choreography Diagram (mermaid flowchart)" in `components/cli/spas-compose/src/utils/templates.ts` (in `generateAgentFile()`)
- [x] T015 [US3] Add instruction to add diagram to workspace README.md in Phase 3 in `components/cli/spas-compose/src/utils/templates.ts`
- [x] T016 [US3] Add mermaid flowchart format guidance (flowchart LR with subgraph) in Phase 3 in `components/cli/spas-compose/src/utils/templates.ts`

**Checkpoint**: Agent prompt now guides AI to generate correct diagram type

---

## Phase 6: User Story 4 - Accurate Build Command Documentation (Priority: P2)

**Goal**: Fix Actions section to document correct build commands with `--docker` flag

**Independent Test**: Run `spas-compose init test-domain` and verify `.github/agents/spas.compose.agent.md` Actions section shows three distinct build commands

### Tests for User Story 4

- [x] T017 [US4] Add unit test for build command documentation in agent file in `components/cli/spas-compose/test/utils/templates.test.ts`
- [x] T018 [US4] Add unit test verifying all three command variations (dry-run, dev, prod) in `components/cli/spas-compose/test/utils/templates.test.ts`

### Implementation for User Story 4

- [x] T019 [US4] Update Actions section to document three build command variations in `components/cli/spas-compose/src/utils/templates.ts` (in `generateAgentFile()`)
- [x] T020 [US4] Ensure dry-run command includes `--docker --dry-run` flags in `components/cli/spas-compose/src/utils/templates.ts`
- [x] T021 [US4] Ensure dev build command includes `--docker --dev` flags in `components/cli/spas-compose/src/utils/templates.ts`
- [x] T022 [US4] Ensure prod build command includes `--docker` flag only in `components/cli/spas-compose/src/utils/templates.ts`

**Checkpoint**: Agent prompt now documents all build command variations correctly

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge case handling

- [x] T023 [P] Run all unit tests: `npm test` in `components/cli/spas-compose/`
- [x] T024 [P] Run integration tests: `npm test -- init.test.ts` in `components/cli/spas-compose/`
- [x] T025 Test `spas-compose init` in external project (outside SPAS repo) per quickstart.md
- [x] T026 Test `spas-compose init` inside SPAS repository per quickstart.md
- [x] T027 Test `spas-compose init --force` overwrites schemas correctly per quickstart.md
- [x] T028 [P] Verify all three schemas are valid JSON via `jq` validation
- [x] T029 [P] Verify README Structure section matches actual files
- [x] T030 [P] Verify agent prompt Phase 3 uses choreography diagram terminology
- [x] T031 [P] Verify agent prompt Actions section has three build commands
- [x] T032 Update COMPLETION.md with verification results in `specs/014-compose-init-fixes/`

---

## Task Summary

| Phase | Tasks | Parallel | Description |
|-------|-------|----------|-------------|
| 1. Setup | T001-T002 | 0 | Feature branch and planning |
| 2. Foundational | T003 | 0 | Extract schema source |
| 3. US1 (P1) | T004-T009 | 2 | Fix missing runtime-metadata schema |
| 4. US2 (P2) | T010-T011 | 1 | Fix README structure docs |
| 5. US3 (P2) | T012-T016 | 2 | Fix agent diagram guidance |
| 6. US4 (P2) | T017-T022 | 2 | Fix agent command docs |
| 7. Polish | T023-T032 | 6 | Testing and validation |
| **Total** | **32 tasks** | **13 parallel** | |

---

## Dependencies & Parallel Execution

### Critical Path (Must Be Sequential)

1. T001-T002 → T003 → T006 → T007-T009 (US1 implementation)
2. After US1: T011 (US2), T014-T016 (US3), T019-T022 (US4) can proceed independently

### Parallel Opportunities

**After T003 (Schema extracted)**:
- T004-T005 (US1 tests) + T010 (US2 test) + T012-T013 (US3 tests) + T017-T018 (US4 tests)

**After US1 complete (T009)**:
- T011 (US2 impl) parallel with T014-T016 (US3 impl) parallel with T019-T022 (US4 impl)

**Phase 7 (Polish)**:
- T023-T024 (tests) parallel with T025-T027 (manual testing) parallel with T028-T031 (verification)

### User Story Completion Order

**MVP (P1)**: User Story 1 only (T004-T009)
- Delivers: External projects get all three schemas

**Iteration 2 (P2)**: Add User Stories 2, 3, 4 in any order
- US2 (T010-T011): README accuracy
- US3 (T012-T016): Agent diagram guidance  
- US4 (T017-T022): Agent command docs

---

## Implementation Strategy

### MVP First (User Story 1 Only)

Focus on P1 bug fix first:
1. Complete T001-T009 (US1)
2. Validate with T025-T026 (external + internal testing)
3. Deploy if critical

### Full Feature (All User Stories)

If time permits, complete all bugs in one iteration:
1. US1 (T004-T009) - Critical path
2. US2-US4 (T010-T022) - Parallel work
3. Polish (T023-T032) - Final validation

### Quality Gates

- [ ] All unit tests pass (T023)
- [ ] Integration tests pass (T024)  
- [ ] Manual testing in external project passes (T025)
- [ ] Manual testing in SPAS repo passes (T026)
- [ ] Force overwrite works (T027)
- [ ] All schemas valid JSON (T028)
- [ ] Documentation matches reality (T029-T031)

---

## Notes

**Estimated Effort**: 4-6 hours total
- US1 (P1): 2-3 hours (critical path)
- US2-US4 (P2): 1-2 hours each (parallel)
- Testing: 1 hour

**Risk**: Low - isolated bug fixes in template generation functions

**Rollback**: Simple revert if issues - no breaking changes to CLI interface
