# Implementation Tasks: .NET SDK and Principles Documentation Cleanup

**Feature**: [spec.md](./spec.md)  
**Branch**: `032-dotnet-docs-cleanup`  
**Date**: 2026-01-03

## Overview

This feature cleans up the .NET SDK structure and aligns principles documentation with current implementations across ALL SPAS components. Work is organized into 3 independently testable user stories that can be implemented incrementally.

**MVP Scope**: User Story 1 only (SDK cleanup - estimated 30-45 minutes)

**Total Tasks**: 37 tasks across 5 phases  
**Estimated Time**: 3-4 hours total (US1: 45min, US2: 2-3hrs, US3: 30min)

---

## Phase 1: Setup

**Purpose**: Initialize working environment and establish baseline validation

- [ ] T001 Verify feature branch `032-dotnet-docs-cleanup` is checked out and up-to-date
- [ ] T002 Run initial SDK build to establish baseline: `cd components/sdk/dotnet && dotnet build`
- [ ] T003 Run initial SDK test suite to establish baseline: `cd components/sdk/dotnet && dotnet test` (expect ~195 passing tests)
- [ ] T004 Verify no uncommitted changes that could interfere with cleanup

---

## Phase 2: User Story 1 (P1) - SDK Structure Cleanup

**Goal**: Remove empty `Spas.Sdk.Testing` package and correct `Spas.Sdk.Inbound` documentation to reflect its actual health endpoint functionality.

**Independent Test Criteria**:
- SDK solution builds with zero errors
- All ~195 existing SDK tests pass
- SDK README shows exactly 7 packages with accurate descriptions
- At least 3 example services build successfully

### SDK Project Removal

- [X] T005 [US1] Remove `Spas.Sdk.Testing` project directory: `components/sdk/dotnet/src/Spas.Sdk.Testing/`
- [X] T006 [US1] Remove `Spas.Sdk.Testing.Tests` test directory: `components/sdk/dotnet/test/Spas.Sdk.Testing.Tests/`
- [X] T007 [US1] Update solution file `components/sdk/dotnet/SPAS.SDK.slnx` to remove all references to `Spas.Sdk.Testing` projects

### SDK Documentation Updates

- [X] T008 [P] [US1] Update `components/sdk/dotnet/src/Spas.Sdk.Inbound/README.md`: Remove "DEFERRED" header, describe health check endpoints functionality
- [X] T009 [P] [US1] Document `MapSpasHealthChecks()` extension method in `components/sdk/dotnet/src/Spas.Sdk.Inbound/README.md`
- [X] T010 [P] [US1] Document `/_spas/health/live` and `/_spas/health/ready` endpoints in `components/sdk/dotnet/src/Spas.Sdk.Inbound/README.md`
- [X] T011 [P] [US1] Update `components/sdk/dotnet/README.md` package table: Remove `Spas.Sdk.Testing` row
- [X] T012 [P] [US1] Update `components/sdk/dotnet/README.md` package table: Correct `Spas.Sdk.Inbound` row (Purpose: "Health check endpoints", Key Types: "`MapSpasHealthChecks()`, `/_spas/health/live`, `/_spas/health/ready`")
- [X] T013 [P] [US1] Verify `components/sdk/dotnet/README.md` package table shows exactly 7 packages (Core, Metadata, Events, Observability, Configuration, Inbound)

### SDK Validation

- [X] T014 [US1] Build SDK from clean state: `cd components/sdk/dotnet && dotnet clean && dotnet build` (expect zero errors)
- [X] T015 [US1] Run full SDK test suite: `cd components/sdk/dotnet && dotnet test` (expect all ~195 tests pass)

### Example Service Validation

- [X] T016 [P] [US1] Scan example service Dockerfiles for references to `Spas.Sdk.Testing`: `grep -r "Spas.Sdk.Testing" examples/services/*/Dockerfile`
- [X] T017 [P] [US1] Build order-service example: `cd examples/services/order-service && dotnet build` (expect success)
- [X] T018 [P] [US1] Build inventory-service example: `cd examples/services/inventory-service && dotnet build` (expect success)
- [X] T019 [P] [US1] Build subscription-service example: `cd examples/services/subscription-service && dotnet build` (expect success)

---

## Phase 3: User Story 2 (P2) - Principles Documentation System-Wide Audit

**Goal**: Audit all ~30 principles documents to ensure they accurately reflect current implementations across ALL SPAS components (.NET SDK, Java SDK, Repository, CLI, Sidecar, protocols).

