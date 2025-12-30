---
description: "Task list for Java Capability Annotations Guidance feature"
---

# Tasks: Java Capability Annotations Guidance

**Input**: Design documents from `specs/025-java-capability-annotations/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested in feature specification; focus on validation via manual testing and success criteria verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Multi-component project**: `components/cli/`, `components/sdk/java/`
- CLI templates: `components/cli/spas-service/templates/partials/`
- Java SDK: `components/sdk/java/spas-sdk-*/src/main/java/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation setup

- [X] T001 Verify feature branch `025-java-capability-annotations` is checked out
- [X] T002 Verify Java 17+ SDK and Maven 3.9+ are installed
- [X] T003 Verify Node.js 20 LTS and npm are installed for CLI work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required - each user story is independently implementable

**⚠️ SKIP**: This feature has no blocking foundational tasks. Proceed directly to user stories.

---

## Phase 3: User Story 1 - Generate Java agent with correct guidance (Priority: P1) 🎯 MVP

**Goal**: Update CLI templates to instruct capability declaration via annotations, removing all `addCapability()` references from generated Java agent code and guidance.

**Independent Test**: Run `spas-service init` targeting Java; verify generated files contain zero occurrences of `options.addCapability()` and include annotation-based guidance.

### Implementation for User Story 1

- [X] T004 [P] [US1] Navigate to `components/cli/spas-service/` and run `npm install` to prepare CLI workspace
- [X] T005 [US1] Update `components/cli/spas-service/templates/partials/sdk-patterns.eta` to remove `options.addCapability("{primary-capability}")` from Java `Application.main()` example (lines ~180-200)
- [X] T006 [US1] Add inline comment to `components/cli/spas-service/templates/partials/sdk-patterns.eta` explaining capability auto-discovery from annotations
- [X] T007 [US1] Update Java guidance in `components/cli/spas-service/templates/partials/workflow-phases.eta` Phase 3 section (line ~281) to remove `options.addCapability()` example
- [X] T008 [US1] Update Phase 3 exit criteria in `components/cli/spas-service/templates/partials/workflow-phases.eta` (line ~304) to reference annotation-based capability declaration
- [X] T009 [US1] Validate template changes: Run `Select-String -Path "components/cli/spas-service/templates/partials/*.eta" -Pattern "addCapability"` to verify no Java-specific matches remain
- [X] T010 [US1] Build CLI: Run `npm run build` in `components/cli/spas-service/`
- [X] T011 [US1] Test CLI templates: Run `npm test` in `components/cli/spas-service/` to verify template compilation

**Checkpoint**: User Story 1 complete - CLI templates no longer generate deprecated patterns for Java agents

**Acceptance Verification**:
- ✅ SC-001: Generating a Java agent results in zero occurrences of `options.addCapability()`
- ✅ Generated files include inline comment: "Capabilities are auto-discovered from @SpasCommand, @SpasQuery, and @SpasEvent annotations"

---

## Phase 4: User Story 2 - Java SDK aligns with annotation-only approach (Priority: P2)

**Goal**: Deprecate `addCapability()` methods in Java SDK with clear warnings pointing to annotation-based approach.

**Independent Test**: Build Java SDK with Maven; verify deprecation warnings appear for `SpasServiceOptions.addCapability()` and `ServiceIdentityBuilder.addCapability()`.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Navigate to `components/sdk/java/` and run `mvn clean install -DskipTests` to prepare Java SDK workspace
- [ ] T013 [P] [US2] Add `@Deprecated(since="1.1.0", forRemoval=true)` annotation to `addCapability()` method in `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasServiceOptions.java` (line ~77)
- [ ] T014 [P] [US2] Add Javadoc to `addCapability()` in `SpasServiceOptions.java` explaining deprecation, referencing `@SpasCommand/@SpasQuery/@SpasEvent`, and documenting removal in v2.0.0
- [ ] T015 [P] [US2] Add `@Deprecated(since="1.1.0", forRemoval=true)` annotation to `addCapability()` method in `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilder.java` (line ~49)
- [ ] T016 [P] [US2] Add Javadoc to `addCapability()` in `ServiceIdentityBuilder.java` explaining deprecation, referencing annotations, and documenting removal in v2.0.0
- [ ] T017 [US2] Build Java SDK: Run `mvn clean install` in `components/sdk/java/` to verify deprecation warnings appear
- [ ] T018 [US2] Verify deprecation: Run `Select-String -Path "components/sdk/java/spas-sdk-*/src/main/java/**/*.java" -Pattern "@Deprecated.*forRemoval.*true"` to confirm both methods are deprecated

