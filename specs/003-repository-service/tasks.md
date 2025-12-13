# Tasks: SPAS Repository Service

**Input**: Design documents from `/specs/003-repository-service/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tech Stack**: Node.js 20, TypeScript (strict), Fastify, SQLite (better-sqlite3), Ajv, Jest
**Tests**: Unit tests mandatory per Constitution (>80% coverage). Integration tests included for end-to-end validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory `components/repository/` with subdirectories per plan.md structure
- [x] T002 Initialize Node.js project with `npm init` and configure package.json with dependencies: fastify, @fastify/multipart, better-sqlite3, ajv, unzipper, pino, @types packages
- [x] T003 [P] Create tsconfig.json with strict mode per research.md (ES2022 target, commonjs module)
- [x] T004 [P] Create jest.config.js for TypeScript with ts-jest, coverage threshold 80%
- [x] T005 [P] Create .gitignore (node_modules/, dist/, data/, \*.db, coverage/)
- [x] T006 [P] Create Dockerfile (multi-stage Alpine build) per research.md
- [x] T007 [P] Create .dockerignore (node_modules/, dist/, .git/, \*.md)
- [x] T008 Create README.md with project overview, setup instructions, and architecture notes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Define TypeScript interfaces in `src/models/types.ts` (ServiceMetadata, Schema, ServiceInfo, StorageConfig)
- [x] T010 [P] Define storage abstraction interface in `src/storage/IStorageProvider.ts` per research.md (publishService, getServiceMetadata, searchByCapability, etc.)
- [x] T011 [P] Create StorageFactory in `src/storage/StorageFactory.ts` for environment-based provider selection
- [x] T012 [P] Setup validation infrastructure in `src/validation/SpasSchemaValidator.ts` using Ajv with SPAS schema from `components/sdk/schemas/design-time-metadata-v1.schema.json`
- [x] T013 [P] Create schema evolution validator in `src/validation/SchemaEvolutionValidator.ts` for additive-only rule checking
- [x] T014 [P] Implement semver validator in `src/validation/VersionValidator.ts` for MAJOR.MINOR.PATCH format
- [x] T015 Setup Fastify app initialization in `src/index.ts` with pino logger, multipart plugin, error handler
- [x] T016 [P] Create environment configuration loader in `src/config.ts` (PORT, STORAGE_PROVIDER, SQLITE_PATH, LOG_LEVEL, ZIPKIN_URL)
- [x] T017 [P] Create database schema initialization in `src/storage/schema.sql` (services table with JSON columns, schemas table, indexes)
- [x] T018 Create test fixtures directory `test/fixtures/` with sample valid-service.zip, invalid-schema.zip, spas-schema.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Publish Service Metadata (Priority: P1) 🎯 MVP

**Goal**: Enable service developers to publish service packages with `spas.json` and schemas via multipart/form-data archive

**Independent Test**: Can publish a sample service and verify it appears in SQLite storage with correct metadata and schemas

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Unit test for SqliteStorageProvider.publishService in `test/unit/storage/sqlite-storage-provider.test.ts` (happy path, duplicate detection, transaction rollback)
- [x] T020 [P] [US1] Unit test for archive extraction in `test/unit/services/archive-service.test.ts` (valid ZIP, missing spas.json, invalid schemas)
- [x] T021 [P] [US1] Unit test for validation in `test/unit/validation/publish-validation.test.ts` (schema validation, identity mismatch, checksum verification)
- [x] T022 [P] [US1] Integration test for POST /services/{serviceName}:{version} in `test/integration/publish.test.ts` (all acceptance scenarios from spec.md)

### Implementation for User Story 1

- [x] T023 [P] [US1] Implement SqliteStorageProvider.initialize in `src/storage/SqliteStorageProvider.ts` (create DB, run schema, create indexes)
- [x] T024 [P] [US1] Implement SqliteStorageProvider.serviceExists in `src/storage/SqliteStorageProvider.ts` (query by name+version)
- [x] T025 [US1] Implement SqliteStorageProvider.publishService in `src/storage/SqliteStorageProvider.ts` with transaction (insert service, insert schemas, update index, ACID guarantee per FR-026)
- [x] T026 [P] [US1] Create ArchiveService in `src/services/ArchiveService.ts` (extract ZIP, parse spas.json, extract schemas using unzipper)
- [x] T027 [P] [US1] Create ChecksumService in `src/services/ChecksumService.ts` (SHA-256 verification for multipart checksum part per FR-008a)
- [x] T028 [US1] Create PublishService in `src/services/PublishService.ts` (orchestrate validation, extraction, storage, handle FR-001 through FR-010)
- [x] T029 [US1] Implement POST /services/{serviceName}:{version} route in `src/routes/publish.ts` (multipart handler, path authority validation per FR-034a, error responses)
- [x] T030 [US1] Register publish route in `src/index.ts` and add route-level error handling

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Retrieve Service Information (Priority: P1)

**Goal**: Enable platform operators and CLI tools to retrieve service metadata, versions, and schemas

**Independent Test**: Can retrieve previously published services via GET endpoints and verify correct data returned

### Tests for User Story 2

- [x] T031 [P] [US2] Unit test for SqliteStorageProvider.getServiceMetadata in `test/unit/storage/sqlite-storage-provider.test.ts`
- [x] T032 [P] [US2] Unit test for SqliteStorageProvider.getServiceVersions in `test/unit/storage/sqlite-storage-provider.test.ts` (descending order per FR-012)
- [x] T033 [P] [US2] Unit test for SqliteStorageProvider.getSchemas in `test/unit/storage/sqlite-storage-provider.test.ts`
- [x] T034 [P] [US2] Integration test for all retrieval endpoints in `test/integration/retrieve.test.ts` (all acceptance scenarios from spec.md)

### Implementation for User Story 2

- [x] T035 [P] [US2] Implement SqliteStorageProvider.getServiceMetadata in `src/storage/SqliteStorageProvider.ts` (retrieve from services table by name+version)
- [x] T036 [P] [US2] Implement SqliteStorageProvider.getServiceVersions in `src/storage/SqliteStorageProvider.ts` (ORDER BY version DESC per FR-012)
- [x] T037 [P] [US2] Implement SqliteStorageProvider.getLatestVersion in `src/storage/SqliteStorageProvider.ts`
- [x] T038 [P] [US2] Implement SqliteStorageProvider.getSchemas in `src/storage/SqliteStorageProvider.ts` (join with schemas table)
- [x] T039 [P] [US2] Implement SqliteStorageProvider.getSchema in `src/storage/SqliteStorageProvider.ts` (single schema by name)
- [x] T040 [US2] Create ArchiveBuilder in `src/services/ArchiveBuilder.ts` (generate ZIP with spas.json + schemas for download endpoint per FR-014)
- [x] T041 [US2] Create RetrievalService in `src/services/RetrievalService.ts` (orchestrate metadata retrieval, schema assembly)
- [x] T042 [P] [US2] Implement GET /services/{serviceName} route in `src/routes/retrieve.ts`
- [x] T043 [P] [US2] Implement GET /services/{serviceName}/versions route in `src/routes/retrieve.ts`
- [x] T044 [P] [US2] Implement GET /services/{serviceName}/versions/{version} route in `src/routes/retrieve.ts`
- [x] T045 [P] [US2] Implement GET /services/{serviceName}/versions/{version}/schemas route in `src/routes/retrieve.ts`
- [x] T046 [P] [US2] Implement GET /services/{serviceName}/versions/{version}/schemas/{schemaName} route in `src/routes/retrieve.ts`
- [x] T047 [P] [US2] Implement GET /services/{serviceName}/versions/{version}/download route in `src/routes/retrieve.ts` (ZIP generation)
- [x] T048 [US2] Register retrieval routes in `src/index.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (publish and retrieve)

