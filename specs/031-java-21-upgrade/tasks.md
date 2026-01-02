# Tasks: Java 21 Upgrade

**Input**: Design documents from `/specs/031-java-21-upgrade/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No new tests required - existing test suites validate backward compatibility (FR-008)

**Organization**: Tasks are grouped by user story (SDK first, then services, then deployment artifacts)

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and baseline measurements

- [X] T001 Verify Java 21 JDK installation with `java -version`
- [X] T002 Verify Maven 3.8+ with `mvn -version`
- [X] T003 Record baseline build time for SDK with `mvn clean install` in components/sdk/java

**Checkpoint**: Prerequisites validated, baseline recorded

---

## Phase 2: User Story 1 - SDK Development with Java 21 (Priority: P1) 🎯 MVP

**Goal**: Upgrade Java SDK to target Java 21, enabling all dependent services to use modern Java

**Independent Test**: `cd components/sdk/java && mvn clean install` - All 100+ tests pass, artifacts installed to local Maven repo

### Implementation for User Story 1

- [X] T004 [US1] Update java.version from 17 to 21 in components/sdk/java/pom.xml
- [X] T005 [US1] Build SDK with `mvn clean compile` in components/sdk/java
- [X] T006 [US1] Run all SDK tests with `mvn test` in components/sdk/java (verify 100+ tests pass)
- [X] T007 [US1] Install SDK to local Maven repository with `mvn install` in components/sdk/java
- [X] T008 [US1] Verify Java 21 target with `mvn help:evaluate -Dexpression=maven.compiler.target -q -DforceStdout`
- [X] T009 [US1] Measure and compare build time (should be within 5% of baseline from T003)

**Checkpoint**: SDK successfully builds with Java 21, all tests pass, artifacts available for dependent services

---

## Phase 3: User Story 2 - Example Service Compatibility (Priority: P2)

**Goal**: Upgrade all example services to Java 21 to demonstrate best practices

**Independent Test**: Each service builds with `mvn clean package` and generates metadata successfully

### Implementation for User Story 2

#### Sample Service

- [X] T010 [P] [US2] Update java.version from 17 to 21 in components/sdk/java/examples/sample-service/pom.xml
- [X] T011 [US2] Build sample-service with `mvn clean package` in components/sdk/java/examples/sample-service

#### Basket Service

- [X] T012 [P] [US2] Update java.version from 17 to 21 in examples/services/basket-service/pom.xml
- [X] T013 [US2] Build basket-service with `mvn clean package` in examples/services/basket-service
- [X] T014 [US2] Generate metadata with `mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"` in examples/services/basket-service
- [X] T015 [US2] Verify metadata archive created at examples/services/basket-service/metadata/service.metadata.zip

#### Rental Service

- [X] T016 [P] [US2] Update java.version from 17 to 21 in examples/services/rental-service/pom.xml
- [X] T017 [US2] Build rental-service with `mvn clean package` in examples/services/rental-service
- [X] T018 [US2] Generate metadata with `mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"` in examples/services/rental-service
- [X] T019 [US2] Verify metadata archive created at examples/services/rental-service/metadata/service.metadata.zip

#### Fulfillment Service

- [X] T020 [P] [US2] Update java.version from 17 to 21 in examples/services/fulfillment-service/pom.xml
- [X] T021 [US2] Build fulfillment-service with `mvn clean package` in examples/services/fulfillment-service
- [X] T022 [US2] Generate metadata with `mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"` in examples/services/fulfillment-service
- [X] T023 [US2] Verify metadata archive created at examples/services/fulfillment-service/metadata/service.metadata.zip

**Checkpoint**: All example services build successfully with Java 21 and generate metadata

---

## Phase 4: User Story 3 - Container Image Updates (Priority: P3)

**Goal**: Update Docker images to use Java 21 base images for optimal runtime performance

**Independent Test**: `docker build` succeeds and `docker run` starts container with Java 21

### Implementation for User Story 3

#### Basket Service Docker

- [X] T024 [P] [US3] Update FROM maven:3.9-eclipse-temurin-17-alpine to maven:3.9-eclipse-temurin-21-alpine in examples/services/basket-service/Dockerfile (build stage)
- [X] T025 [P] [US3] Update FROM eclipse-temurin:17-alpine to eclipse-temurin:21-alpine in examples/services/basket-service/Dockerfile (runtime stage)
- [ ] T026 [US3] Test Docker build with `docker build -t basket-service:java21 .` in examples/services/basket-service (optional but recommended)

