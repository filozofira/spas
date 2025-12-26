# Tasks: spas-service init Command

**Input**: Design documents from `/specs/022-spas-service-init/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests included as spec requires validation of name, workspace creation, and CLI behavior.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story reference (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Infrastructure)

**Purpose**: Add Eta dependency and create base utilities

- [X] T001 Add `eta` ^4.5.0 dependency to components/cli/spas-service/package.json
- [X] T002 [P] Create types file with InitOptions, CommandResult interfaces in components/cli/spas-service/src/types.ts
- [X] T003 [P] Create output utilities (success, error, info, listItem, verbose, json) in components/cli/spas-service/src/utils/output.ts
- [X] T004 [P] Create git utilities (findGitRoot) in components/cli/spas-service/src/utils/git.ts
- [X] T005 [P] Create config utilities (isValidServiceName, resolveWorkspacePath) in components/cli/spas-service/src/utils/config.ts
- [X] T006 Create Eta template loader (initEta, renderTemplate) in components/cli/spas-service/src/utils/templates.ts
- [X] T007 Create templates directory structure at components/cli/spas-service/templates/ with partials/ subdirectory
- [X] T008 Run `npm install` to install eta dependency

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create core services that all user stories depend on

**⚠️ CRITICAL**: User story implementation requires these utilities complete

- [X] T009 Create WorkspaceService class skeleton in components/cli/spas-service/src/services/workspace-service.ts
- [X] T010 Implement WorkspaceService.create() method with directory creation, file writing, error handling

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Initialize Service Workspace (P1) 🎯 MVP

**Goal**: Developer can run `spas-service init order-service` to create workspace with README, directories, schema, and agent files.

**Independent Test**: Run `spas-service init test-service`, verify folder structure matches spec (FR-003, FR-004).

### Tests for User Story 1

- [ ] T011 [P] [US1] Unit test for isValidServiceName in components/cli/spas-service/test/utils/config.test.ts
- [ ] T012 [P] [US1] Unit test for findGitRoot in components/cli/spas-service/test/utils/git.test.ts
- [ ] T013 [P] [US1] Unit test for WorkspaceService.create() in components/cli/spas-service/test/services/workspace-service.test.ts

### Implementation for User Story 1

- [ ] T014 [US1] Create README template in components/cli/spas-service/templates/readme.eta (FR-022, FR-023, FR-024, FR-025)
- [ ] T015 [US1] Create prompt trigger template in components/cli/spas-service/templates/prompt-trigger.eta (FR-006)
- [ ] T016 [US1] Implement init command handler in components/cli/spas-service/src/commands/init.ts
- [ ] T017 [US1] Register init command in components/cli/spas-service/src/index.ts
- [ ] T018 [US1] Copy design-time-metadata-v1.schema.json to workspace .spas/schemas/ (FR-004) - update WorkspaceService
- [ ] T019 [US1] Add --output, --force, --json, --verbose flags to init command (FR-007, FR-008, FR-010, FR-011)
- [ ] T020 [US1] Implement JSON output format in init command (FR-010, FR-012)
- [ ] T021 [US1] Unit test for init command in components/cli/spas-service/test/commands/init.test.ts

**Checkpoint**: `spas-service init <name>` creates workspace with README, directories, and schema. Agent prompt NOT yet implemented.

---

## Phase 4: User Story 2 - AI-Assisted Service Scaffolding (P1)

**Goal**: Agent prompt validates required tokens (NAME, STACK, CONTEXT) and guides service scaffolding.

**Independent Test**: Verify generated agent prompt contains token validation section and example usage.

### Implementation for User Story 2

- [ ] T022 [US2] Create agent-prompt.eta base template in components/cli/spas-service/templates/agent-prompt.eta with YAML frontmatter
- [ ] T023 [US2] Add User Input section with token parsing (NAME, STACK, CONTEXT) to agent-prompt.eta (FR-013)
- [ ] T024 [US2] Add Goal section describing service scaffolding purpose to agent-prompt.eta
- [ ] T025 [US2] Add Workspace Structure section with file layout reference to agent-prompt.eta
- [ ] T026 [US2] Add Error Handling section for token validation errors to agent-prompt.eta
- [ ] T027 [US2] Add Example Prompts section with sample invocations to agent-prompt.eta

**Checkpoint**: Agent prompt has token validation and basic structure. Workflow phases not yet implemented.

---

## Phase 5: User Story 3 - Phased Workflow with Human Confirmation (P1)

**Goal**: Agent prompt defines 9-phase workflow with confirmation gates.

**Independent Test**: Verify agent prompt contains all 9 phases with entry/exit criteria.

### Implementation for User Story 3

- [ ] T028 [US3] Create workflow-phases.eta partial in components/cli/spas-service/templates/partials/workflow-phases.eta
- [ ] T029 [US3] Implement Phase 1 (Analyze) in workflow-phases.eta (FR-014)
- [ ] T030 [US3] Implement Phase 2 (Project Structure) in workflow-phases.eta (FR-014)
- [ ] T031 [US3] Implement Phase 3 (Service Metadata) in workflow-phases.eta (FR-014, FR-018)
- [ ] T032 [US3] Implement Phase 4 (Storage Layer) in workflow-phases.eta (FR-014)
- [ ] T033 [US3] Implement Phase 5 (Endpoints & Model) in workflow-phases.eta (FR-014)
- [ ] T034 [US3] Implement Phase 6 (Events) in workflow-phases.eta (FR-014)
- [ ] T035 [US3] Implement Phase 7 (Sidecar Integration) in workflow-phases.eta (FR-014, FR-016)
- [ ] T036 [US3] Implement Phase 8 (Runtime) in workflow-phases.eta (FR-014)
- [ ] T037 [US3] Implement Phase 9 (Validate & Next Steps) in workflow-phases.eta (FR-014)
- [ ] T038 [US3] Add Confirmation Gates pattern between phases (FR-015)
- [ ] T039 [US3] Create validation-checklists.eta partial in components/cli/spas-service/templates/partials/validation-checklists.eta (FR-019)
- [ ] T040 [US3] Include workflow-phases.eta and validation-checklists.eta in agent-prompt.eta

**Checkpoint**: Agent prompt has complete 9-phase workflow with confirmation gates. SDK patterns not yet detailed.

---

## Phase 6: User Story 4 - Stack-Specific Code Generation (P2)

**Goal**: Agent prompt includes idiomatic patterns for Java (Spring) and .NET stacks.

**Independent Test**: Verify agent prompt contains Java and .NET SDK integration patterns.

### Implementation for User Story 4

- [ ] T041 [US4] Create sdk-patterns.eta partial in components/cli/spas-service/templates/partials/sdk-patterns.eta
- [ ] T042 [US4] Add Java/Spring patterns to sdk-patterns.eta (FR-017): project structure, annotations, EventPublisher
- [ ] T043 [US4] Add .NET patterns to sdk-patterns.eta (FR-017): project structure, attributes, ISpasEventPublisher
- [ ] T044 [US4] Add spas.json generation patterns for both stacks to sdk-patterns.eta
- [ ] T045 [US4] Add schema generation patterns (endpoints/, events/) to sdk-patterns.eta
- [ ] T046 [US4] Include sdk-patterns.eta in agent-prompt.eta

**Checkpoint**: Agent prompt has stack-specific patterns for Java and .NET.

---

## Phase 7: User Story 5 - Self-Contained Agent Prompt (P2)

**Goal**: Agent prompt contains all guidance with no external SPAS repo references.

**Independent Test**: Run `grep -r "principles/" agent-prompt` returns zero matches (FR-020).

### Implementation for User Story 5

- [ ] T047 [US5] Add event publishing contract to agent-prompt.eta (POST /publish, headers) (FR-016)
- [ ] T048 [US5] Add metadata schema documentation to agent-prompt.eta (commands[].produces[]) (FR-018, FR-021)
- [ ] T049 [US5] Verify all file paths use {workspaceRoot}/{NAME}/ pattern in templates
- [ ] T050 [US5] Verify no references to principles/, specs/, components/ in agent-prompt.eta (FR-020)
- [ ] T051 [US5] Verify agent prompt references .spas/schemas/design-time-metadata-v1.schema.json (FR-021)
- [ ] T052 [US5] Create error-handling.eta partial for agent error responses in components/cli/spas-service/templates/partials/error-handling.eta
- [ ] T053 [US5] Verify agent prompt file size < 35KB (SC-007)

**Checkpoint**: Agent prompt is self-contained with all SPAS guidance embedded.

---

## Phase 8: Polish & Integration

**Purpose**: Final integration and validation

- [ ] T054 [P] Add npm script to copy templates to dist/ in package.json
- [ ] T055 [P] Add templates/ to package.json files array for npm publish
- [ ] T056 Integration test: run `spas-service init order-service` end-to-end in components/cli/spas-service/test/integration/init.test.ts
- [ ] T057 Verify workspace creation < 5 seconds (SC-001)
- [ ] T058 Run quickstart.md validation manually
- [ ] T059 Update components/cli/spas-service/README.md with init command documentation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        │
Phase 2 (Foundational) ─────────────────────────────────────│
    │                                                        │
    ▼                                                        │
Phase 3 (US1: CLI) ◄──── MVP Complete ────────────────────-─┤
    │                                                        │
    ├──────────┬──────────┐                                 │
    ▼          ▼          ▼                                 │
Phase 4    Phase 5    Phase 6                               │
(US2)      (US3)      (US4)                                 │
    │          │          │                                 │
    └──────────┼──────────┘                                 │
               ▼                                            │
           Phase 7 (US5)                                    │
               │                                            │
               ▼                                            │
           Phase 8 (Polish)                                 │
```