---

## Phase 5: User Story 3 - Search Services by Capability (Priority: P2)

**Goal**: Enable platform operators to search for services by capability for domain composition

**Independent Test**: Can search by capability and verify only matching services returned

### Tests for User Story 3

- [x] T049 [P] [US3] Unit test for SqliteStorageProvider.searchByCapability in `test/unit/storage/sqlite-storage-provider.test.ts` (JSON array query)
- [x] T050 [P] [US3] Integration test for GET /services?capability={cap} in `test/integration/search.test.ts` (all acceptance scenarios from spec.md)

### Implementation for User Story 3

- [x] T051 [US3] Implement SqliteStorageProvider.searchByCapability in `src/storage/SqliteStorageProvider.ts` using json_each() for JSON array query per research.md
- [x] T052 [US3] Create SearchService in `src/services/SearchService.ts` (capability search orchestration, result formatting)
- [x] T053 [US3] Implement GET /services?capability={cap} route in `src/routes/search.ts`
- [x] T054 [US3] Register search route in `src/index.ts`

**Checkpoint**: Capability search should now work independently

---

## Phase 6: User Story 4 - Search Services by Bounded Context (Priority: P2)

**Goal**: Enable platform operators to search services by bounded context for domain organization

**Independent Test**: Can search by boundedContext and verify only matching services returned

### Tests for User Story 4

- [x] T055 [P] [US4] Unit test for SqliteStorageProvider.searchByBoundedContext in `test/unit/storage/sqlite-storage-provider.test.ts`
- [x] T056 [P] [US4] Integration test for GET /services?boundedContext={context} in `test/integration/search.test.ts` (all acceptance scenarios from spec.md)

### Implementation for User Story 4

- [x] T057 [US4] Implement SqliteStorageProvider.searchByBoundedContext in `src/storage/SqliteStorageProvider.ts` using generated column index per research.md
- [x] T058 [US4] Add boundedContext search to SearchService in `src/services/SearchService.ts`
- [x] T059 [US4] Implement GET /services?boundedContext={context} route in `src/routes/search.ts`

**Checkpoint**: Both search capabilities (capability + boundedContext) should now work

---

## Phase 7: User Story 5 - Unpublish Service Version (Priority: P3)

**Goal**: Enable service maintainers to remove published service versions for critical defects or security issues

