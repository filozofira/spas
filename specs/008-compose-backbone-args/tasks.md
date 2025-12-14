# Tasks: Compose Deploy Backbone Arguments

**Feature**: 008-compose-backbone-args  
**Input**: Design documents from `/specs/008-compose-backbone-args/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add backbone types and prepare infrastructure

- [x] T001 Add BackboneConfig types in components/cli/spas-compose/src/types.ts
- [x] T002 [P] Create BackboneNormalizer service in components/cli/spas-compose/src/services/backbone-normalizer.ts

---

## Phase 2: User Story 1 - Deploy with Default Backbones (Priority: P1) 🎯 MVP

**Goal**: Zero-config deployment with Redis 7-alpine and Zipkin latest by default, including health checks

**Independent Test**: Run `spas-compose choreography deploy --docker` and verify docker-compose.yaml includes default backbones with correct configuration

### Tests for User Story 1

- [x] T003 [P] [US1] Unit tests for BackboneNormalizer in components/cli/spas-compose/test/unit/services/backbone-normalizer.test.ts

### Implementation for User Story 1

- [x] T004 [US1] Implement normalizeImage() for default values in backbone-normalizer.ts
- [x] T005 [US1] Implement buildConfig() with defaults in backbone-normalizer.ts
- [x] T006 [US1] Update generateRedis() to accept BackboneConfig and add health check in docker-generator.ts
- [x] T007 [US1] Update generateZipkin() to accept BackboneConfig in docker-generator.ts
- [x] T008 [US1] Update generate() to use BackboneConfig in docker-generator.ts
- [x] T009 [US1] Update generateSidecar() to use backbone service names for env vars in docker-generator.ts

**Checkpoint**: Default backbones working with health checks ✅

---

## Phase 3: User Story 2 - Customize Event Backbone (Priority: P2)

**Goal**: Allow custom Redis image via `--event-backbone` argument

**Independent Test**: Run `spas-compose choreography deploy --docker --event-backbone redis:6.2` and verify custom image in output

### Tests for User Story 2

- [ ] T010 [P] [US2] Add event backbone normalization tests in backbone-normalizer.test.ts
- [ ] T011 [P] [US2] Add image validation tests in backbone-normalizer.test.ts

### Implementation for User Story 2

- [ ] T012 [US2] Implement validateImageFormat() in backbone-normalizer.ts
- [ ] T013 [US2] Add --event-backbone option to deploy command in choreography-deploy.ts
- [ ] T014 [US2] Wire event-backbone option to DockerGenerator in choreography-deploy.ts
- [ ] T015 [US2] Add validation error handling for invalid image format in choreography-deploy.ts

**Checkpoint**: Custom Redis images working

---

## Phase 4: User Story 3 - Customize Observability Backbone (Priority: P2)

**Goal**: Allow custom Zipkin/Jaeger image via `--observability-backbone` argument with automatic port configuration

**Independent Test**: Run `spas-compose choreography deploy --docker --observability-backbone jaeger:latest` and verify Jaeger ports (16686, 9411)

### Tests for User Story 3

- [ ] T016 [P] [US3] Add observability normalization tests (zipkin shorthand) in backbone-normalizer.test.ts
- [ ] T017 [P] [US3] Add Jaeger detection and normalization tests in backbone-normalizer.test.ts

### Implementation for User Story 3

- [ ] T018 [US3] Implement detectObservabilityType() in backbone-normalizer.ts
- [ ] T019 [US3] Add --observability-backbone option to deploy command in choreography-deploy.ts
- [ ] T020 [US3] Update generateZipkin() to handle Jaeger ports in docker-generator.ts
- [ ] T021 [US3] Wire observability-backbone option to DockerGenerator in choreography-deploy.ts

**Checkpoint**: Custom Zipkin/Jaeger images working with correct ports

---

## Phase 5: User Story 4 - Disable Backbone Services (Priority: P3)

**Goal**: Support `none` value to disable backbone provisioning for BYO infrastructure

**Independent Test**: Run `spas-compose choreography deploy --docker --event-backbone none` and verify no Redis service, sidecar uses env var substitution

### Tests for User Story 4

- [ ] T022 [P] [US4] Add backbone disable tests (none value) in backbone-normalizer.test.ts
- [ ] T023 [P] [US4] Add sidecar env var substitution tests in docker-generator.test.ts

### Implementation for User Story 4

- [ ] T024 [US4] Handle 'none' value in buildConfig() to set enabled=false in backbone-normalizer.ts
- [ ] T025 [US4] Update generate() to skip disabled backbones in docker-generator.ts
- [ ] T026 [US4] Update generateSidecar() to use env var substitution when backbone disabled in docker-generator.ts
- [ ] T027 [US4] Add warning output when backbone disabled in choreography-deploy.ts

**Checkpoint**: BYO infrastructure scenario working

---

## Phase 6: Polish & Integration

**Purpose**: Final integration, documentation, and cleanup

- [ ] T028 Update dry-run output to show backbone configuration in choreography-deploy.ts
- [ ] T029 [P] Update existing docker-generator tests for new API in docker-generator.test.ts
- [ ] T030 [P] Update README.md with --event-backbone and --observability-backbone documentation

---

## Dependencies

```
Phase 1 (Setup)
    │
    ├── T001 (types) ──────────┐
    │                          │
    └── T002 (normalizer) ─────┼──► Phase 2 (US1 - Defaults)
                               │        │
                               │        ├── T004-T005 (normalizer impl)
                               │        │
                               │        └── T006-T009 (generator impl)
                               │                │
                               │                ▼
                               │        Phase 3 (US2 - Event Backbone)
                               │                │
                               │                ▼
                               │        Phase 4 (US3 - Observability Backbone)
                               │                │
                               │                ▼
                               │        Phase 5 (US4 - Disable Backbones)
                               │                │
                               │                ▼
                               └──────► Phase 6 (Polish)
```

## Parallel Execution Opportunities

Within each phase, tasks marked with `[P]` can run in parallel:

- **Phase 1**: T001 and T002 are sequential (T002 depends on types)
- **Phase 2**: T003 can run parallel with T004-T005
- **Phase 3**: T010, T011 can run parallel; T016, T017 can run parallel
- **Phase 4**: T016, T017 can run parallel
- **Phase 5**: T022, T023 can run parallel
- **Phase 6**: T029, T030 can run parallel

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 30 |
| Setup Phase | 2 |
| US1 (Defaults) | 7 |
| US2 (Event Backbone) | 6 |
| US3 (Observability) | 6 |
| US4 (Disable) | 6 |
| Polish Phase | 3 |
| Parallelizable | 11 |

**MVP Scope**: Phases 1-2 (T001-T009) deliver default backbones with health checks.
