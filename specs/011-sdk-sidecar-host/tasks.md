# Tasks: SDK Sidecar Host Convention

**Input**: Design documents from `/specs/011-sdk-sidecar-host/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

```
components/sdk/dotnet/
├── src/
│   ├── Spas.Sdk.Core/Configuration/SpasConfiguration.cs       # PRIMARY
│   └── Spas.Sdk.Observability/Extensions/SpasServiceExtensions.cs
└── test/
    └── Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs
```

---

## Phase 1: Setup

**Purpose**: Ensure existing SDK builds and tests pass before modification

- [X] T001 Verify SDK solution builds with `dotnet build` in `components/sdk/dotnet/`
- [X] T002 Run existing tests with `dotnet test` to establish baseline (125 passed)

---

## Phase 2: Foundational (Core Method Modification)

**Purpose**: Implement the shared `GetSpasSidecarUrl()` logic that all user stories depend on

**⚠️ CRITICAL**: All user stories depend on this method change

- [X] T003 Add `NormalizeForDns()` private helper method in `components/sdk/dotnet/src/Spas.Sdk.Core/Configuration/SpasConfiguration.cs`
- [X] T004 Modify `GetSpasSidecarUrl()` signature to add optional `serviceName` parameter in `components/sdk/dotnet/src/Spas.Sdk.Core/Configuration/SpasConfiguration.cs`
- [X] T005 Implement resolution priority logic (SIDECAR_URL → SIDECAR_HOST → SERVICE_NAME derivation → localhost) in `GetSpasSidecarUrl()`
- [X] T006 Fix default port from 3001 to 7000 in `components/sdk/dotnet/src/Spas.Sdk.Core/Configuration/SpasConfiguration.cs`

**Checkpoint**: Core method modified - user story validation can begin

---

## Phase 3: User Story 1 - Auto-Derived Sidecar Connection (Priority: P1) 🎯 MVP

**Goal**: SDK automatically connects to `{SERVICE_NAME}-sidecar:7000` when no explicit sidecar config is set

**Independent Test**: Deploy service with only `SERVICE_NAME=order-service`, verify SDK resolves to `http://order-service-sidecar:7000`

### Implementation for User Story 1

- [ ] T007 [US1] Add unit test `GetSpasSidecarUrl_WithServiceName_DerivesSidecarHost` in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`
- [ ] T008 [US1] Add unit test `GetSpasSidecarUrl_NormalizesServiceName_ForDns` (underscores, spaces, case) in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`
- [ ] T009 [US1] Update `AddSpasServices()` to pass service name to `GetSpasSidecarUrl()` in `components/sdk/dotnet/src/Spas.Sdk.Observability/Extensions/SpasServiceExtensions.cs`

**Checkpoint**: User Story 1 complete - derivation works with SERVICE_NAME only

---

## Phase 4: User Story 2 - Explicit Override (Priority: P2)

**Goal**: Explicit `SIDECAR_HOST` or `SIDECAR_URL` takes precedence over derived value

**Independent Test**: Set both `SERVICE_NAME=order-service` and `SIDECAR_HOST=custom-sidecar`, verify SDK uses `http://custom-sidecar:7000`

### Implementation for User Story 2

- [ ] T010 [US2] Add unit test `GetSpasSidecarUrl_WithSidecarUrl_IgnoresDerivation` in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`
- [ ] T011 [US2] Add unit test `GetSpasSidecarUrl_WithSidecarHost_IgnoresServiceName` in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`
- [ ] T012 [US2] Add unit test `GetSpasSidecarUrl_WithSidecarHostAndPort_UsesExplicitPort` in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`

**Checkpoint**: User Story 2 complete - explicit config wins over derivation

---

## Phase 5: User Story 3 - Local Development Fallback (Priority: P3)

**Goal**: SDK falls back to `http://localhost:7000` when no service name or sidecar config is set

**Independent Test**: Run service with no environment variables, verify SDK falls back to `http://localhost:7000`

### Implementation for User Story 3

- [ ] T013 [US3] Add unit test `GetSpasSidecarUrl_NoConfig_FallsBackToLocalhost7000` in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`
- [ ] T014 [US3] Add unit test `GetSpasSidecarUrl_EmptyServiceName_FallsBackToLocalhost` in `components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs`

**Checkpoint**: User Story 3 complete - local dev scenario works

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Logging, documentation, and validation

- [ ] T015 [P] Add startup logging of resolved sidecar URL in `components/sdk/dotnet/src/Spas.Sdk.Observability/Extensions/SpasServiceExtensions.cs`
- [ ] T016 [P] Update SDK README with sidecar URL resolution priority in `components/sdk/dotnet/README.md`
- [ ] T017 Run all SDK tests with `dotnet test` to verify no regressions
- [ ] T018 Run quickstart.md validation scenarios manually
- [ ] T019 Update requirements checklist in `specs/011-sdk-sidecar-host/checklists/requirements.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify baseline
- **Foundational (Phase 2)**: Depends on Setup - implements core method change
- **User Stories (Phase 3-5)**: All depend on Foundational completion
  - Stories can proceed sequentially (P1 → P2 → P3)
  - Each story adds tests validating its scenarios
- **Polish (Phase 6)**: Depends on all user stories complete

### Task Dependencies

```
T001, T002 (Setup)
    ↓
T003 → T004 → T005 → T006 (Foundational - sequential)
    ↓
T007, T008 → T009 (US1 tests → integration)
    ↓
T010, T011, T012 (US2 tests - parallel)
    ↓
T013, T014 (US3 tests - parallel)
    ↓
T015, T016 (Polish - parallel) → T017 → T018 → T019
```

### Parallel Opportunities

- T010, T011, T012 (US2 tests) can run in parallel
- T013, T014 (US3 tests) can run in parallel
- T015, T016 (logging + docs) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify baseline)
2. Complete Phase 2: Foundational (core method change)
3. Complete Phase 3: User Story 1 (derivation works)
4. **STOP and VALIDATE**: Test with real Docker Compose deployment
5. Can ship MVP if P2/P3 not urgent

### Full Implementation

1. Setup → Foundational → US1 → US2 → US3 → Polish
2. Total: 19 tasks
3. Estimated: 2-3 hours (small scope)

---

## Notes

- This is a small, focused change: 1 method + tests
- Default port fix (3001 → 7000) is a breaking change for anyone relying on wrong default
- All existing deployments with explicit `SIDECAR_HOST` continue to work unchanged
- Method signature change is backward compatible (optional parameter)
