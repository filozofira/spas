# Tasks: .NET SDK Build Warnings Cleanup

**Input**: Design documents from `/specs/033-dotnet-build-cleanup/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: No new tests required - existing test suite validates backward compatibility

**Organization**: Tasks grouped by user story (P1: Security fix, P2: Dependency cleanup, P3: Verification)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish baseline and prepare for changes

- [X] T001 Capture baseline build output with warnings from components/sdk/dotnet
- [X] T002 Run baseline test suite and capture results: `dotnet test` from components/sdk/dotnet
- [X] T003 Document current vulnerable packages: `dotnet list package --vulnerable`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: N/A - No foundational prerequisites for dependency updates

**⚠️ Note**: This feature has no blocking foundational work. Changes are isolated to .csproj files.

**Checkpoint**: Can proceed directly to user story implementation

---

## Phase 3: User Story 1 - Security Vulnerability Resolution (Priority: P1) 🎯 MVP

**Goal**: Eliminate NU1902 security warnings by updating OpenTelemetry packages from 1.10.0 to 1.11.0

**Independent Test**: Run `dotnet build` and `dotnet list package --vulnerable` - both should show zero security issues

### Implementation for User Story 1

- [X] T004 [US1] Update OpenTelemetry package from 1.10.0 to 1.12.0 in components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [X] T005 [US1] Update OpenTelemetry.Exporter.Zipkin from 1.10.0 to 1.12.0 in components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [X] T006 [US1] Update OpenTelemetry.Extensions.Hosting from 1.10.0 to 1.12.0 in components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [X] T007 [US1] Update OpenTelemetry.Instrumentation.AspNetCore from 1.10.0 to 1.12.0 in components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [X] T008 [US1] Update OpenTelemetry.Instrumentation.Http from 1.10.0 to 1.12.0 in components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
- [X] T009 [US1] Clean and rebuild SDK: `dotnet clean && dotnet build` from components/sdk/dotnet
- [X] T010 [US1] Verify zero NU1902 warnings in build output
- [X] T011 [US1] Run observability tests: `dotnet test` from components/sdk/dotnet/test/Spas.Sdk.Observability.Tests
- [X] T012 [US1] Verify no vulnerable packages: `dotnet list package --vulnerable` from components/sdk/dotnet

**Checkpoint**: OpenTelemetry security vulnerability resolved, observability tests passing

---

## Phase 4: User Story 2 - Dependency Cleanup (Priority: P2)

**Goal**: Eliminate NU1510 warnings by removing redundant ASP.NET Core package references

**Independent Test**: Build Spas.Sdk.Metadata and verify no NU1510 warnings, run metadata tests

### Implementation for User Story 2

- [ ] T013 [US2] Remove PackageReference to Microsoft.AspNetCore.Routing.Abstractions from components/sdk/dotnet/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj
- [ ] T014 [US2] Remove PackageReference to Microsoft.AspNetCore.Http.Abstractions from components/sdk/dotnet/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj
- [ ] T015 [US2] Clean and rebuild SDK: `dotnet clean && dotnet build` from components/sdk/dotnet
- [ ] T016 [US2] Verify zero NU1510 warnings in build output
- [ ] T017 [US2] Run metadata tests: `dotnet test` from components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests
- [ ] T018 [US2] Run full SDK test suite to ensure no downstream breakage: `dotnet test` from components/sdk/dotnet

**Checkpoint**: Redundant dependencies removed, all SDK tests passing

---

## Phase 5: User Story 3 - Clean Build Output (Priority: P3)

**Goal**: Verify zero warnings across all SDK projects and example services

**Independent Test**: Full build produces zero warnings, local NuGet publish succeeds

### Implementation for User Story 3

- [ ] T019 [P] [US3] Rebuild entire SDK from clean state: `dotnet clean && dotnet build` from components/sdk/dotnet
- [ ] T020 [US3] Verify zero total warnings in SDK build output
- [ ] T021 [US3] Publish SDK to local NuGet feed: `.\Publish-LocalNuGet.ps1 -Rebuild` from components/sdk/dotnet
- [ ] T022 [P] [US3] Build order-service: `dotnet build` from examples/services/order-service
- [ ] T023 [P] [US3] Build inventory-service: `dotnet build` from examples/services/inventory-service
- [ ] T024 [P] [US3] Build subscription-service: `dotnet build` from examples/services/subscription-service
- [ ] T025 [P] [US3] Build SampleService: `dotnet build` from components/sdk/dotnet/examples/SampleService
- [ ] T026 [US3] Verify zero warnings in all example service builds
- [ ] T027 [US3] Run quickstart.md validation procedure from specs/033-dotnet-build-cleanup/quickstart.md

**Checkpoint**: All builds clean with zero warnings, validation complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation and repository cleanup

- [ ] T028 [P] Update components/sdk/dotnet/CHANGELOG.md with OpenTelemetry version change
- [ ] T029 [P] Update components/sdk/dotnet/README.md if OpenTelemetry version is mentioned
- [ ] T030 Commit changes with descriptive message: "fix(sdk): update OpenTelemetry to 1.11.0, remove redundant ASP.NET packages"
- [ ] T031 Create pull request with link to spec: specs/033-dotnet-build-cleanup/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - captures baseline
- **Foundational (Phase 2)**: N/A - skipped for this feature
- **User Story 1 (Phase 3)**: Can start immediately after Setup - P1 MVP
- **User Story 2 (Phase 4)**: Can start after US1 OR in parallel with US1 (different files)
- **User Story 3 (Phase 5)**: Requires US1 AND US2 completion
- **Polish (Phase 6)**: Requires US3 completion

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only modifies Spas.Sdk.Observability.csproj
- **User Story 2 (P2)**: Independent - only modifies Spas.Sdk.Metadata.csproj
- **User Story 3 (P3)**: Depends on US1 AND US2 being complete

### Within Each User Story

**US1 (Security)**:
- T004-T008 update same file, must be done together (can use multi-edit)
- T009 must follow edits
- T010-T012 verification tasks can run in sequence

**US2 (Cleanup)**:
- T013-T014 update same file, must be done together (can use multi-edit)
- T015 must follow edits
- T016-T018 verification tasks run in sequence

**US3 (Verification)**:
- T019-T021 SDK verification (sequential)
- T022-T025 example services can build in parallel [P]
- T026-T027 final validation (sequential)

### Parallel Opportunities

- **Setup (Phase 1)**: All three baseline tasks (T001-T003) can run in parallel
- **User Story 1 & 2**: Can be implemented in parallel by different developers (different files)
- **Example Services (US3)**: T022-T025 can build in parallel (4 independent services)
- **Polish (Phase 6)**: T028-T029 documentation updates can run in parallel

### Recommended Execution Strategy

**For single developer**:
1. Run Setup tasks (T001-T003)
2. Implement US1 Security fix (T004-T012) - highest priority
3. Implement US2 Cleanup (T013-T018) - can reuse build from US1
4. Verify US3 (T019-T027) - ensures everything works together
5. Polish (T028-T031) - commit and PR

**For team (2 developers)**:
1. Both run Setup tasks
2. Dev A: US1 (T004-T012) in parallel with Dev B: US2 (T013-T018)
3. Dev A: US3 verification (T019-T027) after both complete
4. Dev B: Polish (T028-T031) in parallel with Dev A's verification

---

## Parallel Example: User Story 1 (Security Fix)

```bash
# Update all 5 OpenTelemetry packages at once in .csproj
# Then verify in sequence:
cd components/sdk/dotnet
dotnet clean && dotnet build  # T009
# Check output for zero NU1902 warnings (T010)
dotnet test test/Spas.Sdk.Observability.Tests  # T011
dotnet list package --vulnerable  # T012
```

---

## Implementation Strategy

### MVP Definition

**Minimum Viable Product = User Story 1 only**

Delivering just US1 (T004-T012) provides:
- ✅ Eliminates security vulnerability (GHSA-8785-wc3w-h8q6)
- ✅ Reduces risk to production systems
- ✅ Independently verifiable and testable

US2 (dependency cleanup) and US3 (comprehensive verification) are valuable but not security-critical.

### Incremental Delivery

1. **Sprint 1**: US1 (Security) → Merge to main
2. **Sprint 2**: US2 (Cleanup) → Merge to main  
3. **Sprint 3**: US3 (Verification) → Merge to main

Each increment is independently valuable and can be deployed.

### Validation Gates

- ✅ After US1: No NU1902 warnings, observability tests pass
- ✅ After US2: No NU1510 warnings, metadata tests pass
- ✅ After US3: Zero total warnings, all example services build clean

---

## Success Metrics

| Metric | Baseline | After US1 | After US2 | After US3 | Target |
|--------|----------|-----------|-----------|-----------|--------|
| NU1902 warnings | 3 | 0 | 0 | 0 | 0 |
| NU1510 warnings | 2 | 2 | 0 | 0 | 0 |
| Total warnings | 5 | 2 | 0 | 0 | 0 |
| Vulnerable packages | 1 | 0 | 0 | 0 | 0 |
| Test pass rate | 100% | 100% | 100% | 100% | 100% |
| Example services clean | 0/4 | 0/4 | 0/4 | 4/4 | 4/4 |

---

## Estimated Effort

- **Setup (Phase 1)**: 5 minutes (baseline capture)
- **User Story 1**: 15 minutes (5 version bumps + verification)
- **User Story 2**: 10 minutes (2 line removals + verification)
- **User Story 3**: 20 minutes (comprehensive build verification)
- **Polish**: 10 minutes (documentation + commit)

**Total**: ~60 minutes for complete implementation and verification
