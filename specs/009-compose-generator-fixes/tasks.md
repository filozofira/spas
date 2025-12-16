# Tasks: spas-compose CLI Generator Fixes

**Input**: Design documents from `/specs/009-compose-generator-fixes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: PoC scope - unit tests included per user story as specified in constitution. Integration validation via E-Commerce example.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:

- CLI source: `components/cli/spas-compose/src/`
- CLI tests: `components/cli/spas-compose/test/`

---

## Phase 1: Setup

**Purpose**: Type definitions and foundational changes that all stories depend on

- [x] T001 Extend ServiceMetadata interface with runtime fields in `components/cli/spas-compose/src/types.ts`
- [x] T002 [P] Add eventType field to OutboundEntry interface in `components/cli/spas-compose/src/types.ts`
- [x] T003 [P] Add GeneratorConfig interface for port configuration in `components/cli/spas-compose/src/types.ts`
- [x] T004 [P] Extend InitOptions interface with output field in `components/cli/spas-compose/src/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utility functions required by multiple user stories

**⚠️ CRITICAL**: These must complete before user story work begins

- [x] T005 Create CloudEvents type derivation utility function (boundedContext + eventName → com.x.y.z) in `components/cli/spas-compose/src/utils/event-type.ts`
- [x] T006 [P] Create unit test for CloudEvents type derivation in `components/cli/spas-compose/test/unit/event-type.test.ts`

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Generate Runnable Docker Compose (Priority: P1) 🎯 MVP

**Goal**: `spas-compose choreography build --docker` produces working docker-compose.yaml with correct image references and port configurations

**Independent Test**: Run on E-Commerce example, `docker compose up` starts all services without errors

### Unit Tests for User Story 1

- [X] T007 [P] [US1] Unit test for image reference generation (runtime metadata → image:) in `components/cli/spas-compose/test/unit/docker-generator.test.ts`
- [X] T008 [P] [US1] Unit test for port configuration (8080 internal, SIDECAR_PORT env var) in `components/cli/spas-compose/test/unit/docker-generator.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] Modify generateService() to use image: from runtime.repository:runtime.tag in `components/cli/spas-compose/src/services/docker-generator.ts`
- [X] T010 [US1] Modify generateService() to use port 8080 as internal port in `components/cli/spas-compose/src/services/docker-generator.ts`
- [X] T011 [US1] Modify generateService() to add SERVICE_NAME and SIDECAR_PORT=7001 env vars in `components/cli/spas-compose/src/services/docker-generator.ts`
- [X] T012 [US1] Modify generateSidecar() to use image: spas/sidecar:latest in `components/cli/spas-compose/src/services/docker-generator.ts`
- [X] T013 [US1] Modify generateSidecar() to use SIDECAR_PORT env var (not PORT) in `components/cli/spas-compose/src/services/docker-generator.ts`
- [X] T014 [US1] Modify generateSidecar() to use fixed port 7001 for all sidecars in `components/cli/spas-compose/src/services/docker-generator.ts`
- [X] T015 [US1] Add warning log when service has no runtime metadata in `components/cli/spas-compose/src/services/docker-generator.ts`

**Checkpoint**: Docker Compose generation produces runnable output with correct images and ports

---

## Phase 4: User Story 2 - Sidecar Event Routing Works Out of Box (Priority: P1)

**Goal**: Generated sidecar configs have correct eventType, invokeEndpoint, and transform paths

**Independent Test**: Events route correctly between services without manual config edits

### Unit Tests for User Story 2

- [X] T016 [P] [US2] Unit test for eventType generation (full CloudEvents type) in `components/cli/spas-compose/test/unit/sidecar-config-generator.test.ts`
- [X] T017 [P] [US2] Unit test for transform path resolution (includes service folder) in `components/cli/spas-compose/test/unit/sidecar-config-generator.test.ts`

### Implementation for User Story 2

- [X] T018 [US2] Modify buildOutboundEntries() to include eventType field in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [X] T019 [US2] Modify buildOutboundEntries() to derive eventType using CloudEvents utility from T005 in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [X] T020 [US2] Add loadServiceMetadata() helper to read spas.json for boundedContext in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [X] T021 [US2] Fix resolveTransformPath() to keep full path with service folder in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [X] T022 [US2] Verify invokeEndpoint defaults to /incoming in buildInboundEntries() in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`