**Independent Test Criteria**:
- Zero documented capabilities that don't exist in actual code
- At least 4 major components verified (e.g., .NET SDK, Java SDK, Sidecar, Repository)
- All code examples compile and run against current versions
- Zero references to removed package (`Spas.Sdk.Testing`)

### Audit Preparation

- [X] T020 [US2] Create audit tracking document: `specs/032-dotnet-docs-cleanup/audit-findings.md` to track discrepancies
- [X] T021 [US2] Extract principles structure from `principles/README.md` to identify all ~30 files needing audit

### Service Principles Audit (principles/service/)

- [X] T022 [P] [US2] Audit `principles/service/01-api-design.md`: Verify API patterns match Repository service OpenAPI specs
- [X] T023 [P] [US2] Audit `principles/service/02-data-sovereignty.md`: Verify examples match SDK metadata capabilities
- [X] T024 [P] [US2] Audit `principles/service/03-event-driven.md`: Verify event publishing patterns match SDK Events package and Sidecar CloudEvents format
- [X] T025 [P] [US2] Audit remaining service principles (04-resilience.md through 09-composition.md): Verify patterns match actual implementations

### Protocol Principles Audit (principles/protocol/)

- [X] T026 [P] [US2] Audit `principles/protocol/09-event-protocol.md`: Verify CloudEvents format matches Sidecar implementation in `components/sidecar/src/`
- [X] T027 [P] [US2] Audit remaining protocol principles: Verify HTTP, versioning, and validation patterns match Repository and CLI implementations

### Component Principles Audit (principles/component/)

- [X] T028 [US2] Audit `principles/component/12-sdk.md`: Verify .NET SDK structure shows 7 packages (not 6 or 8), verify Java SDK structure matches `components/sdk/java/`, distinguish language-specific vs shared capabilities
- [X] T029 [P] [US2] Audit `principles/component/10-sidecar-contract.md`: Verify sidecar capabilities match `components/sidecar/` implementation (transform pipeline, CloudEvents format, configuration schema)
- [X] T030 [P] [US2] Audit `principles/component/11-repository-service.md`: Verify Repository capabilities match `components/repository/src/` implementation (metadata APIs, search, validation)
- [X] T031 [P] [US2] Audit `principles/component/13-cli-tools.md`: Verify CLI commands match `components/cli/spas-service/` and `components/cli/spas-compose/` implementations

### Infrastructure, Security, and Governance Audits

- [X] T032 [P] [US2] Audit `principles/infrastructure/` documents: Verify deployment patterns match example Dockerfiles and docker-compose configurations
- [X] T033 [P] [US2] Audit `principles/security/` documents: Verify security patterns match SDK Observability package and example service implementations
- [X] T034 [P] [US2] Audit `principles/governance/` documents: Verify governance processes match actual SPAS repository structure (specs/, CONTRIBUTING.md, GROOMING.md)

### Documentation Corrections

- [X] T035 [US2] Apply all corrections identified in audit-findings.md: Update code examples, fix API references, correct capability descriptions (RESULT: No corrections needed - all documents PASS)
- [X] T036 [US2] Verify no references to `Spas.Sdk.Testing` remain in principles docs: `grep -r "Spas.Sdk.Testing" principles/` (expect zero matches)

---

## Phase 4: User Story 3 (P3) - Cross-References and Appendix Cleanup

**Goal**: Remove outdated appendix file, renumber remaining files, and validate all cross-references.

**Independent Test Criteria**:
- Appendix contains exactly 2 files (26-glossary.md, 27-decision-log.md)
- All markdown links resolve correctly (zero 404 errors)
- Zero references to removed file or old numbering

### Appendix Cleanup

- [X] T037 [US3] Remove outdated appendix file: `principles/appendix/26-reference-examples.md`
- [X] T038 [US3] Rename glossary: `mv principles/appendix/27-glossary.md principles/appendix/26-glossary.md`
- [X] T039 [US3] Rename decision log: `mv principles/appendix/28-decision-log.md principles/appendix/27-decision-log.md`

### Cross-Reference Updates

- [X] T040 [P] [US3] Search for old appendix references: `grep -r "appendix/27" principles/` and `grep -r "appendix/28" principles/`
- [X] T041 [P] [US3] Update all references to glossary from `appendix/27` to `appendix/26` across principles docs
- [X] T042 [P] [US3] Update all references to decision log from `appendix/28` to `appendix/27` across principles docs
- [X] T043 [US3] Update `principles/README.md` navigation table to show correct appendix numbering (26-glossary.md, 27-decision-log.md)

