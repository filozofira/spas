# Tasks: spas-compose CLI

**Input**: Design documents from `/specs/005-spas-compose-cli/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Unit tests included per user story (PoC policy). Integration tests may be added based on workflow complexity.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure

- [X] T001 Create project structure at components/cli/spas-compose/ per plan.md
- [X] T002 Initialize package.json with dependencies: commander@11, js-yaml@4, jsonata@2, axios@1, chalk@4
- [X] T003 [P] Configure tsconfig.json matching spas-service CLI patterns
- [X] T004 [P] Configure jest.config.cjs for TypeScript testing
- [X] T005 [P] Create README.md with installation and usage instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create CLI entry point in src/index.ts with Commander.js setup
- [ ] T007 [P] Create TypeScript interfaces in src/types.ts for DomainWorkspace, Choreography, PulledService
- [ ] T008 [P] Create output utilities in src/utils/output.ts (success, error, info, verbose using chalk)
- [ ] T009 [P] Create config utilities in src/utils/config.ts (resolveRepositoryUrl, resolveWorkspacePath)
- [ ] T010 [P] Create template utilities in src/utils/templates.ts (README.md content, choreography.yaml scaffold, agent prompt)
- [ ] T011 Create RepositoryClient in src/services/repository-client.ts (HTTP client for SPAS Repository)
  > **Note**: Copy pattern from spas-service CLI's repository-client.ts. Add `// TODO: Extract to @spas/cli-common post-PoC` comment.

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Initialize Domain Workspace (Priority: P1) 🎯 MVP

**Goal**: Developer can create a structured domain workspace with single command

**Independent Test**: Run `spas-compose init test-domain` and verify folder structure created with README.md, choreography.yaml, services/, choreography/transformations/

**FR Mapping**: FR-001, FR-006, FR-012

### Unit Tests for User Story 1

- [ ] T012 [P] [US1] Unit test for WorkspaceService.create() in test/unit/services/workspace-service.test.ts
- [ ] T013 [P] [US1] Unit test for init command argument validation in test/unit/commands/init.test.ts

### Implementation for User Story 1

- [ ] T014 [US1] Create WorkspaceService in src/services/workspace-service.ts with create(), exists(), validate() methods
- [ ] T015 [US1] Create init command handler in src/commands/init.ts with --force flag support
- [ ] T016 [US1] Implement agent prompt creation/update in .github/agents/spas-compose.md per contracts/agent-prompt.md
- [ ] T017 [US1] Wire init command to CLI entry point in src/index.ts
- [ ] T018 [US1] Add JSON output format support for init command (--json flag)

**Checkpoint**: `spas-compose init my-domain` works end-to-end

---

## Phase 4: User Story 2 — Pull Service Metadata (Priority: P1) 🎯 MVP

**Goal**: Developer can download service contracts from Repository for AI analysis

**Independent Test**: Run `spas-compose services pull order-service 1.0.0` against running Repository and verify services/order-service/spas.json + schemas/ created

**FR Mapping**: FR-002, FR-005, FR-012

### Unit Tests for User Story 2

- [ ] T019 [P] [US2] Unit test for PullService.pull() in test/unit/services/pull-service.test.ts
- [ ] T020 [P] [US2] Unit test for services-pull command argument/option validation in test/unit/commands/services-pull.test.ts

### Implementation for User Story 2

- [ ] T021 [US2] Create PullService in src/services/pull-service.ts with pull(), extractSchemas() methods
- [ ] T022 [US2] Create services-pull command handler in src/commands/services-pull.ts
- [ ] T023 [US2] Implement workspace detection (must be in valid domain workspace)
- [ ] T024 [US2] Implement repository URL resolution (--repo, SPAS_REPOSITORY_URL, default)
- [ ] T025 [US2] Wire services pull command to CLI entry point in src/index.ts
- [ ] T026 [US2] Add JSON output format support and actionable error messages

