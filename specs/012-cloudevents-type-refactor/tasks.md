# Tasks: CloudEvents Type Construction Refactor

**Input**: Design documents from `/specs/012-cloudevents-type-refactor/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

```
components/
├── sdk/dotnet/
│   ├── src/Spas.Sdk.Events/Publish/EventPublisher.cs
│   └── test/Spas.Sdk.Events.Tests/Publish/EventPublisherTests.cs
├── sidecar/
│   ├── src/
│   │   ├── services/event-publisher.ts
│   │   ├── cloudevents/wrapper.ts
│   │   └── types.ts
│   └── test/unit/services/event-publisher.test.ts
└── cli/spas-compose/
    └── src/services/sidecar-config-generator.ts

principles/component/
├── 10-sidecar-contract.md
└── 12-sdk.md
```

---

## Phase 1: Setup

**Purpose**: Verify existing components build and tests pass before modification

- [X] T001 Verify SDK solution builds with `dotnet build` in `components/sdk/dotnet/`
- [X] T002 [P] Verify sidecar builds with `npm run build` in `components/sidecar/`
- [X] T003 Run existing SDK tests with `dotnet test` to establish baseline
- [X] T004 [P] Run existing sidecar tests with `npm test` to establish baseline (184 passed)

---

## Phase 2: User Story 2 - Sidecar Constructs Full Type (Priority: P1) 🎯 MVP

**Goal**: Sidecar accepts new `x-event-name` header and constructs full CloudEvents type, while maintaining backward compatibility with `x-event-type`

**Independent Test**: Send HTTP POST to sidecar `/publish` with `x-service-name` + `x-event-name` headers, verify CloudEvent has correct `type` field

**Why Sidecar First**: Deploy sidecar with backward compatibility before SDK changes, enabling rolling deployments

### Tests for User Story 2

- [X] T005 [P] [US2] Unit test for type construction from `x-event-name` header in `components/sidecar/test/unit/cloudevents/wrapper.test.ts`
- [X] T006 [P] [US2] Unit test for backward compat with `x-event-type` header in `components/sidecar/test/unit/cloudevents/wrapper.test.ts`
- [X] T007 [P] [US2] Unit test for validation error when both headers missing in `components/sidecar/test/unit/cloudevents/wrapper.test.ts`
- [X] T008 [P] [US2] Unit test for `x-event-name` priority over `x-event-type` in `components/sidecar/test/unit/cloudevents/wrapper.test.ts`

### Implementation for User Story 2

- [X] T009 [US2] Add `eventName?: string` field to `PublishHeaders` interface in `components/sidecar/src/types.ts`
- [X] T010 [US2] Add `constructCloudEventsType()` helper function in `components/sidecar/src/cloudevents/wrapper.ts`
- [X] T011 [US2] Modify `extractPublishHeaders()` to extract `x-event-name` header in `components/sidecar/src/services/event-publisher.ts`
- [X] T012 [US2] Modify `validatePublishHeaders()` to require ONE OF `x-event-type` OR `x-event-name` in `components/sidecar/src/services/event-publisher.ts`
- [X] T013 [US2] Modify `wrapCloudEvent()` to use `constructCloudEventsType()` when `eventName` present in `components/sidecar/src/cloudevents/wrapper.ts`
- [X] T014 [US2] Run sidecar tests with `npm test` to verify all pass (194 tests passed)

**Checkpoint**: Sidecar accepts both header formats - backward compatible, ready for SDK changes ✅

---

## Phase 3: User Story 1 - SDK Sends Short Event Name (Priority: P1)

**Goal**: SDK sends `x-event-name` header with short kebab-case name instead of full `x-event-type`

**Independent Test**: Publish event via SDK and verify HTTP request contains `x-event-name` header

### Tests for User Story 1

- [ ] T015 [P] [US1] Unit test for `x-event-name` header sent with kebab-case value in `components/sdk/dotnet/test/Spas.Sdk.Events.Tests/Publish/EventPublisherTests.cs`
- [ ] T016 [P] [US1] Unit test for `x-event-type` header NOT sent in `components/sdk/dotnet/test/Spas.Sdk.Events.Tests/Publish/EventPublisherTests.cs`
- [ ] T017 [P] [US1] Unit test for generic `PublishAsync<TEvent>` sends derived event name in `components/sdk/dotnet/test/Spas.Sdk.Events.Tests/Publish/EventPublisherTests.cs`

### Implementation for User Story 1

- [ ] T018 [US1] Modify `PublishAsync(string eventType, object payload)` to send `x-event-name` instead of `x-event-type` in `components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs`
- [ ] T019 [US1] Update method parameter name from `eventType` to `eventName` and update XML docs in `components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs`
- [ ] T020 [US1] Modify `PublishAsync<TEvent>` to pass only kebab-case event name (remove full type construction) in `components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs`
- [ ] T021 [US1] Update class XML documentation to reflect new header convention in `components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs`
- [ ] T022 [US1] Run SDK tests with `dotnet test` to verify all pass

**Checkpoint**: SDK sends new header format - sidecar already deployed handles it

---

## Phase 4: User Story 3 - CLI Generates Short Event Name (Priority: P2)

**Goal**: sidecar-config-generator adds `eventName` field to outbound entries alongside `eventType`

**Independent Test**: Run `spas-compose choreography build --docker` and verify generated configs include `eventName`

### Implementation for User Story 3

- [ ] T023 [P] [US3] Unit test for `eventName` field in generated outbound entries in `components/cli/spas-compose/test/unit/services/sidecar-config-generator.test.ts`
- [ ] T024 [US3] Add `eventName?: string` field to `OutboundEntry` interface in `components/cli/spas-compose/src/types.ts`
- [ ] T025 [US3] Modify `buildOutboundEntries()` to include `eventName` (short kebab-case) in `components/cli/spas-compose/src/services/sidecar-config-generator.ts`
- [ ] T026 [US3] Run spas-compose tests with `npm test` to verify all pass

**Checkpoint**: CLI generates configs with eventName field

---

## Phase 5: User Story 4 - Documentation Update (Priority: P3)

**Goal**: Update principles documentation to reflect new header convention

**Independent Test**: Review updated docs for accuracy and consistency

### Implementation for User Story 4

- [ ] T027 [P] [US4] Update 10-sidecar-contract.md Event Publishing section to document `x-event-name` header in `principles/component/10-sidecar-contract.md`
- [ ] T028 [P] [US4] Update 12-sdk.md Event Publishing Contract section to describe SDK sending short event name in `principles/component/12-sdk.md`
- [ ] T029 [US4] Fix terminology: change `boundedContext` to `service-name` in type format descriptions in `principles/component/10-sidecar-contract.md`

**Checkpoint**: Documentation reflects new header convention

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T030 Run full sidecar test suite with `npm test` in `components/sidecar/`
- [ ] T031 [P] Run full SDK test suite with `dotnet test` in `components/sdk/dotnet/`
- [ ] T032 [P] Run full spas-compose test suite with `npm test` in `components/cli/spas-compose/`
- [ ] T033 Run quickstart.md validation scenarios manually
- [ ] T034 Update requirements checklist in `specs/012-cloudevents-type-refactor/checklists/requirements.md`

**Checkpoint**: All tests passing, documentation updated, feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (US2: Sidecar) ← Deploy first for backward compatibility
    ↓
Phase 3 (US1: SDK) ← Now SDK can use new header
    ↓
Phase 4 (US3: CLI) ← Can run parallel with Phase 3
    ↓
Phase 5 (US4: Docs) ← Can run parallel with Phase 4
    ↓
Phase 6 (Polish)
```

