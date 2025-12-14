# Tasks: SPAS Sidecar Component

**Input**: Design documents from `/specs/007-spas-sidecar/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## User Stories (from spec.md)

| # | Story | Priority | Description |
|---|-------|----------|-------------|
| US1 | Configuration Loading | P1 | Load and validate config from mounted JSON files |
| US2 | Event Publishing | P1 | `POST /publish` with topic routing from `x-event-type` header |
| US3 | Event Subscription | P1 | Redis subscription → service HTTP delivery |
| US4 | Command Invocation | P1 | `/invoke/{command}` request-response pattern |
| US5 | Distributed Tracing | P2 | Zipkin span reporting with parent-child relationships |
| US6 | Health & Readiness | P3 | `/health` and `/ready` for orchestration |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure at `components/sidecar/` per plan.md
- [X] T002 Initialize Node.js project with package.json at `components/sidecar/package.json`
- [X] T003 [P] Configure TypeScript with tsconfig.json at `components/sidecar/tsconfig.json`
- [X] T004 [P] Configure Jest with ESM support at `components/sidecar/jest.config.cjs`
- [X] T005 [P] Create Dockerfile at `components/sidecar/Dockerfile`
- [X] T006 [P] Create README.md at `components/sidecar/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create TypeScript interfaces at `components/sidecar/src/types.ts` (SidecarConfig, InboundEntry, OutboundEntry, CloudEvent, ZipkinSpan, HealthResponse)
- [X] T008 [P] Implement Redis client wrapper at `components/sidecar/src/transport/redis.ts` with connect, disconnect, XADD, XREAD
- [X] T009 [P] Implement HTTP client wrapper at `components/sidecar/src/transport/http.ts` for service invocation
- [X] T010 [P] Implement CloudEvents wrapper at `components/sidecar/src/cloudevents/wrapper.ts` (wrapCloudEvent function)
- [X] T011 Implement W3C traceparent parsing utility at `components/sidecar/src/utils/traceparent.ts`
- [X] T012 Create Express app bootstrap at `components/sidecar/src/index.ts` with route registration

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configuration Loading (Priority: P1) 🎯 MVP

**Goal**: Load and validate configuration from mounted JSON files on startup

**Independent Test**: Mount `config.json` file with inbound/outbound entries; verify sidecar loads and validates configuration on startup.

### Implementation for User Story 1

- [X] T013 [US1] Implement config schema validation at `components/sidecar/src/config/schema.ts` with Zod or manual validation
- [X] T014 [US1] Implement config loader at `components/sidecar/src/config/loader.ts` (loadConfig, validateConfig functions)
- [X] T015 [US1] Add legacy config migration support in `components/sidecar/src/config/loader.ts` (subscriptions→inbound, publications→outbound)
- [X] T016 [P] [US1] Create unit tests at `components/sidecar/test/unit/config/loader.test.ts` (valid config, invalid config, legacy migration)
- [X] T017 [P] [US1] Create unit tests at `components/sidecar/test/unit/config/schema.test.ts` (validation rules)

**Checkpoint**: User Story 1 complete - sidecar can load and validate configuration

---

## Phase 4: User Story 2 - Event Publishing (Priority: P1)

**Goal**: Expose `POST /publish` endpoint that resolves topic from `x-event-type` header and publishes CloudEvents to Redis

**Independent Test**: POST to `/publish` with headers; verify message appears in Redis stream with CloudEvents wrapper.

**Depends on**: US1 (requires outbound routing configuration)

### Implementation for User Story 2

- [ ] T018 [US2] Implement topic routing lookup at `components/sidecar/src/services/topic-router.ts` (resolveTopicFromEventType function)
- [ ] T019 [US2] Implement event publisher service at `components/sidecar/src/services/event-publisher.ts` (publish function with transform, wrap, XADD)
- [ ] T020 [US2] Implement publish handler at `components/sidecar/src/handlers/publish.ts` (POST /publish endpoint, header extraction, validation)
- [ ] T021 [P] [US2] Create unit tests at `components/sidecar/test/unit/services/topic-router.test.ts` (routing lookup, missing route)
- [ ] T022 [P] [US2] Create unit tests at `components/sidecar/test/unit/services/event-publisher.test.ts` (CloudEvents wrapping, Redis publish)
- [ ] T023 [P] [US2] Create unit tests at `components/sidecar/test/unit/handlers/publish.test.ts` (header validation, 202/400 responses)

