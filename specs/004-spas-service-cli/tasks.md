# Tasks: SPAS-Service CLI Tool

**Input**: Design documents from `/specs/004-spas-service-cli/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tech Stack**: Node.js 20 LTS, TypeScript 5.x (strict), Commander.js, axios, adm-zip, form-data, Jest
**Tests**: Unit tests and integration tests included per Constitution requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory `components/cli/spas-service/` with subdirectories: `src/commands/`, `src/services/`, `src/utils/`, `test/unit/`, `test/integration/`
- [X] T002 Initialize Node.js project with `npm init` and configure package.json with dependencies: commander, axios, adm-zip, form-data, chalk (dev: typescript, ts-node, @types/node, jest, ts-jest, @types/jest)
- [X] T003 [P] Create tsconfig.json with strict mode (ES2022 target, commonjs module, rootDir: src/, outDir: dist/)
- [X] T004 [P] Create jest.config.js for TypeScript with ts-jest, coverage threshold 80%
- [X] T005 [P] Create .gitignore (node_modules/, dist/, coverage/, *.zip)
- [X] T006 Create README.md with project overview, installation, and usage examples from quickstart.md
- [X] T007 [P] Add local development section to README.md (npm link for testing, local path installation for examples/CI)
- [X] T008 Create CLI placeholder in `components/cli/spas-compose/README.md` (future Phase 3 continuation)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. Also includes SDK alignment.

### SDK Archive Format Alignment (Pre-requisite T001)

> **BLOCKS ALL CLI WORK**: SDK must produce Repository-compatible archives before CLI can function

- [X] T009 Update `MetadataArchiveWriter.cs` in `components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/` to use `id` instead of `serviceId` in spas.json
- [X] T010 [P] Update `MetadataArchiveWriter.cs` to use `name` instead of `serviceName` in spas.json
- [X] T011 [P] Update schema path structure in `MetadataArchiveWriter.cs` to use categorized paths: `schemas/endpoints/*.schema.json`, `schemas/events/*.schema.json`
- [X] T012 [P] Add `schemaVersion: "design-time-metadata-v1"` field to spas.json generation in `MetadataArchiveWriter.cs`
- [X] T013 Update SDK tests in `components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/` for new archive format
- [X] T014 Manual integration validation: generate archive from SDK and publish to Repository

### CLI Core Infrastructure

- [X] T015 [P] Define TypeScript interfaces in `components/cli/spas-service/src/types.ts` (PublishOptions, PullOptions, ServiceIdentity, CliConfig, CliError, ErrorCode)
- [X] T016 [P] Create config resolver in `components/cli/spas-service/src/utils/config.ts` (resolve repo URL from --repo flag, SPAS_REPOSITORY_URL env, default localhost:3000)
- [X] T017 [P] Create retry utility in `components/cli/spas-service/src/utils/retry.ts` (exponential backoff: max 5 retries, 1s initial, 2x multiplier, 16s max delay)
- [X] T018 [P] Create output formatter in `components/cli/spas-service/src/utils/output.ts` (success/error messages with chalk coloring, verbose mode support)
- [X] T019 [P] Create archive reader service in `components/cli/spas-service/src/services/archive-reader.ts` (extract spas.json from ZIP to get ServiceIdentity)
- [X] T020 [P] Create metadata client service in `components/cli/spas-service/src/services/metadata-client.ts` (GET /_spas/metadata endpoint with retry, return Buffer)
- [X] T021 [P] Create repository client service in `components/cli/spas-service/src/services/repository-client.ts` (POST /services/{id}:{version} multipart, GET /services/{id}/versions/{version}/download)
- [X] T022 Create CLI entry point in `components/cli/spas-service/src/index.ts` (Commander.js setup with version, help, global --repo option)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Publish Service Metadata (Priority: P1) 🎯 MVP

**Goal**: Enable developers to publish service metadata with single command: `spas-service publish <service-host>`

**Independent Test**: Run `spas-service publish http://localhost:5000 --repo http://localhost:3000` against SDK service and Repository, verify service appears in Repository

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T023 [P] [US1] Unit test for archive-reader.ts in `test/unit/services/archive-reader.test.ts` (valid ZIP with spas.json, missing spas.json, malformed JSON)
- [X] T024 [P] [US1] Unit test for metadata-client.ts in `test/unit/services/metadata-client.test.ts` (successful download, 404 error, timeout with retry)
- [X] T025 [P] [US1] Unit test for repository-client.ts publish in `test/unit/services/repository-client.test.ts` (201 Created, 400 validation error, 409 conflict)
- [X] T026 [P] [US1] Unit test for config.ts in `test/unit/utils/config.test.ts` (flag priority, env var fallback, default)
- [X] T027 [P] [US1] Unit test for retry.ts in `test/unit/utils/retry.test.ts` (retry on failure, exponential backoff timing, max retries exceeded)
- [X] T028 [P] [US1] Integration test for publish command in `test/integration/publish.test.ts` (end-to-end publish workflow with mocked services)

### Implementation for User Story 1

- [X] T029 [US1] Create PublishService in `components/cli/spas-service/src/services/publish-service.ts` (orchestrate: prompt → download → extract identity → publish)
- [X] T030 [US1] Implement publish command in `components/cli/spas-service/src/commands/publish.ts` (Commander action for `publish <service-host>`)
- [X] T031 [US1] Add user prompt logic in publish command ("Start your service at {host} and press Enter to continue...")
- [X] T032 [US1] Register publish command in `src/index.ts` with options: --repo
- [X] T033 [US1] Implement error handling in publish command for all ErrorCode scenarios (SERVICE_UNAVAILABLE, REPOSITORY_UNREACHABLE, VERSION_CONFLICT, etc.)
- [X] T034 [US1] Add success output formatting ("✓ Downloaded metadata...", "✓ Published to...")

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Dry Run Mode (Priority: P2)

**Goal**: Enable developers to preview what would be published without actually publishing

**Independent Test**: Run `spas-service publish http://localhost:5000 --dry-run`, verify ZIP saved locally and no Repository calls made

### Tests for User Story 2

- [X] T035 [P] [US2] Unit test for dry-run in publish-service.ts in `test/unit/services/publish-service.test.ts` (saves file, skips repository client)
- [X] T036 [P] [US2] Integration test for --dry-run in `test/integration/publish.test.ts` (verify no HTTP to Repository, file created locally)

### Implementation for User Story 2

- [X] T037 [US2] Extend PublishService for dry-run mode (save archive locally, display contents summary, skip publish)
- [X] T038 [US2] Add --dry-run flag to publish command in `src/commands/publish.ts`
- [X] T039 [US2] Implement archive contents display (spas.json identity, schemas count, file list)
- [X] T040 [US2] Add dry-run specific output formatting ("Dry run complete. No changes published.")

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Publish Pre-Packaged Archive (Priority: P3)

**Goal**: Enable CI/CD scenarios to publish pre-built archives without running service

**Independent Test**: Run `spas-service publish --archive ./my-service-1.0.0.zip --repo http://localhost:3000`, verify service appears in Repository

### Tests for User Story 3

- [X] T041 [P] [US3] Unit test for archive-mode in publish-service.ts in `test/unit/services/publish-service.test.ts` (reads local file, validates spas.json, publishes)
- [X] T042 [P] [US3] Unit test for invalid archive validation in `test/unit/services/publish-service.test.ts` (missing spas.json error)
- [X] T043 [P] [US3] Integration test for --archive in `test/integration/publish.test.ts` (verify archive file published, no service prompt)

### Implementation for User Story 3

- [X] T044 [US3] Extend PublishService for archive mode (read local ZIP, validate spas.json exists, extract identity)
- [X] T045 [US3] Add --archive <path> flag to publish command in `src/commands/publish.ts` (mutual exclusivity with service-host)
- [X] T046 [US3] Add validation error for archive without spas.json (ARCHIVE_INVALID error code)
- [X] T047 [US3] Skip user prompt when --archive is used (no service startup needed)

### Runtime Metadata Support (CI/CD)

- [X] T047b [P] [US3] Unit test for runtime metadata flags in `test/unit/services/repository-client.test.ts` (imageDigest, imageRepository, imageTag sent as form fields)
- [X] T047c [US3] Add --image-digest <digest> flag to publish command (SHA256 container digest)
- [X] T047d [US3] Add --image-repository <repo> flag to publish command (e.g., ghcr.io/org/service)
- [X] T047e [US3] Add --image-tag <tag> flag to publish command (e.g., 1.0.0, latest)
- [X] T047f [US3] Extend RepositoryClient.publishService() to send runtime metadata form fields when provided
- [X] T047g [US3] Update PublishOptions type with imageDigest, imageRepository, imageTag properties
- [X] T047h [US3] Document local development usage in README (local images without registry push)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Pull Service Metadata (Priority: P3)

**Goal**: Enable developers to download published service metadata from Repository

**Independent Test**: Run `spas-service pull order-service 1.0.0 --repo http://localhost:3000`, verify ZIP downloaded locally

### Tests for User Story 4

- [ ] T048 [P] [US4] Unit test for repository-client.ts download in `test/unit/services/repository-client.test.ts` (successful download, 404 not found)
- [ ] T049 [P] [US4] Unit test for pull-service.ts in `test/unit/services/pull-service.test.ts` (download and save, custom output directory)
- [ ] T050 [P] [US4] Integration test for pull command in `test/integration/pull.test.ts` (end-to-end download workflow)

### Implementation for User Story 4

- [ ] T051 [P] [US4] Create PullService in `components/cli/spas-service/src/services/pull-service.ts` (download from Repository, save to file)
- [ ] T052 [US4] Implement pull command in `components/cli/spas-service/src/commands/pull.ts` (Commander action for `pull <name> <version>`)
- [ ] T053 [US4] Add --output <dir> flag to pull command for custom download directory
- [ ] T054 [US4] Add --repo flag support to pull command
- [ ] T055 [US4] Register pull command in `src/index.ts`
- [ ] T056 [US4] Implement error handling for NOT_FOUND (service/version doesn't exist)
- [ ] T057 [US4] Add success output formatting ("✓ Downloaded {name}:{version}", "✓ Saved to ./{name}-{version}.zip")

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Add npm bin configuration in package.json for global install (`"bin": { "spas-service": "./dist/index.js" }`)
- [ ] T059 [P] Add shebang (`#!/usr/bin/env node`) to dist/index.js via build script
- [ ] T060 [P] Update `components/cli/README.md` with CLI tools overview and links
- [ ] T061 Code cleanup and refactoring (consistent error messages, standardize logging)
- [ ] T062 [P] Add npm scripts in package.json (build, test, test:coverage, lint)
- [ ] T063 Run quickstart.md validation scenarios manually
- [ ] T064 Update `.github/agents/copilot-instructions.md` with CLI component completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - SDK alignment (T008-T013) MUST complete before CLI can work with Repository
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Publish)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2 - Dry Run)**: Extends US1's publish command - Can be developed alongside or after US1
- **User Story 3 (P3 - Archive Mode)**: Extends US1's publish command - Can be developed alongside or after US1
- **User Story 4 (P3 - Pull)**: Independent of publish stories - Can be developed in parallel with US1-3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Services before commands
- Core implementation before flags/options
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- SDK alignment tasks T008-T011 can run in parallel (different aspects of same file)
- CLI infrastructure tasks T014-T020 can run in parallel (different files)
- All tests for a user story marked [P] can run in parallel
- User Story 4 (Pull) can be developed in parallel with User Stories 1-3 (Publish)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for archive-reader.ts in test/unit/services/archive-reader.test.ts"
Task: "Unit test for metadata-client.ts in test/unit/services/metadata-client.test.ts"
Task: "Unit test for repository-client.ts in test/unit/services/repository-client.test.ts"
Task: "Unit test for config.ts in test/unit/utils/config.test.ts"
Task: "Unit test for retry.ts in test/unit/utils/retry.test.ts"

# Launch all infrastructure tasks together:
Task: "Define TypeScript interfaces in src/types.ts"
Task: "Create config resolver in src/utils/config.ts"
Task: "Create retry utility in src/utils/retry.ts"
Task: "Create output formatter in src/utils/output.ts"
Task: "Create archive reader service in src/services/archive-reader.ts"
Task: "Create metadata client service in src/services/metadata-client.ts"
Task: "Create repository client service in src/services/repository-client.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - SDK alignment + CLI infrastructure)
3. Complete Phase 3: User Story 1 (Publish)
4. **STOP and VALIDATE**: Test publish workflow end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Publish) → Test independently → **MVP Ready!**
3. Add User Story 2 (Dry Run) → Test independently → Enhanced publish
4. Add User Story 3 (Archive Mode) → Test independently → CI/CD ready
5. Add User Story 4 (Pull) → Test independently → Full publish/pull workflow
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (SDK alignment is critical path)
2. Once Foundational is done:
   - Developer A: User Story 1 (Publish) + User Story 2 (Dry Run)
   - Developer B: User Story 4 (Pull) - runs in parallel
3. After US1 complete:
   - Developer A: User Story 3 (Archive Mode)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **SDK Alignment (T008-T013) is the critical path** - all CLI work blocked until complete
