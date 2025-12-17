# Tasks: Agent Prompt Enrichment

**Input**: Design documents from `/specs/013-agent-prompt-enrichment/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- All paths relative to `components/cli/spas-compose/`

---

## Phase 1: Setup ✅ COMPLETE

**Purpose**: Prepare development environment and understand existing code

- [X] T001 Review existing `generateAgentFile()` in src/utils/templates.ts (lines 137-351, ~215 lines)
- [X] T002 [P] Create backup of current agent prompt output for comparison testing
  - Saved to `.baseline/agent-prompt-before.md` (7,774 bytes / ~7.6KB)
- [X] T003 [P] Identify helper function extraction points in templates.ts
  - Workflow (lines 201-290) → `generateWorkflowPhases()`
  - Sidecar mapping (lines 321-349) → merge into `generateTechnicalReference()`
  - New: `generateKnownPitfalls()`, `generateTroubleshooting()`, `generateCompleteExamples()`

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Create modular structure for maintainable prompt generation

**⚠️ CRITICAL**: User story implementation requires this refactoring complete first

- [X] T004 Extract `generateTechnicalReference()` helper function in src/utils/templates.ts
- [X] T005 [P] Extract `generateWorkflowPhases()` helper function in src/utils/templates.ts
- [X] T006 [P] Extract `generateKnownPitfalls()` helper function in src/utils/templates.ts
- [X] T007 [P] Extract `generateTroubleshooting()` helper function in src/utils/templates.ts
- [X] T008 [P] Extract `generateCompleteExamples()` helper function in src/utils/templates.ts
- [X] T009 Update `generateAgentFile()` to compose from helper functions
  - All 172 tests pass
  - Output: 7,680 bytes (vs 7,774 baseline - removed external refs)

**Checkpoint**: ✅ Helper function structure ready - user story content can now be added

---

## Phase 3: User Story 1 - Self-Contained Agent Prompt (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Agent prompt contains all information needed for autonomous composition without external references

**Independent Test**: Run `spas-compose init` in empty project, verify no SPAS repo path references in generated prompt

### Implementation for User Story 1

- [X] T010 [US1] Add CloudEvents type format documentation to `generateTechnicalReference()` in src/utils/templates.ts
  - Format: `com.{bounded-context}.{event-name-kebab}`
  - Include bounded context derivation rules
  - Add examples from research.md

- [X] T011 [US1] Add complete sidecar config schema documentation to `generateTechnicalReference()` in src/utils/templates.ts
  - All fields from research.md Section 6
  - Required vs optional markers
  - Complete example config

- [X] T012 [US1] Add JSONata transformation patterns to `generateTechnicalReference()` in src/utils/templates.ts
  - `$append([], ...)` array pattern with ✅/❌ examples
  - Object construction pattern
  - Conditional fields pattern

- [X] T013 [US1] Add endpoint routing documentation to `generateTechnicalReference()` in src/utils/templates.ts
  - `/proxy/{serviceId}/{path}` format
  - Mapping to proxies config
  - Docker network resolution

- [X] T014 [US1] Add field naming conventions (camelCase) to `generateTechnicalReference()` in src/utils/templates.ts
  - Correct/incorrect examples
  - Consistency rule across schemas, payloads, JSONata

- [X] T015 [US1] Remove all SPAS repo path references from agent prompt generation in src/utils/templates.ts
  - Audited for `principles/`, `specs/`, `components/` references
  - No external refs found in agent prompt ✅

- [X] T016 [US1] Add unit test for self-contained prompt in test/unit/utils/templates.test.ts
  - Assert no external repo path references ✅
  - Assert all required sections present ✅
  - 9 tests created, all passing

**Results**:
- File size: 11,637 bytes (~11.4KB, well under 25KB limit)
- All 181 tests pass (9 new + 172 existing)
- Baseline saved: `.baseline/agent-prompt-after-phase3.md`

**Checkpoint**: ✅ User Story 1 complete - agent prompt is self-contained with comprehensive technical reference

---

## Phase 4: User Story 2 - Phased Workflow with Validation (Priority: P1)

**Goal**: Agent follows systematic 5-phase workflow with validation checkpoints and diagrams

**Independent Test**: Review generated prompt, verify all 5 phases have entry/exit criteria and Phase 2 includes diagram template

### Implementation for User Story 2

- [X] T017 [US2] Restructure workflow to 5 explicit phases in `generateWorkflowPhases()` in src/utils/templates.ts
  - Phase 1: Analyze (entry: request received, exit: understanding confirmed)
  - Phase 2: Propose (includes diagram, confirmation prompt)
  - Phase 3: Generate (create artifacts)
  - Phase 4: Validate (check artifacts)
  - Phase 5: Build (deployment)

- [X] T018 [US2] Add Mermaid sequence diagram template to Phase 2 in src/utils/templates.ts
  - Participant naming convention
  - Request/response arrows
  - Event emission notation

- [X] T019 [US2] Add confirmation prompts between phases in `generateWorkflowPhases()` in src/utils/templates.ts
  - "Do you want me to proceed with generating the choreographies?"
  - Summary of what was completed before each prompt

- [X] T020 [US2] Add validation checklist per phase in `generateWorkflowPhases()` in src/utils/templates.ts
  - Phase 3: YAML syntax, field names, endpoint format
  - Phase 4: JSONata syntax, referenced services, schema match

- [X] T021 [US2] Add unit test for workflow phases in test/unit/utils/templates.test.ts
  - Assert 5 phases present
  - Assert diagram template in Phase 2
  - Assert confirmation prompt exists

**Checkpoint**: User Story 2 complete - workflow has phases, diagrams, and validation

---

## Phase 5: User Story 3 - Comprehensive Technical Reference (Priority: P2)

**Goal**: Agent prompt includes complete technical reference for all artifact types

**Independent Test**: Review generated prompt, verify it contains schema definitions and at least 2 complete examples

### Implementation for User Story 3

- [ ] T022 [US3] Add choreography.yaml schema documentation to `generateTechnicalReference()` in src/utils/templates.ts
  - x-spas-choreography structure
  - Trigger types (event, http)
  - Step types (downstream, emit)

- [ ] T023 [US3] Add service metadata (spas.json) documentation to `generateTechnicalReference()` in src/utils/templates.ts
  - Required fields
  - x-service-name, x-event-name usage

- [ ] T024 [US3] Add first complete example (order→inventory) to `generateCompleteExamples()` in src/utils/templates.ts
  - Full choreography YAML
  - Matching sidecar config
  - Mermaid diagram

- [ ] T025 [US3] Add second complete example (inventory→order confirmation) to `generateCompleteExamples()` in src/utils/templates.ts
  - Full choreography YAML
  - Matching sidecar config
  - Mermaid diagram

- [ ] T026 [US3] Add unit test for technical reference completeness in test/unit/utils/templates.test.ts
  - Assert all schema sections present
  - Assert 2+ complete examples included

**Checkpoint**: User Story 3 complete - comprehensive technical reference available

---

## Phase 6: User Story 4 - Known Pitfalls and Patterns (Priority: P2)

**Goal**: Agent prompt documents common mistakes and how to avoid them

**Independent Test**: Review generated prompt, verify 6 pitfalls documented with symptom/cause/fix format

### Implementation for User Story 4

- [ ] T027 [US4] Add all 6 pitfalls from research.md to `generateKnownPitfalls()` in src/utils/templates.ts
  - Missing $append for Arrays
  - Wrong Endpoint Service ID
  - Inconsistent Field Casing
  - Missing x-service-name in Metadata
  - Circular Event Dependencies
  - Empty outputMapping

- [ ] T028 [US4] Add troubleshooting section to `generateTroubleshooting()` in src/utils/templates.ts
  - 400 on /incoming → endpoint routing
  - Transform failures → JSONata syntax
  - Event routing misses → eventType format
  - Connection refused → network/config

- [ ] T029 [US4] Add known limitations section to agent prompt in src/utils/templates.ts
  - /incoming endpoint default behavior
  - Array handling in JSONata
  - Single bounded context rule

- [ ] T030 [US4] Add unit test for pitfalls section in test/unit/utils/templates.test.ts
  - Assert 6 pitfalls present
  - Assert symptom/cause/fix format

**Checkpoint**: User Story 4 complete - pitfalls and troubleshooting documented

---

## Phase 7: User Story 5 - Domain-Relative Path Resolution (Priority: P3)

**Goal**: All agent prompt paths are relative to domain workspace

**Independent Test**: Run `spas-compose init my-domain --output ./examples/test`, verify paths use `./examples/test/my-domain/` prefix

### Implementation for User Story 5

- [ ] T031 [US5] Audit all path references in `generateAgentFile()` in src/utils/templates.ts
  - List all hardcoded paths
  - Identify paths needing domain root substitution

- [ ] T032 [US5] Update path generation to use domainRoot parameter consistently in src/utils/templates.ts
  - `${domainRoot}/services/*/spas.json`
  - `${domainRoot}/choreographies/*.choreography.yaml`
  - `${domainRoot}/stubs/*/spas.json`

- [ ] T033 [US5] Add unit test for path resolution in test/unit/utils/templates.test.ts
  - Test with various --output values
  - Assert no hardcoded paths remain

**Checkpoint**: User Story 5 complete - all paths domain-relative

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T034 Measure generated agent prompt file size (must be <25KB per SC-005)
- [ ] T035 [P] Run full CLI test suite to ensure no regressions
- [ ] T036 [P] Update README.md with agent prompt enrichment feature notes
- [ ] T037 Perform quickstart.md validation workflow
- [ ] T038 Update COMPLETION.md with feature completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phases 3-4 (US1, US2)**: Both P1 priority, can run in parallel after Phase 2
- **Phases 5-6 (US3, US4)**: Both P2 priority, can run in parallel after Phase 2
- **Phase 7 (US5)**: P3 priority, can run after Phase 2
- **Phase 8 (Polish)**: Depends on all user stories complete

### User Story Independence

| Story | Can Start After | Independent Test |
|-------|----------------|------------------|
| US1 | Phase 2 | No SPAS repo refs in prompt |
| US2 | Phase 2 | 5 phases with diagram template |
| US3 | Phase 2 | 2+ complete examples |
| US4 | Phase 2 | 6 pitfalls documented |
| US5 | Phase 2 | Paths use domainRoot |

### Parallel Opportunities

```bash
# After Phase 2 completes, launch P1 stories together:
Task T010-T016: User Story 1 (self-contained)
Task T017-T021: User Story 2 (workflow phases)

# P2 stories can start in parallel with P1:
Task T022-T026: User Story 3 (technical reference)
Task T027-T030: User Story 4 (pitfalls)

# P3 can start anytime after Phase 2:
Task T031-T033: User Story 5 (path resolution)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (extract helper functions)
3. Complete Phase 3: User Story 1 (self-contained prompt)
4. Complete Phase 4: User Story 2 (phased workflow)
5. **STOP and VALIDATE**: Test with AI agent using quickstart.md
6. If passing, MVP is ready

### Full Feature Delivery

1. MVP complete (US1 + US2)
2. Add User Story 3 (technical reference) → Validate
3. Add User Story 4 (pitfalls) → Validate
4. Add User Story 5 (path resolution) → Validate
5. Complete Phase 8: Polish
6. Create PR for review

---

## Notes

- All implementation is in single file: `src/utils/templates.ts`
- Tests in: `test/unit/utils/templates.test.ts`
- Total estimated tasks: 38
- File size constraint: <25KB (SC-005) - monitor during implementation
- Commit after each user story phase completion