**Checkpoint**: `spas-compose services pull order-service 1.0.0` works end-to-end

---

## Phase 5: User Story 3 — Deploy Choreography to Docker Compose (Priority: P2)

**Goal**: Developer can generate Docker Compose deployment from choreography configuration

**Independent Test**: Run `spas-compose choreography deploy --docker` with valid choreography.yaml and verify docker-compose.yaml generated with services, sidecars, Redis, Zipkin

**FR Mapping**: FR-003, FR-004, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012

### Unit Tests for User Story 3

- [ ] T027 [P] [US3] Unit test for ChoreographyLoader.load() in test/unit/services/choreography-loader.test.ts
- [ ] T028 [P] [US3] Unit test for JsonataValidator.validate() in test/unit/services/jsonata-validator.test.ts
- [ ] T029 [P] [US3] Unit test for DockerGenerator.generate() in test/unit/services/docker-generator.test.ts
- [ ] T030 [P] [US3] Unit test for choreography-deploy command validation in test/unit/commands/choreography-deploy.test.ts

### Implementation for User Story 3

- [ ] T031 [US3] Create ChoreographyLoader in src/services/choreography-loader.ts with load(), validate() per choreography-schema.yaml
- [ ] T032 [US3] Create JsonataValidator in src/services/jsonata-validator.ts with validateFile(), validateSyntax()
- [ ] T033 [US3] Create DockerGenerator in src/services/docker-generator.ts with generate(), generateService(), generateSidecar(), generateInfrastructure()
- [ ] T034 [US3] Create choreography-deploy command handler in src/commands/choreography-deploy.ts
- [ ] T035 [US3] Implement --dry-run flag for validation-only mode
- [ ] T036 [US3] Implement service validation (check pulled services exist)
- [ ] T037 [US3] Implement transformation file validation (check .jsonata files exist and valid syntax)
- [ ] T038 [US3] Generate docker-compose.yaml with sidecar volume mounts for transformation folders
- [ ] T039 [US3] Wire choreography deploy command to CLI entry point in src/index.ts
- [ ] T040 [US3] Add JSON output format support and actionable error messages

**Checkpoint**: `spas-compose choreography deploy --docker` works end-to-end

---

## Phase 6: User Story 4 — AI-Assisted Choreography Composition (Priority: P2)

**Goal**: AI agent can analyze pulled services and generate choreography with transformations

**Independent Test**: Run `/spas.compose Analyze order-service and fulfillment-service` and verify agent proposes valid choreography.yaml updates

**FR Mapping**: FR-006 (agent prompt), contracts/agent-prompt.md

### Implementation for User Story 4

- [ ] T041 [US4] Create agent prompt file .github/agents/spas-compose.md per contracts/agent-prompt.md
- [ ] T042 [US4] Include workspace awareness instructions (services/, choreography.yaml paths)
- [ ] T043 [US4] Include contract analysis instructions (spas.json parsing, event matching)
- [ ] T044 [US4] Include choreography generation instructions (schema compliance, named flows)
- [ ] T045 [US4] Include transformation generation instructions (JSONata syntax, naming conventions)
- [ ] T046 [US4] Include iterative confirmation workflow (confirm/feedback loop)
- [ ] T047 [US4] Add example prompts section matching contracts/agent-prompt.md Expected Prompts

**Checkpoint**: `/spas.compose` agent prompt is discoverable and functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements across all user stories

- [ ] T048 [P] Update components/cli/spas-compose/README.md with full command reference
- [ ] T049 [P] Verify quickstart.md workflow end-to-end (init → pull → compose → deploy)
- [ ] T050 Add --verbose flag support across all commands
- [ ] T051 Ensure all error messages include actionable remediation hints
- [ ] T052 Run lint and format checks, fix any issues
- [ ] T053 Build CLI and test npm link installation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────┐
                                                       ▼