**Checkpoint**: User Story 2 complete - SDK methods deprecated with clear migration guidance

**Acceptance Verification**:
- ✅ SC-002: 100% of Java SDK samples and docs will show annotation-based capability declaration (see US3)
- ✅ Deprecation warnings appear during Maven build

---

## Phase 5: User Story 3 - Update existing services to annotations (Priority: P3)

**Goal**: Add "Capability Declaration" sections to Java SDK README files demonstrating annotation-based approach exclusively, enabling quick migration without a formal guide.

**Independent Test**: Review Java SDK README files; verify "Capability Declaration" section exists with annotation examples and no `addCapability()` references.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Add "Capability Declaration" section to `components/sdk/java/README.md` with annotation examples showing `@SpasService(capabilities = {...})` with link to example services
- [ ] T020 [P] [US3] Add "Capability Declaration" section to `components/sdk/java/spas-sdk-metadata/README.md` explaining `capabilities` attribute in `@SpasService` with link to example services
- [ ] T021 [P] [US3] Add "Capability Declaration" section to `components/sdk/java/spas-sdk-spring/README.md` with migration note: use `capabilities` attribute instead of `addCapability()` method
- [ ] T022 [P] [US3] Add `capabilities` attribute to `@SpasService` annotation in `examples/services/basket-service/src/main/java/io/spas/examples/basket/BasketServiceApplication.java` (e.g., `capabilities = {"basket-management"}`)
- [ ] T023 [P] [US3] Add `capabilities` attribute to `@SpasService` annotation in `examples/services/fulfillment-service/src/main/java/io/spas/examples/fulfillment/FulfillmentServiceApplication.java` (e.g., `capabilities = {"fulfillment-operations"}`)
- [ ] T026 [P] [US3] Verify no `addCapability()` in example services: Run `Get-ChildItem "examples/services" -Recurse -Filter "*.java" | Select-String "addCapability"` to confirm zero matches
- [ ] T027 [US3] Validate SDK documentation: Run `Select-String -Path "components/sdk/java/**/README.md" -Pattern "addCapability"` to verify deprecated method is NOT shown in new examples (only in migration notes)
- [ ] T028 [US3] Cross-reference validation: Verify SDK READMEs link to example services (basket-service, fulfillment-service) as annotation-based reference implementations

**Checkpoint**: User Story 3 complete - Documentation and example services demonstrate `capabilities` attribute; migration path clear

**Acceptance Verification**:
- ✅ SC-003: A developer can update an example service from `addCapability()` to annotations within 10 minutes using SDK docs
- ✅ SC-002: 100% of Java SDK samples and docs show annotation-based capability declaration

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and verification across all changes

- [ ] T029 [P] Verify no non-Java templates were affected: Spot-check .NET/C# sections in `components/cli/spas-service/templates/partials/sdk-patterns.eta` for unchanged `AddCapability()` examples
- [ ] T030 Run full CLI build and test suite: Execute `npm run build && npm test` in `components/cli/spas-service/`
- [ ] T031 Run full Java SDK build and test suite: Execute `mvn clean install` in `components/sdk/java/`
- [ ] T032 Build example services: Execute `mvn clean install` in `examples/services/basket-service` and `examples/services/fulfillment-service` to verify `capabilities` attribute compiles
- [ ] T033 [P] Validate success criterion SC-001: Generate a test Java agent via CLI and grep for `addCapability` (should be zero matches)
- [ ] T034 [P] Validate success criterion SC-004: Review at least one non-Java scaffold (e.g., .NET) to confirm no changes
- [ ] T035 Review quickstart.md validation steps: Execute steps 4, 10, 14, 20 from `specs/025-java-capability-annotations/quickstart.md`
- [ ] T036 Commit all changes with message: "feat(java): deprecate addCapability() and update CLI guidance for annotation-based capability declaration (025)"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Skipped - no blocking prerequisites for this feature
- **User Stories (Phase 3-5)**: All can proceed in parallel after Setup
  - US1 (CLI templates): Independent, no dependencies
  - US2 (SDK deprecation): Independent, no dependencies
  - US3 (Documentation): Conceptually depends on US2 (documenting deprecated methods), but can be drafted in parallel
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Setup (Phase 1) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Setup (Phase 1) - Weak dependency on US2 (documenting deprecated methods), but READMEs can be drafted in parallel

### Within Each User Story