#### Rental Service Docker

- [X] T027 [P] [US3] Update FROM maven:3.9-eclipse-temurin-17-alpine to maven:3.9-eclipse-temurin-21-alpine in examples/services/rental-service/Dockerfile (build stage)
- [X] T028 [P] [US3] Update FROM eclipse-temurin:17-alpine to eclipse-temurin:21-alpine in examples/services/rental-service/Dockerfile (runtime stage)
- [ ] T029 [US3] Test Docker build with `docker build -t rental-service:java21 .` in examples/services/rental-service (optional but recommended)

#### Fulfillment Service Docker

- [X] T030 [P] [US3] Update FROM maven:3.9-eclipse-temurin-17-alpine to maven:3.9-eclipse-temurin-21-alpine in examples/services/fulfillment-service/Dockerfile (build stage)
- [X] T031 [P] [US3] Update FROM eclipse-temurin:17-alpine to eclipse-temurin:21-alpine in examples/services/fulfillment-service/Dockerfile (runtime stage)
- [ ] T032 [US3] Test Docker build with `docker build -t fulfillment-service:java21 .` in examples/services/fulfillment-service (optional but recommended)

**Checkpoint**: All Dockerfiles updated to Java 21, images build successfully

---

## Phase 5: Documentation & Templates

**Purpose**: Update documentation and CLI templates to reference Java 21

### Documentation Updates

- [X] T033 [P] Search for Java 17 references with `git grep -n "Java 17" -- "*.md" ":(exclude)specs/0[0-2][0-9]-*" ":(exclude)specs/030-*"`
- [X] T034 [P] Update README.md to reference Java 21 in system requirements (if applicable)
- [X] T035 [P] Update components/sdk/java/README.md to reference Java 21 in prerequisites section
- [X] T036 [P] Update components/sdk/java/CONTRIBUTING.md to reference Java 21 in development setup (if applicable)
- [X] T037 [P] Update examples/services/basket-service/README.md to reference Java 21 in requirements
- [X] T038 [P] Update examples/services/rental-service/README.md to reference Java 21 in requirements
- [X] T039 [P] Update examples/services/fulfillment-service/README.md to reference Java 21 in requirements

### CLI Template Updates

- [X] T040 [P] Search for CLI template references with `git grep -n "Java 17" -- "templates/**" "*.eta" ".github/agents/**"`
- [X] T041 Update templates/partials/sdk-patterns.eta to generate java.version=21 in POMs (update <java.version>17</java.version> to <java.version>21</java.version>)
- [X] T042 [P] Update any agent prompt templates referencing Java 17 in .github/agents/ (if found)
- [ ] T043 Verify CLI generation with `spas-service init test-service-java21` and check pom.xml has java.version=21 (optional if CLI available)

**Checkpoint**: All current documentation and CLI templates reference Java 21

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion - MUST complete first (SDK is foundation)
- **User Story 2 (Phase 3)**: Depends on User Story 1 completion (services depend on SDK)
- **User Story 3 (Phase 4)**: Can start after User Story 2 (Dockerfiles independent of services building)
- **Documentation (Phase 5)**: Can start in parallel with Phase 2-4, or after all code changes complete

### User Story Dependencies

- **User Story 1 (P1 - SDK)**: Independent once setup complete - MUST be done first
- **User Story 2 (P2 - Services)**: Depends on US1 completion (services use SDK as dependency)
- **User Story 3 (P3 - Docker)**: Independent once US2 complete (can verify containers run)

### Within Each User Story

**User Story 1 (SDK)**:
1. Update POM (T004)
2. Build (T005)
3. Test (T006)
4. Install (T007)
5. Verify (T008-T009)

**User Story 2 (Services)**:
- Sample service (T010-T011) can run in parallel with other services
- Basket (T012-T015), Rental (T016-T019), Fulfillment (T020-T023) can run in parallel once SDK installed
- Within each service: Update POM → Build → Generate metadata → Verify

**User Story 3 (Docker)**:
- All three services (T024-T032) can be updated in parallel
- Within each service: Update build stage → Update runtime stage → Test build (optional)

**Phase 5 (Documentation)**:
- Documentation searches (T033, T040) first
- All documentation updates (T034-T039, T042) can run in parallel
- Template update (T041) independent
- CLI verification (T043) after T041

