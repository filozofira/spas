# Tasks: Repository Service Enhancements

**Input**: Design documents from `/specs/015-repository-service-fixes/`  
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Unit and integration tests included per PoC testing defaults (mandatory unit tests).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `components/repository/`:
- Source: `src/`
- Tests: `test/unit/`, `test/integration/`

---

## Phase 1: Setup

**Purpose**: No setup required - enhancing existing service

This feature enhances an existing TypeScript/Fastify service. No new project structure or dependencies needed.

**Checkpoint**: Existing codebase ready for modification

---

## Phase 2: Foundational (Shared Infrastructure)

**Purpose**: Add storage layer support for getAllServices that both user stories depend on

- [ ] T001 Add `getAllServices()` method to IStorageProvider interface in src/storage/IStorageProvider.ts
- [ ] T002 Implement `getAllServices()` in SqliteStorageProvider in src/storage/SqliteStorageProvider.ts
- [ ] T003 [P] Implement `getAllServices()` stub in PostgresS3StorageProvider in src/storage/PostgresS3StorageProvider.ts

**Checkpoint**: Storage layer ready - user story implementation can begin

---

## Phase 3: User Story 1 - Service Discovery Without Filters (Priority: P1) 🎯 MVP

**Goal**: Enable `GET /services` endpoint to return all services without requiring capability or boundedContext filters

**Independent Test**: Call `GET /services` without query parameters and verify all published services are returned with proper metadata

### Tests for User Story 1

- [ ] T004 [P] [US1] Add unit tests for SearchService.getAllServices() in test/unit/services/SearchService.test.ts
- [ ] T005 [P] [US1] Add integration tests for unfiltered GET /services endpoint in test/integration/search.test.ts

### Implementation for User Story 1

- [ ] T006 [US1] Add `getAllServices()` method to SearchService in src/services/SearchService.ts
- [ ] T007 [US1] Modify search route handler to call getAllServices() when no filters provided in src/routes/search.ts
- [ ] T008 [US1] Update error handling to allow empty query parameters in src/routes/search.ts

**Checkpoint**: User Story 1 complete - unfiltered service listing works independently

---

## Phase 4: User Story 2 - Correct Schema Version for Retrieved Services (Priority: P2)

**Goal**: Fix bug where retrieved service metadata shows `"schemaVersion": "design-time-metadata-v1"` instead of `"runtime-metadata-v1"`

**Independent Test**: Retrieve any published service and verify `schemaVersion` field shows `"runtime-metadata-v1"`

### Tests for User Story 2

- [ ] T009 [P] [US2] Add unit tests for schema version transformation in test/unit/services/RetrievalService.test.ts
- [ ] T010 [P] [US2] Add integration tests verifying schema version in GET /services/{name} in test/integration/retrieve.test.ts
- [ ] T011 [P] [US2] Add integration tests verifying schema version in search results in test/integration/search.test.ts

### Implementation for User Story 2

- [ ] T012 [US2] Add `transformToRuntimeMetadata()` helper function in src/services/RetrievalService.ts
- [ ] T013 [US2] Apply schema version transformation in RetrievalService.getServiceInfo() in src/services/RetrievalService.ts
- [ ] T014 [US2] Apply schema version transformation in RetrievalService.getMetadata() in src/services/RetrievalService.ts
- [ ] T015 [US2] Apply schema version transformation in SearchService results in src/services/SearchService.ts
- [ ] T016 [US2] Ensure schema version is correct in buildDownloadArchive() output in src/services/RetrievalService.ts

**Checkpoint**: User Story 2 complete - all retrieved services have correct schema version

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T017 Run all unit tests and verify passing: `npm test` in components/repository/
- [ ] T018 Run integration tests and verify both features work together
- [ ] T019 [P] Update README.md with new unfiltered endpoint documentation in components/repository/README.md
- [ ] T020 Run quickstart.md validation scenarios from specs/015-repository-service-fixes/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)         → N/A (existing project)
Phase 2 (Foundational)  → Storage interface changes BLOCK user stories
Phase 3 (US1)           → Depends on Phase 2 completion
Phase 4 (US2)           → Depends on Phase 2 completion, can parallel with US1
Phase 5 (Polish)        → Depends on US1 + US2 completion
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (T001-T003) - getAllServices() storage method
- **User Story 2 (P2)**: Depends on Foundational (T001-T003) - needs storage results to transform

### Within Each User Story

- Tests written first (T004-T005, T009-T011)
- Service layer before route layer
- Core implementation before integration points

### Parallel Opportunities

**Foundational Phase**:
```
T001 (interface)  ──┬──> T002 (SQLite impl)
                   └──> T003 [P] (Postgres stub)
```

**User Story 1 Tests**:
```
T004 [P] (unit tests)      } Run in parallel
T005 [P] (integration)     }
```

**User Story 2 Tests**:
```
T009 [P] (unit tests)           }
T010 [P] (retrieve integration) } Run in parallel
T011 [P] (search integration)   }
```

**Cross-Story Parallelism** (after Foundational):
```
Developer A: US1 (T004-T008)  } Can work in parallel
Developer B: US2 (T009-T016)  }
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003)
2. Complete Phase 3: User Story 1 (T004-T008)
3. **STOP and VALIDATE**: Test `GET /services` endpoint independently
4. Deploy/demo if ready - unfiltered listing provides immediate value

### Full Delivery

1. Complete Foundational → Storage ready
2. Complete User Story 1 → Unfiltered listing works
3. Complete User Story 2 → Schema version fix applied
4. Complete Polish → All tests pass, documentation updated

---

## Notes

- All file paths are relative to `components/repository/`
- Existing tests in `test/integration/search.test.ts` provide patterns for new tests
- Schema version transformation should be applied at the service layer, not storage layer
- Storage layer returns raw data; service layer transforms for API responses
- Backward compatibility is critical - existing filtered endpoints must continue to work

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Setup | 0 | N/A |
| Foundational | 3 (T001-T003) | T002, T003 parallel after T001 |
| User Story 1 | 5 (T004-T008) | T004, T005 parallel |
| User Story 2 | 8 (T009-T016) | T009-T011 parallel |
| Polish | 4 (T017-T020) | T019 parallel |
| **Total** | **20 tasks** | |

**Task Count by User Story**:
- User Story 1 (P1): 5 tasks (MVP scope)
- User Story 2 (P2): 8 tasks

**Independent Test Criteria**:
- US1: `GET /services` returns all services without filters
- US2: All retrieved services have `schemaVersion: "runtime-metadata-v1"`

**Suggested MVP Scope**: Complete through User Story 1 (T001-T008) for immediate value