- **US1**: T005-T008 can run in parallel (different template sections), then T009-T011 sequentially (validation → build → test)
- **US2**: T013-T016 can run in parallel (different SDK classes), then T017-T018 sequentially (build → verify)
- **US3**: T019-T021 can run in parallel (different README files), then T022-T023 sequentially (validation)

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- All US1 template updates (T005-T008) can run in parallel
- All US2 deprecation annotations (T013-T016) can run in parallel
- All US3 SDK README updates (T019-T021) can run in parallel
- All US3 example service updates (T022-T025) can run in parallel
- US3 verification tasks (T026-T028) can run in parallel after implementation
- All user stories (US1, US2, US3) can be worked on in parallel by different team members
- All Phase 6 validation tasks (T029, T033, T034) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Developer A: Update sdk-patterns.eta
code components/cli/spas-service/templates/partials/sdk-patterns.eta
# (Make changes T005-T006)

# Developer B (in parallel): Update workflow-phases.eta
code components/cli/spas-service/templates/partials/workflow-phases.eta
# (Make changes T007-T008)

# After both complete:
# Run T009 (validation), T010 (build), T011 (test) sequentially
```

---

## Parallel Example: User Story 2

```bash
# Developer A: Deprecate SpasServiceOptions
code components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasServiceOptions.java
# (Make changes T013-T014)

# Developer B (in parallel): Deprecate ServiceIdentityBuilder
code components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilder.java
# (Make changes T015-T016)

# After both complete:
# Run T017 (build), T018 (verify) sequentially
```

---

## Parallel Example: User Story 3

```bash
# Developer A: Update root Java SDK README
code components/sdk/java/README.md
# (Make changes T019)

# Developer B (in parallel): Update spas-sdk-metadata README
code components/sdk/java/spas-sdk-metadata/README.md
# (Make changes T020)

# Developer C (in parallel): Update spas-sdk-spring README
code components/sdk/java/spas-sdk-spring/README.md
# (Make changes T021)

# After all complete:
# Run T022-T023 (validation) sequentially
```

---

## Parallel Example: All User Stories

```bash
# Team with 3+ developers can work all stories in parallel:

# Developer 1: User Story 1 (CLI templates)
cd components/cli/spas-service
# Execute T004-T011

# Developer 2: User Story 2 (SDK deprecation)
cd components/sdk/java
# Execute T012-T018

# Developer 3: User Story 3 (Documentation)
cd components/sdk/java
# Execute T019-T023

# After all stories complete:
# Execute Phase 6 (T024-T030) for final validation
```

---

## Implementation Strategy

### MVP First (Recommended)

Implement **User Story 1 (P1)** ONLY as MVP:
- Delivers immediate value: New Java agents generated with correct guidance
- No deprecated patterns in fresh scaffolds
- Prevents new services from using outdated approach
- Estimated effort: 2-3 hours (8 tasks)

After MVP validation:
- Add **User Story 2 (P2)**: SDK deprecation warnings (7 tasks)
- Add **User Story 3 (P3)**: Documentation for existing services (5 tasks)
- Finalize with **Phase 6**: Polish and validation (7 tasks)

### Incremental Delivery

Each user story represents an independently deployable increment:

1. **Increment 1 (US1)**: CLI generates correct guidance → Merge
2. **Increment 2 (US2)**: SDK methods deprecated → Merge
3. **Increment 3 (US3)**: Documentation updated → Merge
4. **Polish (Phase 6)**: Final validation → Release v1.1.0

This approach enables early feedback and reduces risk.

---

## Estimation Summary

| Phase | Task Count | Parallel Tasks | Estimated Effort |
|-------|------------|----------------|------------------|
| Phase 1: Setup | 3 | 3 | 15 min |
| Phase 3: US1 (CLI) + Examples) | 10 | 8 | 2-3 hours |
| Phase 6: Polish | 8 | 3 | 1 hour |
| **Total** | **36** | **22** | **7-10 hours** |

**Critical Path** (if sequential): Setup → US1 → US2 → US3 → Polish = ~7-10 hours

**Optimized Path** (if parallel with 3 developers): Setup → (US1 || US2 || US3) → Polish = ~5-6

**Optimized Path** (if parallel with 3 developers): Setup → (US1 || US2 || US3) → Polish = ~4-5 hours

---

## Success Criteria Validation

After completing all tasks, verify:

- **SC-001**: Generate Java agent via CLI; grep for `addCapability` returns zero matches ✅ (T033)
- **SC-002**: All Java SDK README files show annotation examples only ✅ (T027); Example services use `capabilities` attribute ✅ (T022-T025)
- **SC-003**: Test migration from `addCapability()` to `capabilities` attribute using README guidance (should take <10 min) ✅ (Manual test)
- **SC-004**: Spot-check non-Java scaffolds; verify unchanged ✅ (T034)

All success criteria are validated through tasks in Phases 5-6.