**Checkpoint**: Sidecar configs have correct eventType format and transform paths ✓ (kebab-case aligned with SDK)

---

## Phase 5: User Story 3 - Initialize Domain with Custom Output Path (Priority: P2)

**Goal**: `spas-compose init --output` creates domain files in specified location with correct agent prompt paths

**Independent Test**: `spas-compose init public --output ./custom/path` creates files in correct locations

### Unit Tests for User Story 3

- [X] T023 [P] [US3] Unit test for --output argument parsing in `components/cli/spas-compose/test/unit/init.test.ts`
- [X] T024 [P] [US3] Unit test for agent prompt path generation with output directory in `components/cli/spas-compose/test/unit/workspace-service.test.ts`

### Implementation for User Story 3

- [X] T025 [US3] Add --output option to init command in `components/cli/spas-compose/src/commands/init.ts`
- [X] T026 [US3] Modify executeInit() to resolve workspace path from --output argument in `components/cli/spas-compose/src/commands/init.ts`
- [X] T027 [US3] Modify WorkspaceService.create() to accept output path and project root separately in `components/cli/spas-compose/src/services/workspace-service.ts`
- [X] T028 [US3] Add git root detection for agent prompt placement in `components/cli/spas-compose/src/utils/git.ts`
- [X] T029 [US3] Modify generateAgentFile() to use relative paths from project root to domain in `components/cli/spas-compose/src/utils/templates.ts`
- [X] T030 [US3] Remove SPAS principles references from agent template in `components/cli/spas-compose/src/utils/templates.ts`
- [X] T031 [US3] Rename agent file to spas.compose.agent.md (dot separator) in `components/cli/spas-compose/src/services/workspace-service.ts`

**Checkpoint**: Init command with --output creates files in correct locations with valid path references ✓

---

## Phase 6: Polish & Validation

**Purpose**: Integration validation and documentation

- [ ] T032 Run E-Commerce example validation per quickstart.md
- [ ] T033 [P] Update CLI help text for new --output option in `components/cli/spas-compose/src/commands/init.ts`
- [ ] T034 [P] Update components/cli/spas-compose/README.md with new command options

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - type changes first
- **Phase 2 (Foundational)**: Depends on Phase 1 - utility function for all stories
- **Phase 3 (US1)**: Depends on Phase 2 - docker generator fixes
- **Phase 4 (US2)**: Depends on Phase 2 - sidecar config fixes (can parallel with US1)
- **Phase 5 (US3)**: Depends on Phase 1 - init command extension (can parallel with US1, US2)
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Docker Compose)**: Foundational → US1 implementation
- **US2 (Sidecar Config)**: Foundational → US2 implementation (independent of US1)
- **US3 (Init --output)**: Setup only → US3 implementation (independent of US1, US2)

### Parallel Opportunities

Within Phase 1:

```
T001, T002, T003, T004 can run in parallel (different sections of types.ts or can be combined)
```

Within Phase 2:

```
T005 → T006 (utility first, then test)
```

After Phase 2 (User Stories can run in parallel):

```
US1 (T007-T015) || US2 (T016-T022) || US3 (T023-T031)
```

Within each User Story:

```
Tests (T007, T008) can run in parallel
Implementation tasks sequential (same file)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (CloudEvents utility)
3. Complete Phase 3: User Story 1 (docker-compose generation)
4. Complete Phase 4: User Story 2 (sidecar config generation)
5. **VALIDATE**: Run E-Commerce example end-to-end
6. Deploy/demo working choreography generation

### Incremental Delivery

1. Setup + Foundational → Type definitions ready
2. US1 complete → Docker Compose generates correctly
3. US2 complete → Full choreography works end-to-end (MVP!)
4. US3 complete → Enhanced init command for monorepo support

---

## Notes

- All docker-generator.ts changes are in generateService() and generateSidecar() methods
- All sidecar-config-generator.ts changes are in buildOutboundEntries() and resolveTransformPath() methods
- E-Commerce example at examples/domains/ecommerce/public/ serves as integration test
- Reference implementation (manually fixed) shows expected output format
