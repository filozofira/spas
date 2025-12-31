# Tasks: Java SDK Optional Path Attribute

**Input**: Design documents from `/specs/027-java-optional-path/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Annotation attribute changes that enable all other work

- [X] T001 [P] Add `default ""` to `path()` in `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasCommand.java`
- [X] T002 [P] Add `default ""` to `path()` in `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasQuery.java`
- [X] T003 [P] Update Javadoc on `path()` to explain optional behavior and inference in both annotation files

**Checkpoint**: Annotations now accept omitted `path` attribute - foundation for all user stories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational/blocking tasks for this feature

All annotation changes are in Phase 1 Setup. User stories can proceed independently after Setup.

**⚠️ NOTE**: Phase 1 must complete before any user story work begins.

---

## Phase 3: User Story 1 - Optional Path in Runtime Metadata Generation (Priority: P1) 🎯 MVP

**Goal**: Java developers can omit `path` from `@SpasCommand`/`@SpasQuery` when using Spring annotations; runtime generator infers paths correctly.

**Independent Test**: Create controller with `@SpasCommand` without `path`, run `--generate-metadata`, verify correct path in output.

### Implementation for User Story 1

- [X] T004 [US1] Add warning log in `SpasMetadataArchiveGenerator` when path cannot be inferred in `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataArchiveGenerator.java`
- [X] T005 [US1] Add unit test for empty path handling with Spring annotation inference in `components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasMetadataArchiveGeneratorTest.java`
- [X] T006 [US1] Add unit test for warning when path cannot be inferred (no Spring annotation, no explicit path) in same test file
- [X] T007 [US1] Verify backward compatibility - explicit `path` still takes precedence (add test case if not exists)

**Checkpoint**: Runtime metadata generation works with optional path - MVP complete

---

## Phase 4: User Story 2 - Disable Compile-Time Generation in Example Services (Priority: P2)

**Goal**: Example services should NOT have compile-time generation enabled; verify they use runtime generation only.

**Independent Test**: Run `mvn package` on example services, verify no `spas.json` generated at compile time.

### Implementation for User Story 2

- [ ] T008 [US2] Verify `examples/services/basket-service/pom.xml` does NOT contain `-Aspas.generateSpasJson=true` (should already be correct per research.md)
- [ ] T009 [US2] Verify `examples/services/fulfillment-service/pom.xml` does NOT contain `-Aspas.generateSpasJson=true`
- [ ] T010 [US2] Document verification in checklist that FR-012 is satisfied (no code changes needed)

**Checkpoint**: Example services confirmed to use runtime-only metadata generation

---

## Phase 5: User Story 3 - Compile-Time Processor Validation (Priority: P3)

**Goal**: Compile-time processor emits clear error when `path` is empty AND generation is enabled.

**Independent Test**: Compile test class with `@SpasCommand` without `path`, with `-Aspas.generateSpasJson=true`, verify compile error.

### Implementation for User Story 3

- [ ] T011 [US3] Add validation logic in `SpasAnnotationProcessor.process()` to check for empty path when `generateSpasJson=true` in `components/sdk/java/spas-sdk-metadata-processor/src/main/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessor.java`
- [ ] T012 [US3] Emit compile error with message: "SpasCommand 'X' requires explicit 'path' attribute when compile-time generation is enabled"
- [ ] T013 [US3] Add compile-testing test for error case (empty path + generation enabled) in `components/sdk/java/spas-sdk-metadata-processor/src/test/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessorTest.java`
- [ ] T014 [US3] Add compile-testing test for success case (explicit path + generation enabled)
- [ ] T015 [US3] Add compile-testing test for no-error case (empty path + generation disabled)

**Checkpoint**: Compile-time processor provides clear feedback when path is required

---

## Phase 6: User Story 4 - Update Example Services (Priority: P2)

**Goal**: Remove redundant `path` attributes from example services to demonstrate best practices.

**Independent Test**: Run `Get-ServiceMetadata.ps1`, verify all Java services generate correct metadata with inferred paths.

### Implementation for User Story 4

- [ ] T016 [P] [US4] Remove redundant `path` from `@SpasCommand` annotations in `examples/services/basket-service/src/main/java/io/spas/example/basket/controller/BasketController.java`
- [ ] T017 [P] [US4] Remove redundant `path` from `@SpasCommand` annotations in `examples/services/fulfillment-service/src/main/java/io/spas/example/fulfillment/controller/FulfillmentController.java`
- [ ] T018 [P] [US4] Remove redundant `path` from `@SpasCommand` annotations in `examples/services/fulfillment-service/src/main/java/io/spas/example/fulfillment/controller/ShipmentController.java`
- [ ] T019 [US4] Run `scripts/Get-ServiceMetadata.ps1` and verify basket-service generates identical metadata
- [ ] T020 [US4] Run `scripts/Get-ServiceMetadata.ps1` and verify fulfillment-service generates identical metadata
- [ ] T021 [US4] Update agent prompt template to remove `path` from Java examples in `components/cli/spas-service/templates/agent-prompt.eta`
- [ ] T022 [US4] Add note to agent prompt about path inference from Spring annotations

**Checkpoint**: Example services and agent prompts demonstrate best practices

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T023 Build all Java SDK modules with `mvn clean package` in `components/sdk/java/`
- [ ] T024 Run all Java SDK tests with `mvn test` in `components/sdk/java/`
- [ ] T025 [P] Run quickstart.md validation - verify examples work as documented
- [ ] T026 [P] Update `specs/027-java-optional-path/checklists/requirements.md` with implementation status
- [ ] T027 Run `scripts/validate-metadata-archives.ps1` to verify all metadata is valid

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A for this feature
- **User Stories (Phase 3-6)**: All depend on Phase 1 completion
  - US1, US2, US4 can proceed in parallel after Phase 1
  - US3 can proceed in parallel after Phase 1
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 1 - Independent verification task
- **User Story 3 (P3)**: Can start after Phase 1 - Independent processor work
- **User Story 4 (P2)**: Can start after Phase 1, but benefits from US1 testing first

### Within Each User Story

- Implementation tasks before verification tasks
- Core changes before test additions
- Individual file changes marked [P] can run in parallel

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files)
- T016, T017, T018 can run in parallel (different service controllers)
- US1, US2, US3 can run in parallel (different components)
- T025, T026 can run in parallel (documentation tasks)

---

## Parallel Example: Phase 1 Setup

```bash
# All setup tasks can run in parallel:
Task T001: Add default "" to path() in SpasCommand.java
Task T002: Add default "" to path() in SpasQuery.java
Task T003: Update Javadoc in both annotation files
```

## Parallel Example: User Story 4

```bash
# All controller updates can run in parallel:
Task T016: Remove path from BasketController.java
Task T017: Remove path from FulfillmentController.java
Task T018: Remove path from ShipmentController.java
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 3: User Story 1 (T004-T007)
3. **STOP and VALIDATE**: Test runtime generation with optional path
4. Deploy/demo if ready - developers can now omit `path`

### Incremental Delivery

1. Complete Setup → Annotations accept optional path
2. Add User Story 1 → Test runtime generation → MVP ready!
3. Add User Story 2 → Verify example service configuration
4. Add User Story 4 → Clean up examples and agent prompts
5. Add User Story 3 → Add compile-time validation (nice-to-have)
6. Polish → Full validation and documentation

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 together (quick - 3 tasks)
2. Once Phase 1 is done:
   - Developer A: User Story 1 (runtime generator)
   - Developer B: User Story 3 (compile-time processor)
   - Developer C: User Story 4 (example services + prompts)
3. User Story 2 is verification-only (can be done by anyone)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- FR-012 (example services compile-time flag) is already satisfied - just verification needed
- Most changes are in Java SDK; agent prompt is TypeScript/ETA template
- Run `mvn test` frequently during implementation to catch regressions