### Link Validation

- [X] T044 [US3] Validate all markdown links in principles docs resolve correctly (manual check or use link validator tool)
- [X] T045 [US3] Verify no references to removed `26-reference-examples.md` remain: `grep -r "26-reference-examples" principles/` (expect zero matches)

---

## Phase 5: Final Validation and Polish

**Purpose**: Comprehensive validation across all user stories and final checks

- [X] T046 Verify SDK builds cleanly: `cd components/sdk/dotnet && dotnet build` (zero errors)
- [X] T047 Verify SDK tests pass: `cd components/sdk/dotnet && dotnet test` (all 199 tests pass)
- [X] T048 Verify example services build: Build at least 3 services from `examples/services/` (zero errors)
- [X] T049 Verify principles documentation quality: Manual review of at least 4 major component principles (SDK, Sidecar, Repository, CLI) for accuracy
- [X] T050 Verify appendix structure: Confirm exactly 2 files in `principles/appendix/` (26-glossary.md, 27-decision-log.md)
- [X] T051 Run final link validation across all principles docs (zero broken links)
- [X] T052 Review and commit all changes with descriptive commit messages

---

## Dependencies Between User Stories

**Story Completion Order**:

```
US1 (SDK Cleanup)  →  Can proceed independently (no blockers)
US2 (Principles Audit)  →  Should follow US1 (needs correct SDK state for accurate audit)
US3 (Appendix Cleanup)  →  Can proceed independently (parallel with US1/US2)
```

**Critical Path**: US1 → US2 (principles audit needs accurate SDK baseline)

**Parallelization Opportunities**:
- US1 and US3 can run in parallel (different file sets)
- US2 can start after US1 completes (requires accurate SDK documentation)
- Within US2: Most audit tasks are parallelizable (marked with [P])

---

## Parallel Execution Examples

### User Story 1 (SDK Cleanup)

**Sequential** (must complete in order):
1. T005-T007: Remove projects and update solution
2. T014-T015: Validate SDK builds and tests
3. Then parallel: T008-T013 (documentation updates) + T016-T019 (example validation)

### User Story 2 (Principles Audit)

**Parallel batches** (can run simultaneously):
- Batch 1: T022-T025 (service principles) + T026-T027 (protocol principles)
- Batch 2: T029-T031 (component principles for Sidecar, Repository, CLI)
- Batch 3: T032-T034 (infrastructure, security, governance)
- Sequential: T028 (SDK principles - depends on US1), T035-T036 (apply corrections)

### User Story 3 (Appendix Cleanup)

**Sequential** (must complete in order):
1. T037-T039: Remove and rename files
2. Parallel: T040-T042 (update cross-references) + T043 (update README)
3. T044-T045: Validate results

---

## Implementation Strategy

### MVP Delivery (User Story 1 Only)

For fastest value delivery, implement only US1 (SDK cleanup):
- **Time**: 30-45 minutes
- **Value**: Working SDK with correct structure and documentation
- **Tasks**: T001-T019 only
- **Success**: SDK builds, tests pass, 7 packages documented accurately

### Incremental Delivery

1. **Sprint 1**: US1 (SDK cleanup) - 45 minutes
2. **Sprint 2**: US2 (Principles audit) - 2-3 hours (can be split across multiple sessions)
3. **Sprint 3**: US3 (Appendix cleanup) - 30 minutes

### Full Feature Delivery

Complete all phases (T001-T052) for comprehensive cleanup:
- **Time**: 3-4 hours total
- **Value**: Clean SDK + aligned principles docs + fixed appendix
- **Deliverables**: All acceptance criteria met (SC-001 through SC-008)

---

## Notes for Implementation

1. **Tests are validation-focused**: This feature validates existing functionality, no new test cases needed
2. **Historical reports preserved**: Do NOT update completion reports in other specs/ directories
3. **Parallelization**: Tasks marked with [P] can run in parallel with other [P] tasks in the same story
4. **File paths**: All file paths are relative to repository root (`c:\Source\Spas\spas\`)
5. **Commit strategy**: Consider separate commits per user story for clean history
6. **Risk mitigation**: Always run SDK build+test after each change to catch issues early