**Independent Test**: Can unpublish a service version and verify it's removed from all queries

### Tests for User Story 5

- [x] T060 [P] [US5] Unit test for SqliteStorageProvider.deleteService in `test/unit/storage/sqlite-storage-provider.test.ts` (cascade delete, preserve other versions)
- [x] T061 [P] [US5] Integration test for DELETE /services/{serviceName}/versions/{version} in `test/integration/unpublish.test.ts` (all acceptance scenarios from spec.md)

### Implementation for User Story 5

- [x] T062 [US5] Implement SqliteStorageProvider.deleteService in `src/storage/SqliteStorageProvider.ts` with transaction (delete schemas, delete service metadata, atomic per FR-021)
- [x] T063 [US5] Create UnpublishService in `src/services/UnpublishService.ts`
- [x] T064 [US5] Implement DELETE /services/{serviceName}/versions/{version} route in `src/routes/unpublish.ts`
- [x] T065 [US5] Register unpublish route in `src/index.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T067 [P] Create production PostgresS3StorageProvider stub in `src/storage/PostgresS3StorageProvider.ts` (implements IStorageProvider, throws NotImplemented)
- [x] T068 [P] Add comprehensive API documentation in `components/repository/README.md` (endpoints, examples, storage abstraction)
- [x] T069 [P] Create docker-compose.yml for local development (repository service + Zipkin)
- [x] T070 Code cleanup and refactoring (ensure all error paths have proper logging, standardize response formats)
- [x] T073 Security review: validate all input sanitization, check SQL injection vectors, verify CORS config

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5)
- **Polish (Phase 8)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies, but logically follows US1 for testing
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2/US3
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies, but requires US1 published data for testing

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Storage provider methods before service layer
- Service layer before route handlers
- Route handlers before route registration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- All Foundational tasks marked [P] can run in parallel within Phase 2 (T010-T014, T016-T018)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within US1: Tests T019-T022 can run parallel, then T023-T027 can run parallel
- Within US2: Tests T031-T034 parallel, then T035-T039 parallel, then routes T042-T047 parallel
- Within US3: T049-T050 parallel
- Within US4: T055-T056 parallel
- Within US5: T060-T061 parallel
- Polish tasks: T066-T069, T071 can run parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T019: "Unit test for SqliteStorageProvider.publishService"
Task T020: "Unit test for archive extraction"
Task T021: "Unit test for validation"
Task T022: "Integration test for POST /services/{serviceName}:{version}"

# Launch all independent storage/service implementations:
Task T023: "Implement SqliteStorageProvider.initialize"
Task T024: "Implement SqliteStorageProvider.serviceExists"
Task T026: "Create ArchiveService"
Task T027: "Create ChecksumService"

# Then sequential:
Task T025: "Implement SqliteStorageProvider.publishService" (needs T023, T024)
Task T028: "Create PublishService" (needs T025, T026, T027)
Task T029: "Implement POST route" (needs T028)
Task T030: "Register route" (needs T029)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T018) **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (T019-T030) - Publish capability
4. Complete Phase 4: User Story 2 (T031-T048) - Retrieve capability
5. **STOP and VALIDATE**: Test publish + retrieve flow independently
6. Deploy/demo if ready

**Rationale**: US1 + US2 create minimal viable repository (publish + retrieve)

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001-T018)
2. Add User Story 1 → Test independently → MVP Publish! (T019-T030)
3. Add User Story 2 → Test independently → MVP Complete! (T031-T048)
4. Add User Story 3 → Test independently → Capability Search! (T049-T054)
5. Add User Story 4 → Test independently → BoundedContext Search! (T055-T059)
6. Add User Story 5 → Test independently → Unpublish Support! (T060-T065)
7. Polish (T066-T074) → Production-ready PoC!

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done:
   - Developer A: User Story 1 (T019-T030)
   - Developer B: User Story 2 (T031-T048)
   - Developer C: User Story 3 + 4 (T049-T059)
   - Developer D: User Story 5 + Polish (T060-T074)
3. Stories complete and integrate independently

---

## Validation Checklist

After completing all tasks:

- [ ] All 60 unit tests passing with >80% coverage
- [ ] All integration tests passing (publish, retrieve, search, unpublish)
- [ ] Storage abstraction (IStorageProvider) validated - SqliteStorageProvider implements all methods
- [ ] PostgresS3StorageProvider stub exists for future migration
- [ ] Performance targets met: publish ≤5s, retrieve ≤2s, search ≤1s
- [ ] Docker build succeeds, container runs with volume-mounted SQLite DB
- [ ] All quickstart.md examples work against running service
- [ ] OpenAPI contract in contracts/openapi.yaml matches implementation
- [ ] Security review complete (input validation, no SQL injection, CORS config)
- [ ] README.md documents setup, architecture, and storage abstraction

---

## Notes

- [P] tasks = different files, no dependencies, can parallelize
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Storage abstraction (IStorageProvider) is CRITICAL for Open-Closed Principle compliance
- SQLite provides ACID transactions - use them for publish/unpublish atomicity