**Checkpoint**: User Story 2 complete - services can publish events through sidecar

---

## Phase 5: User Story 3 - Event Subscription & Service Invocation (Priority: P1)

**Goal**: Subscribe to Redis topics, consume events, transform, and invoke service HTTP endpoints

**Independent Test**: Publish event to Redis stream; verify sidecar consumes, transforms, and invokes configured service endpoint.

**Depends on**: US1 (requires inbound configuration with kind: event)

### Implementation for User Story 3

- [ ] T024 [US3] Implement event subscriber service at `components/sidecar/src/services/event-subscriber.ts` (XREAD loop, CloudEvent extraction)
- [ ] T025 [US3] Implement service invoker at `components/sidecar/src/services/service-invoker.ts` (HTTP POST to invokeEndpoint with headers)
- [ ] T026 [US3] Implement transformation executor at `components/sidecar/src/services/transformer.ts` (apply inbound/outbound transforms)
- [ ] T027 [US3] Wire subscriber to startup in `components/sidecar/src/index.ts` (start subscription loop after config load)
- [ ] T028 [P] [US3] Create unit tests at `components/sidecar/test/unit/services/event-subscriber.test.ts` (CloudEvent parsing, error handling)
- [ ] T029 [P] [US3] Create unit tests at `components/sidecar/test/unit/services/service-invoker.test.ts` (header propagation, error responses)
- [ ] T030 [P] [US3] Create unit tests at `components/sidecar/test/unit/services/transformer.test.ts` (transform application)

**Checkpoint**: User Story 3 complete - sidecar can consume events and invoke services

---

## Phase 6: User Story 4 - Command Invocation (Priority: P1)

**Goal**: Expose `POST /invoke/{command}` endpoint for synchronous request-response patterns

**Independent Test**: POST to `/invoke/create-order`; verify sidecar transforms, invokes service, and returns response.

**Depends on**: US1 (requires inbound configuration with kind: command)

### Implementation for User Story 4

- [ ] T031 [US4] Implement command invoker service at `components/sidecar/src/services/command-invoker.ts` (lookup command config, transform, invoke, transform response)
- [ ] T032 [US4] Implement invoke handler at `components/sidecar/src/handlers/invoke.ts` (POST /invoke/:command endpoint)
- [ ] T033 [P] [US4] Create unit tests at `components/sidecar/test/unit/services/command-invoker.test.ts` (lookup, transform, invoke flow)
- [ ] T034 [P] [US4] Create unit tests at `components/sidecar/test/unit/handlers/invoke.test.ts` (200/404/502 responses)

**Checkpoint**: User Story 4 complete - clients can invoke service commands through sidecar

---

## Phase 7: User Story 5 - Distributed Tracing (Priority: P2)

**Goal**: Emit Zipkin spans for all operations with parent-child relationships

**Independent Test**: Configure sidecar with ZIPKIN_URL; perform operations; verify spans appear in Zipkin.

### Implementation for User Story 5

- [ ] T035 [US5] Implement tracer service at `components/sidecar/src/services/tracer.ts` (createSpan, emitSpan, parseTraceparent, generateSpanId)
- [ ] T036 [US5] Integrate tracer into event-publisher.ts (emit span on publish)
- [ ] T037 [US5] Integrate tracer into event-subscriber.ts (emit parent-child spans: receive → transform → invoke)
- [ ] T038 [US5] Integrate tracer into command-invoker.ts (emit span on command invocation)
- [ ] T039 [US5] Add graceful degradation when ZIPKIN_URL not configured
- [ ] T040 [P] [US5] Create unit tests at `components/sidecar/test/unit/services/tracer.test.ts` (span creation, parent-child, tags)