### Parallel Opportunities

**High parallelization**:
- Phase 1: T001, T002, T003 all parallel (different checks)
- Phase 3: T010 (sample), T012-T015 (basket), T016-T019 (rental), T020-T023 (fulfillment) all parallel
- Phase 4: T024-T026 (basket), T027-T029 (rental), T030-T032 (fulfillment) all parallel
- Phase 5: T034-T039, T042 all parallel (different files)

**Sequential**:
- Phase 2 is sequential within SDK (build → test → install → verify)
- Within each service in Phase 3: POM update → build → metadata gen → verify

---

## Parallel Example: User Story 2 (After SDK Complete)

```bash
# All services can be upgraded in parallel:
Terminal 1: "Update sample-service POM and build"
Terminal 2: "Update basket-service POM, build, generate metadata"
Terminal 3: "Update rental-service POM, build, generate metadata"
Terminal 4: "Update fulfillment-service POM, build, generate metadata"
```

---

## Parallel Example: User Story 3

```bash
# All Dockerfiles can be updated in parallel:
Terminal 1: "Update basket-service Dockerfile (both stages)"
Terminal 2: "Update rental-service Dockerfile (both stages)"
Terminal 3: "Update fulfillment-service Dockerfile (both stages)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 - SDK upgrade (T004-T009)
3. **STOP and VALIDATE**: SDK builds with Java 21, all tests pass
4. Deploy SDK artifact (if shared)

**Result**: SDK ready for Java 21, can be used as dependency

### Incremental Delivery

1. Complete Setup → Baseline established
2. Complete User Story 1 → SDK on Java 21 (MVP!)
3. Complete User Story 2 → All services on Java 21, metadata generation works
4. Complete User Story 3 → Docker images on Java 21, containers deployable
5. Complete Phase 5 → Documentation current, CLI generates Java 21 projects

Each phase adds value and can be committed/deployed independently.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 1 together** (quick - 3 checks)
2. **One developer completes Phase 2** (SDK is sequential, ~30 min)
3. **Once SDK installed, parallelize Phase 3**:
   - Developer A: Sample service (T010-T011)
   - Developer B: Basket service (T012-T015)
   - Developer C: Rental service (T016-T019)
   - Developer D: Fulfillment service (T020-T023)
4. **Parallelize Phase 4** (Dockerfiles):
   - Developer A: Basket Dockerfile (T024-T026)
   - Developer B: Rental Dockerfile (T027-T029)
   - Developer C: Fulfillment Dockerfile (T030-T032)
5. **Parallelize Phase 5** (Documentation):
   - All developers pick documentation files (T034-T039)

---

## Summary

**Total Tasks**: 43 tasks
- Phase 1 (Setup): 3 tasks
- Phase 2 (User Story 1 - SDK): 6 tasks
- Phase 3 (User Story 2 - Services): 14 tasks
- Phase 4 (User Story 3 - Docker): 9 tasks
- Phase 5 (Documentation & Templates): 11 tasks

**Estimated Time** (single developer):
- Phase 1: 5 minutes
- Phase 2: 30 minutes (build + test)
- Phase 3: 60 minutes (4 services × 15 min each)
- Phase 4: 30 minutes (3 Dockerfiles + optional builds)
- Phase 5: 30 minutes (documentation search + updates)
- **Total**: ~2.5 hours

**With Parallel Execution** (4 developers after Phase 2):
- Phase 1: 5 minutes (sequential)
- Phase 2: 30 minutes (sequential - one developer)
- Phase 3: 15 minutes (parallel - all services at once)
- Phase 4: 10 minutes (parallel - all Dockerfiles at once)
- Phase 5: 10 minutes (parallel - split documentation)
- **Total**: ~1 hour

**Critical Path**: Phase 1 → Phase 2 (SDK) → Phase 3 (services depend on SDK)

**Risk Level**: LOW - Straightforward version upgrade, no code changes expected

---

## Notes

- All tasks marked [P] can run in parallel (different files, no dependencies)
- [US1], [US2], [US3] map to user stories from spec.md
- Each user story is independently testable
- SDK MUST complete before services (dependency relationship)
- Services and Dockerfiles can proceed in parallel once SDK complete
- Documentation can be updated anytime after code changes
- No new tests needed - existing tests validate backward compatibility
- Verify tests still pass at each checkpoint
- Commit after each logical group (per user story or per service)