### Task Dependencies

**Sidecar (Phase 2)**:
```
T005-T008 (tests) → T009 (types) → T010 (helper) → T011-T013 (impl) → T014 (verify)
```

**SDK (Phase 3)**:
```
T015-T017 (tests) → T018-T021 (impl) → T022 (verify)
```

### Parallel Opportunities

- T001 + T002 (build verification)
- T003 + T004 (baseline tests)
- T005 + T006 + T007 + T008 (sidecar tests)
- T015 + T016 + T017 (SDK tests)
- T027 + T028 (docs updates)
- T030 + T031 + T032 (final test runs)

---

## Implementation Strategy

### MVP First (Sidecar + SDK Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Sidecar with backward compat (US2)
3. Complete Phase 3: SDK new header (US1)
4. **STOP and VALIDATE**: Test end-to-end event publishing
5. Can ship MVP - CLI and docs can follow

### Deployment Order

1. **Deploy sidecar first** - Has backward compatibility for old SDK
2. **Deploy SDK-based services** - Will start using new header
3. CLI and docs follow as convenience updates

### Rollback Strategy

If issues arise:
1. Sidecar with backward compat means old SDK continues working
2. Revert SDK changes if needed - sidecar handles both formats
3. No coordinated rollback required

---

## Notes

- Sidecar Phase 2 is MVP - enables safe deployment order
- SDK Phase 3 depends on sidecar being deployed first
- CLI Phase 4 is optional for immediate functionality (existing configs work)
- Test tasks included per spec requirements for SDK and sidecar changes
- Total: 34 tasks across 6 phases
- Estimated: 3-4 hours (cross-cutting but small scope per component)