### User Story Dependencies

- **US1 (P1)**: Foundation → CLI implementation (MVP standalone)
- **US2 (P1)**: US1 complete → Agent prompt base (depends on init command existing)
- **US3 (P1)**: US2 complete → 9-phase workflow (extends agent prompt)
- **US4 (P2)**: US3 complete → SDK patterns (extends workflow phases)
- **US5 (P2)**: US2-US4 complete → Self-contained validation (final polish)

### Parallel Opportunities per Phase

**Phase 1 (Setup)**:
```
T001 (package.json) ─────────────────────────────────────────────┐
                                                                 │
T002, T003, T004, T005 can run in parallel ─────────────────────┤
                                                                 │
T006 (template loader) depends on T001 ─────────────────────────┤
                                                                 │
T007, T008 can follow ──────────────────────────────────────────┘
```

**Phase 3 (US1)**:
```
T011, T012, T013 (tests) can run in parallel ────────────────────┐
                                                                 │
T014, T015 (templates) can run in parallel ─────────────────────┤
                                                                 │
T016 (init command) depends on T014, T015, T009, T010 ─────────-┤
                                                                 │
T017-T021 sequential within init implementation ────────────────┘
```

**Phase 5 (US3)**:
```
T028 (create partial file) ──────────────────────────────────────┐
                                                                 │
T029-T037 (phases 1-9) can run in parallel within same file ───-┤
                                                                 │
T038, T039, T040 follow phase content ──────────────────────────┘
```

---

## MVP Scope

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (US1)

After completing US1:
- Developer can run `spas-service init order-service`
- Workspace created with README, directories, schema
- Agent files generated (but agent prompt may be minimal placeholder)
- All CLI flags working (--output, --force, --json, --verbose)

US2-US5 extend the agent prompt content but don't change CLI behavior.

---

## Task Count Summary

| Phase | Task Count |
|-------|------------|
| Phase 1: Setup | 8 |
| Phase 2: Foundational | 2 |
| Phase 3: US1 | 11 |
| Phase 4: US2 | 6 |
| Phase 5: US3 | 13 |
| Phase 6: US4 | 6 |
| Phase 7: US5 | 7 |
| Phase 8: Polish | 6 |
| **Total** | **59** |
