# Tasks: Java SPAS SDK

**Input**: Design documents from `/specs/016-java-spas-sdk/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Unit tests are included per Constitution SDK Quality Gates (≥80% coverage required).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Convention

```
components/sdk/java/           # Multi-module Maven project root
├── spas-sdk-core/            # Core module
├── spas-sdk-metadata/        # Metadata module
├── spas-sdk-metadata-processor/  # Annotation processor module
├── spas-sdk-events/          # Events module
├── spas-sdk-spring/          # Spring integration module
└── examples/sample-service/  # Reference implementation
```

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and Maven multi-module structure

- [x] T001 Create parent pom.xml with Java 17, Maven 3.8+ in components/sdk/java/pom.xml
- [x] T002 [P] Create spas-sdk-core module skeleton in components/sdk/java/spas-sdk-core/pom.xml
- [x] T003 [P] Create spas-sdk-metadata module skeleton in components/sdk/java/spas-sdk-metadata/pom.xml
- [x] T004 [P] Create spas-sdk-metadata-processor module skeleton in components/sdk/java/spas-sdk-metadata-processor/pom.xml
- [x] T005 [P] Create spas-sdk-events module skeleton in components/sdk/java/spas-sdk-events/pom.xml
- [x] T006 [P] Create spas-sdk-spring module skeleton in components/sdk/java/spas-sdk-spring/pom.xml
- [x] T007 [P] Create sample-service module skeleton in components/sdk/java/examples/sample-service/pom.xml
- [x] T008 Create SDK README.md (framework-agnostic note, module overview) in components/sdk/java/README.md
- [x] T009 Verify multi-module build with `mvn clean compile` from components/sdk/java/

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 [P] Implement KebabCaseConverter utility in components/sdk/java/spas-sdk-core/src/main/java/io/spas/sdk/core/util/KebabCaseConverter.java
- [x] T011 [P] Create SpasConfigurationException in components/sdk/java/spas-sdk-core/src/main/java/io/spas/sdk/core/config/SpasConfigurationException.java
- [x] T012 [P] Implement SpasConfiguration (env vars: SERVICE_NAME, SIDECAR_URL, SIDECAR_HOST, SIDECAR_PORT) in components/sdk/java/spas-sdk-core/src/main/java/io/spas/sdk/core/config/SpasConfiguration.java
- [x] T013 [P] Add unit tests for KebabCaseConverter in components/sdk/java/spas-sdk-core/src/test/java/io/spas/sdk/core/util/KebabCaseConverterTest.java
- [x] T014 [P] Add unit tests for SpasConfiguration in components/sdk/java/spas-sdk-core/src/test/java/io/spas/sdk/core/config/SpasConfigurationTest.java

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - Metadata Generation with Annotations (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Generate valid `spas.json` at compile time from annotations

**Independent Test**: Run `mvn compile` on sample-service, verify `target/classes/spas.json` validates against schema

### Model Classes for US1

- [x] T015 [P] [US1] Create EndpointType enum in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/EndpointType.java
- [x] T016 [P] [US1] Create Protocol enum in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/Protocol.java
- [x] T017 [P] [US1] Create ConsistencyLevel enum in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/ConsistencyLevel.java
- [x] T018 [P] [US1] Create QueryConsistencyLevel enum in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/QueryConsistencyLevel.java
- [x] T019 [P] [US1] Create AuthType enum in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/AuthType.java
- [x] T020 [P] [US1] Create DataClassification enum in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/DataClassification.java
- [x] T021 [P] [US1] Create EndpointContract record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/EndpointContract.java
- [x] T022 [P] [US1] Create EventContract record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/EventContract.java
- [x] T023 [P] [US1] Create Consistency record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/Consistency.java
- [x] T024 [P] [US1] Create Authentication record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/Authentication.java
- [x] T025 [P] [US1] Create Security record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/Security.java
- [x] T026 [P] [US1] Create Network record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/Network.java
- [x] T027 [US1] Create ServiceMetadata record in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/model/ServiceMetadata.java

### Annotations for US1

- [x] T028 [P] [US1] Create @SpasCommand annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasCommand.java
- [x] T029 [P] [US1] Create @SpasQuery annotation in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasQuery.java
- [x] T030 [P] [US1] Create @SpasEvent annotation (RUNTIME retention) in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasEvent.java
- [x] T031 [P] [US1] Create @SpasService annotation for service identity config in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasService.java

### Annotation Processor for US1

- [x] T032 [US1] Implement SpasAnnotationProcessor in components/sdk/java/spas-sdk-metadata-processor/src/main/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessor.java
- [x] T033 [US1] Create processor registration file in components/sdk/java/spas-sdk-metadata-processor/src/main/resources/META-INF/services/javax.annotation.processing.Processor
- [x] T034 [US1] Add processor tests with compile-testing library in components/sdk/java/spas-sdk-metadata-processor/src/test/java/io/spas/sdk/metadata/processor/SpasAnnotationProcessorTest.java

### Unit Tests for US1

- [x] T035 [P] [US1] Add unit tests for model record serialization in components/sdk/java/spas-sdk-metadata/src/test/java/io/spas/sdk/metadata/model/ServiceMetadataTest.java

**Checkpoint**: Annotation-based metadata generation working. Run `mvn compile` to generate spas.json.

---

## Phase 4: User Story 2 - Event Publishing to Sidecar (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Publish events to sidecar with correct headers (traceparent, x-service-name, x-event-name, x-correlation-id)

**Independent Test**: Mock sidecar with WireMock, publish event, verify headers

### Context Classes for US2

- [x] T036 [P] [US2] Implement SpasTrace (ThreadLocal, W3C Trace Context) in components/sdk/java/spas-sdk-core/src/main/java/io/spas/sdk/core/context/SpasTrace.java
- [x] T037 [P] [US2] Implement SpasContext (ThreadLocal, correlationId, userId, tenantId) in components/sdk/java/spas-sdk-core/src/main/java/io/spas/sdk/core/context/SpasContext.java

### Event Publishing for US2

- [x] T038 [P] [US2] Create SpasPublishException in components/sdk/java/spas-sdk-events/src/main/java/io/spas/sdk/events/SpasPublishException.java
- [x] T039 [P] [US2] Create SidecarUnavailableException in components/sdk/java/spas-sdk-events/src/main/java/io/spas/sdk/events/SidecarUnavailableException.java
- [x] T040 [P] [US2] Create EventAnnotationMissingException in components/sdk/java/spas-sdk-events/src/main/java/io/spas/sdk/events/EventAnnotationMissingException.java
- [x] T041 [P] [US2] Create EventPublisherConfig in components/sdk/java/spas-sdk-events/src/main/java/io/spas/sdk/events/EventPublisherConfig.java
- [x] T042 [US2] Implement SidecarClient (HttpClient wrapper) in components/sdk/java/spas-sdk-events/src/main/java/io/spas/sdk/events/SidecarClient.java
- [x] T043 [US2] Implement EventPublisher in components/sdk/java/spas-sdk-events/src/main/java/io/spas/sdk/events/EventPublisher.java

### Unit Tests for US2

- [x] T044 [P] [US2] Add unit tests for SpasTrace in components/sdk/java/spas-sdk-core/src/test/java/io/spas/sdk/core/context/SpasTraceTest.java
- [x] T045 [P] [US2] Add unit tests for SpasContext in components/sdk/java/spas-sdk-core/src/test/java/io/spas/sdk/core/context/SpasContextTest.java
- [x] T046 [US2] Add unit tests for EventPublisher with WireMock in components/sdk/java/spas-sdk-events/src/test/java/io/spas/sdk/events/EventPublisherTest.java

**Checkpoint**: Event publishing to sidecar working. MVP complete (US1 + US2). ✅

---

## Phase 5: User Story 3 - Fluent Builders for Metadata Composition (Priority: P2)

**Goal**: Provide fluent builder APIs for programmatic metadata composition

**Independent Test**: Use builders to construct metadata, verify JSON output matches schema

### Builders for US3

- [X] T047 [P] [US3] Implement ServiceIdentityBuilder in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilder.java
- [X] T048 [P] [US3] Implement SecurityBuilder in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/SecurityBuilder.java
- [X] T049 [P] [US3] Implement ConsistencyBuilder in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ConsistencyBuilder.java
- [X] T050 [P] [US3] Implement NetworkBuilder in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/NetworkBuilder.java
- [X] T051 [US3] Implement MetadataComposer in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/composer/MetadataComposer.java

### Unit Tests for US3

- [X] T052 [P] [US3] Add unit tests for ServiceIdentityBuilder in components/sdk/java/spas-sdk-metadata/src/test/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilderTest.java
- [X] T053 [P] [US3] Add unit tests for SecurityBuilder in components/sdk/java/spas-sdk-metadata/src/test/java/io/spas/sdk/metadata/builders/SecurityBuilderTest.java
- [X] T054 [P] [US3] Add unit tests for ConsistencyBuilder in components/sdk/java/spas-sdk-metadata/src/test/java/io/spas/sdk/metadata/builders/ConsistencyBuilderTest.java
- [X] T055 [P] [US3] Add unit tests for NetworkBuilder in components/sdk/java/spas-sdk-metadata/src/test/java/io/spas/sdk/metadata/builders/NetworkBuilderTest.java
- [X] T056 [US3] Add unit tests for MetadataComposer in components/sdk/java/spas-sdk-metadata/src/test/java/io/spas/sdk/metadata/composer/MetadataComposerTest.java

**Checkpoint**: Fluent builders working. Programmatic metadata composition available. ✅

---

## Phase 6: User Story 4 - Trace Context Propagation (Priority: P2)

**Goal**: Extract W3C Trace Context from incoming requests, propagate to outgoing events

**Independent Test**: Simulate request with traceparent header, verify SpasTrace.current() populated

### Spring Integration for US4

- [ ] T057 [P] [US4] Create SpasProperties configuration class in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasProperties.java
- [ ] T058 [US4] Implement SpasContextFilter (extracts traceparent, correlation-id) in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasContextFilter.java
- [ ] T059 [US4] Create SpasAutoConfiguration in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasAutoConfiguration.java
- [ ] T060 [US4] Create Spring Boot auto-configuration registration in components/sdk/java/spas-sdk-spring/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
- [ ] T061 [P] [US4] Create @EnableSpas annotation in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/EnableSpas.java

### Unit Tests for US4

- [ ] T062 [US4] Add unit tests for SpasContextFilter in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasContextFilterTest.java

**Checkpoint**: Trace context propagation working via Spring filter.

---

## Phase 7: User Story 5 - Identity Context Propagation (Priority: P3)

**Goal**: Extract user/tenant identity from headers, propagate to outgoing events

**Independent Test**: Simulate request with x-user-id/x-tenant-id, verify SpasContext populated

### Implementation for US5

- [ ] T063 [US5] Extend SpasContextFilter to extract x-user-id, x-tenant-id headers in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasContextFilter.java
- [ ] T064 [US5] Add identity header propagation tests in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasContextFilterTest.java

**Checkpoint**: Identity context propagation working.

---

## Phase 8: User Story 6 - SampleService Reference Implementation (Priority: P3)

**Goal**: Complete working example demonstrating all SDK features

**Independent Test**: Build sample-service, verify spas.json generated, POST creates event

### Sample Service Implementation

- [ ] T065 [P] [US6] Create SampleServiceApplication in components/sdk/java/examples/sample-service/src/main/java/io/spas/examples/orders/SampleServiceApplication.java
- [ ] T066 [P] [US6] Create OrderCreatedEvent in components/sdk/java/examples/sample-service/src/main/java/io/spas/examples/orders/events/OrderCreatedEvent.java
- [ ] T067 [P] [US6] Create CreateOrderRequest in components/sdk/java/examples/sample-service/src/main/java/io/spas/examples/orders/api/CreateOrderRequest.java
- [ ] T068 [P] [US6] Create OrderResponse in components/sdk/java/examples/sample-service/src/main/java/io/spas/examples/orders/api/OrderResponse.java
- [ ] T069 [US6] Create OrderController with @SpasCommand/@SpasQuery in components/sdk/java/examples/sample-service/src/main/java/io/spas/examples/orders/api/OrderController.java
- [ ] T070 [US6] Create application.yml with spas config in components/sdk/java/examples/sample-service/src/main/resources/application.yml
- [ ] T071 [US6] Validate sample-service generates valid spas.json on compile

**Checkpoint**: SampleService complete. Reference implementation ready.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and cleanup

- [ ] T072 [P] Ensure README documents framework-agnostic design in components/sdk/java/README.md
- [ ] T073 [P] Add Jackson configuration for kebab-case output in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/JacksonConfiguration.java
- [ ] T074 Run `mvn test` from components/sdk/java/ and verify all tests pass
- [ ] T075 Run `mvn verify` to check code coverage meets 80% threshold
- [ ] T076 Validate quickstart.md instructions work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ────────────────────────────────────────────────────────►
                 │
                 ▼
Phase 2 (Foundational) ─────────────────────────────────────────────────►
                 │ BLOCKS ALL USER STORIES
                 ▼
    ┌────────────┴────────────┬─────────────────┐
    ▼                         ▼                 ▼
Phase 3 (US1)           Phase 4 (US2)     [Can parallelize]
    │                         │
    └──────────┬──────────────┘
               ▼ MVP COMPLETE
    ┌──────────┴──────────────┬─────────────────┐
    ▼                         ▼                 ▼
Phase 5 (US3)           Phase 6 (US4)     Phase 7 (US5)
    │                         │                 │
    └──────────┬──────────────┴─────────────────┘
               ▼
Phase 8 (US6) ─────────► requires US1-US5 complete
               │
               ▼
Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|---------------------|
| US1 (Metadata Generation) | Phase 2 | US2 |
| US2 (Event Publishing) | Phase 2 | US1 |
| US3 (Fluent Builders) | Phase 2 | US4, US5 |
| US4 (Trace Propagation) | Phase 2 | US3, US5 |
| US5 (Identity Context) | US4 (extends filter) | US3 |
| US6 (SampleService) | US1, US2, US4, US5 | None |

### Parallel Opportunities

**Within Phase 1 (Setup)**:
```
T002, T003, T004, T005, T006, T007 can all run in parallel
```

**Within Phase 3 (US1 Models)**:
```
T015-T026 can all run in parallel (different enum/record files)
```

**Within Phase 4 (US2)**:
```
T036, T037 (context classes) can run in parallel
T038, T039, T040, T041 (exceptions/config) can run in parallel
```

**Within Phase 5 (US3)**:
```
T047, T048, T049, T050 (builders) can run in parallel
T052, T053, T054, T055 (builder tests) can run in parallel
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T014)
3. Complete Phase 3: US1 Metadata Generation (T015-T035)
4. Complete Phase 4: US2 Event Publishing (T036-T046)
5. **STOP and VALIDATE**: Test metadata generation + event publishing
6. Deploy/demo if ready - **MVP Complete!**

### Incremental Delivery

| Increment | User Stories | Capability Added |
|-----------|--------------|------------------|
| MVP | US1 + US2 | Metadata generation + Event publishing |
| +1 | US3 | Fluent builders for programmatic config |
| +2 | US4 | Trace context propagation |
| +3 | US5 | Identity context propagation |
| +4 | US6 | Reference implementation |

### Task Counts by Phase

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| Phase 1: Setup | 9 | 6 |
| Phase 2: Foundational | 5 | 4 |
| Phase 3: US1 | 21 | 17 |
| Phase 4: US2 | 11 | 8 |
| Phase 5: US3 | 10 | 8 |
| Phase 6: US4 | 6 | 2 |
| Phase 7: US5 | 2 | 0 |
| Phase 8: US6 | 7 | 4 |
| Phase 9: Polish | 5 | 2 |
| **Total** | **76** | **51** |

---

## Notes

- All [P] tasks can run in parallel (different files, no dependencies)
- [Story] labels (US1-US6) map tasks to user stories for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Framework-agnostic**: Core modules work without Spring; spas-sdk-spring is optional