Phase 2 (Foundational) ───────────────────────────────┼──► BLOCKS all User Stories
                                                       │
         ┌─────────────────────────────────────────────┘
         ▼
┌────────────────────┐  ┌────────────────────┐
│ Phase 3: US1 (P1)  │  │ Phase 4: US2 (P1)  │  ◄── Can run in parallel
│ Init Workspace     │  │ Pull Services      │
└────────────────────┘  └────────────────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
         ┌────────────────────────┐
         │ Phase 5: US3 (P2)      │  ◄── Depends on US1 + US2
         │ Deploy Choreography    │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Phase 6: US4 (P2)      │  ◄── Agent prompt (can parallel with US3)
         │ AI Composition         │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Phase 7: Polish        │
         └────────────────────────┘
```

### User Story Independence

| Story | Can Start After | Dependencies | Independently Testable |
|-------|-----------------|--------------|------------------------|
| US1 (Init) | Phase 2 | None | ✅ `spas-compose init` works standalone |
| US2 (Pull) | Phase 2 | None | ✅ `spas-compose services pull` works with US1 |
| US3 (Deploy) | US1 + US2 | Needs workspace + services | ✅ Works with valid choreography.yaml |
| US4 (AI) | US1 + US2 | Needs workspace + services | ✅ Agent prompt works independently |

### Parallel Opportunities per Phase

**Phase 1 (Setup)**:
```
T001 (project) → T002 (deps)
                     ↓
              T003, T004, T005 [P]
```

**Phase 2 (Foundational)**:
```
T006 (entry) ──────────────────────────────────────────┐
T007, T008, T009, T010 [P] ────────────────────────────┤
T011 (repo client) ────────────────────────────────────┘
```

**Phase 3 (US1) — After Phase 2**:
```
T012, T013 [P] (tests)
       ↓
T014 → T015 → T016 → T017 → T018
```

**Phase 4 (US2) — After Phase 2, parallel with US1**:
```
T019, T020 [P] (tests)
       ↓
T021 → T022 → T023 → T024 → T025 → T026
```

---

## Implementation Strategy

### MVP Scope (Recommended)

For fastest time-to-value, implement in this order:

1. **Phase 1 + 2**: Setup + Foundational (~2 hours)
2. **Phase 3 (US1)**: Init command (~1 hour) — First testable CLI
3. **Phase 4 (US2)**: Pull command (~2 hours) — Can fetch real services
4. **Phase 6 (US4)**: Agent prompt (~1 hour) — Enables AI composition

At this point, developer can:
- Initialize workspace ✓
- Pull services ✓
- Use AI to compose choreography ✓
- Manually create docker-compose.yaml

5. **Phase 5 (US3)**: Deploy command (~3 hours) — Automates docker-compose generation
6. **Phase 7**: Polish (~1 hour)

**Total estimated effort**: ~10 hours

### Validation Checkpoints

| Checkpoint | Validation |
|------------|------------|
| After T017 | `spas-compose init test-domain` creates folder structure |
| After T025 | `spas-compose services pull` downloads from Repository |
| After T039 | `spas-compose choreography deploy --docker` generates docker-compose.yaml |
| After T047 | `/spas.compose` recognized by GitHub Copilot |
| After T053 | `npm link` installs CLI globally |

---

## Task Summary

| Phase | Tasks | Parallel | Description |
|-------|-------|----------|-------------|
| 1. Setup | T001-T005 | 3 | Project structure and config |
| 2. Foundational | T006-T011 | 4 | Core utilities and entry point |
| 3. US1 (P1) | T012-T018 | 2 | Init workspace command |
| 4. US2 (P1) | T019-T026 | 2 | Pull services command |
| 5. US3 (P2) | T027-T040 | 4 | Deploy choreography command |
| 6. US4 (P2) | T041-T047 | 0 | AI agent prompt |
| 7. Polish | T048-T053 | 2 | Quality and documentation |
| **Total** | **53 tasks** | **17 parallel** | |