**Checkpoint**: User Story 5 complete - all operations emit trace spans

---

## Phase 8: User Story 6 - Health & Readiness (Priority: P3)

**Goal**: Expose `/health` and `/ready` endpoints for container orchestration

**Independent Test**: Start sidecar; call endpoints; verify appropriate responses based on Redis connectivity.

### Implementation for User Story 6

- [ ] T041 [US6] Implement health handler at `components/sidecar/src/handlers/health.ts` (GET /health, GET /ready endpoints)
- [ ] T042 [US6] Add Redis connectivity check to readiness logic
- [ ] T043 [P] [US6] Create unit tests at `components/sidecar/test/unit/handlers/health.test.ts` (200/503 responses, Redis states)

**Checkpoint**: User Story 6 complete - orchestrators can manage sidecar lifecycle

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T044 [P] Add structured logging throughout all services (consistent format with trace IDs)
- [ ] T045 [P] Add comprehensive error handling in all handlers (consistent error response format)
- [ ] T046 Verify all environment variables documented in README.md (CONFIG_PATH, SERVICE_NAME, SERVICE_PORT, REDIS_HOST, REDIS_PORT, ZIPKIN_URL)
- [ ] T047 Run quickstart.md validation manually (start sidecar, verify all endpoints)
- [ ] T048 [P] Add npm scripts to package.json (build, test, start, lint)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
     ↓
Phase 2 (Foundational) ← BLOCKS all user stories
     ↓
┌────┴────┬────────┬────────┐
↓         ↓        ↓        ↓
US1      US2      US3      US4   (P1 stories - can be parallel after Phase 2)
(Config) (Pub)   (Sub)    (Cmd)
     ↓         ↓        ↓
     └────┬────┴────────┘
          ↓
         US5 (Tracing - P2)
          ↓
         US6 (Health - P3)
          ↓
      Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Run After |
|-------|------------|---------------|
| US1 (Config) | Phase 2 | Phase 2 complete |
| US2 (Publish) | US1 | US1 complete |
| US3 (Subscribe) | US1 | US1 complete |
| US4 (Command) | US1 | US1 complete |
| US5 (Tracing) | US2, US3, US4 | All P1 stories complete |
| US6 (Health) | Phase 2 | Phase 2 complete (parallel with US1) |

### Parallel Opportunities Per User Story

**Phase 2 (Foundational)**:
```
T008 (Redis client) | T009 (HTTP client) | T010 (CloudEvents) | T011 (Traceparent)
```

**User Story 1 (Config)**:
```
T016 (loader tests) | T017 (schema tests)
```

**User Story 2 (Publish)**:
```
T021 (router tests) | T022 (publisher tests) | T023 (handler tests)
```

**User Story 3 (Subscribe)**:
```
T028 (subscriber tests) | T029 (invoker tests) | T030 (transformer tests)
```

**User Story 4 (Command)**:
```
T033 (invoker tests) | T034 (handler tests)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 (Config Loading)
4. Complete Phase 4: US2 (Event Publishing)
5. Complete Phase 5: US3 (Event Subscription)
6. **STOP and VALIDATE**: Test with docker-compose - can publish and consume events

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Config) → Sidecar starts and validates config
3. Add US2 (Publish) → Services can publish events
4. Add US3 (Subscribe) → Sidecar delivers events to services
5. Add US4 (Command) → Request-response works
6. Add US5 (Tracing) → Zipkin integration
7. Add US6 (Health) → Production-ready endpoints
8. Polish → Documentation, logging, error handling

---

## Notes

- Tests are included per standard PoC practice
- Target: 30+ unit tests across all user stories
- [P] tasks = different files, can run in parallel
- Commit after each task or logical group
- Prototype at `prototypes/spas-sidecar-prototype/` provides reference implementation
- Key difference from prototype: `POST /publish` with topic from `x-event-type` header (not URL path)
