# Tasks: Compose Diagram Flow Notations

**Input**: Design documents from `/specs/019-compose-diagram-flow/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: Not explicitly requested - minimal test additions for template content verification.

**Organization**: Tasks organized by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Project**: `components/cli/spas-compose/` (TypeScript CLI)
- **Source**: `src/utils/templates.ts`
- **Tests**: `test/unit/utils/templates.test.ts`

---

## Phase 1: Setup

**Purpose**: Prepare development environment

- [X] T001 Checkout feature branch `019-compose-diagram-flow` and verify local build in components/cli/spas-compose/
- [X] T002 Run existing tests to confirm baseline passes: `npm test` in components/cli/spas-compose/

---

## Phase 2: Foundational

**Purpose**: N/A - No foundational changes required. All changes are template text modifications.

**Checkpoint**: Baseline verified - user story implementation can begin

---

## Phase 3: User Story 1 - Agent Generates Diagram with Start/End Nodes (Priority: P1) 🎯 MVP

**Goal**: Extend the agent prompt template so generated Mermaid diagrams include `Start([Start])` and `End([End])` nodes.

**Independent Test**: After implementation, run `spas-compose init test-domain --output /tmp` and verify the generated `.github/prompts/spas.compose.prompt.md` contains diagram instructions with Start/End notation.

### Implementation for User Story 1

- [X] T003 [US1] Update diagram template in `generateWorkflowPhases()` to use `Start([Start])` and `End([End])` nodes in components/cli/spas-compose/src/utils/templates.ts (~line 560)
- [X] T004 [US1] Add explicit agent instruction requiring Start node connected to first service in the flow in components/cli/spas-compose/src/utils/templates.ts (Phase 2: Propose section)
- [X] T005 [US1] Add explicit agent instruction requiring End node connected from terminal events in components/cli/spas-compose/src/utils/templates.ts (Phase 2: Propose section)
- [X] T006 [US1] Add explicit agent instruction requiring `flowchart LR` direction (not subgraph-wrapped) in components/cli/spas-compose/src/utils/templates.ts
- [X] T007 [US1] Add explicit agent instruction requiring edge labels with event types in components/cli/spas-compose/src/utils/templates.ts

**Checkpoint**: Diagram template now includes Start/End notation rules ✅

---

## Phase 4: User Story 2 - Diagram Auto-Inserted into Domain README (Priority: P1)

**Goal**: Add agent instruction to insert/update the Mermaid diagram in the domain README.md file.

**Independent Test**: After implementation, verify the generated agent prompt contains instruction to add diagram to README.

### Implementation for User Story 2

- [ ] T008 [US2] Add explicit agent instruction to insert/update diagram in domain README.md in components/cli/spas-compose/src/utils/templates.ts (Phase 2: Propose section)
- [ ] T009 [US2] Add explicit agent instruction for diagram placement (at top of file, after title) in components/cli/spas-compose/src/utils/templates.ts

**Checkpoint**: Agent prompt now instructs to update README with diagram

---

## Phase 5: Testing & Validation

**Purpose**: Verify template changes work correctly

- [ ] T010 [P] Add test case verifying `Start([Start])` appears in generated agent prompt in components/cli/spas-compose/test/unit/utils/templates.test.ts
- [ ] T011 [P] Add test case verifying `End([End])` appears in generated agent prompt in components/cli/spas-compose/test/unit/utils/templates.test.ts
- [ ] T012 [P] Add test case verifying README update instruction appears in generated agent prompt in components/cli/spas-compose/test/unit/utils/templates.test.ts
- [ ] T013 Run full test suite: `npm test` in components/cli/spas-compose/
- [ ] T014 Manual validation: Run `spas-compose init test-domain --output /tmp` and inspect generated prompt file

---

## Phase 6: Polish & Documentation

**Purpose**: Final cleanup and documentation

- [ ] T015 Update spec checklist to mark requirements FR-001 through FR-008 as complete in specs/019-compose-diagram-flow/checklists/requirements.md
- [ ] T016 Commit all changes with message: "feat(spas-compose): add Start/End flow notations to diagram template"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: N/A for this feature
- **User Story 1 (Phase 3)**: Depends on Setup
- **User Story 2 (Phase 4)**: Can run in parallel with User Story 1 (same file, different sections)
- **Testing (Phase 5)**: Depends on Phases 3 and 4
- **Polish (Phase 6)**: Depends on Phase 5

### User Story Dependencies

- **User Story 1 (P1)**: Independent - modifies diagram template section
- **User Story 2 (P1)**: Independent - modifies README instruction section

### Parallel Opportunities

- T003-T007 can be done as a single edit operation (same template function)
- T008-T009 can be done as a single edit operation (same template function)
- T010, T011, T012 can run in parallel (different test cases)

---

## Parallel Example: Phase 5 Testing

```bash
# Launch all test additions in parallel:
Task T010: "Add test for Start([Start]) in templates.test.ts"
Task T011: "Add test for End([End]) in templates.test.ts"
Task T012: "Add test for README update instruction in templates.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Start/End diagram template)
3. **STOP and VALIDATE**: Test with `spas-compose init`
4. If working, continue to User Story 2

### Incremental Delivery

1. Setup → Baseline verified
2. User Story 1 → Start/End nodes in diagram template → Validate
3. User Story 2 → README update instruction → Validate
4. Testing → All tests pass → Ready for PR

---

## Notes

- All changes are in a single file: `templates.ts`
- Template is string-based, so changes are straightforward text modifications
- Existing test file `templates.test.ts` provides patterns for new tests
- No breaking changes to existing domains - changes only affect newly initialized workspaces
- Total estimated effort: ~50 lines of template text changes + ~30 lines of test code
