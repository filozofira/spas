# Implementation Plan: SPAS Sidecar Component

**Branch**: `007-spas-sidecar` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-spas-sidecar/spec.md`

## Summary

Productionize the SPAS Sidecar from the existing prototype at `prototypes/spas-sidecar-prototype/`. The sidecar mediates all service communication in SPAS domains - handling event publishing, subscription, command invocation, and distributed tracing. This implementation refactors the prototype into a maintainable, tested component with proper TypeScript types, modular architecture, and comprehensive test coverage.

## Technical Context

**Language/Version**: Node.js 20+, TypeScript 5.3  
**Primary Dependencies**: express, redis, node-fetch, uuid, jsonata (from prototype)  
**Storage**: Redis Streams (message broker)  
**Testing**: Jest 29.7 with ESM support (consistent with spas-compose)  
**Target Platform**: Docker container (OCI), deployed via docker-compose  
**Project Type**: Single component (sidecar service)  
**Performance Goals**: <100ms publish latency, <200ms subscription latency, <500ms command round-trip  
**Constraints**: Startup <5s, health endpoints <50ms response  
**Scale/Scope**: Pairs 1:1 with each service instance in domain

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| II. No Direct Service-to-Service | ✅ ENABLES | Sidecar is the mechanism that enforces this principle |
| III. Event-First Integration | ✅ ENABLES | Sidecar handles event publishing and subscription |
| IV. Convention Over Configuration | ✅ COMPLIANT | Uses `SERVICE_NAME` for identity, config from choreography |
| V. Security by Default | ✅ COMPLIANT | Propagates W3C Trace Context; mTLS deferred to Production |
| VI. Observability First | ✅ COMPLIANT | Zipkin spans, health endpoints, structured logs |
| VII. Portable Packaging | ✅ COMPLIANT | Docker container, no host dependencies |
| VIII. Adaptable Through Configuration | ✅ ENABLES | Config-driven routing and transformations |

**No violations identified.**

## Project Structure

### Documentation (this feature)

```text
specs/007-spas-sidecar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/sidecar/
├── package.json
├── tsconfig.json
├── Dockerfile
├── jest.config.js
├── README.md
├── src/
│   ├── index.ts              # Entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── config/
│   │   ├── loader.ts         # Config loading and validation
│   │   └── schema.ts         # Config schema definition
│   ├── transport/
│   │   ├── redis.ts          # Redis client wrapper
│   │   └── http.ts           # HTTP client for service invocation
│   ├── handlers/
│   │   ├── publish.ts        # POST /publish (topic from x-event-type)
│   │   ├── invoke.ts         # POST /invoke/{command}
│   │   └── health.ts         # GET /health, GET /ready
│   ├── services/
│   │   ├── event-publisher.ts
│   │   ├── event-subscriber.ts
│   │   ├── command-invoker.ts
│   │   └── tracer.ts         # Zipkin span emission
│   └── cloudevents/
│       └── wrapper.ts        # CloudEvents 1.0 envelope
└── test/
    └── unit/
        ├── config/
        ├── handlers/
        ├── services/
        └── cloudevents/
```

**Structure Decision**: Single component structure following spas-compose pattern. TypeScript with ESM modules, Jest for testing, modular service architecture.

## Complexity Tracking

> No constitution violations requiring justification.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Design Validation |
|-----------|--------|-------------------|
| II. No Direct Service-to-Service | ✅ | Sidecar intercepts all traffic; config enforces topic routing |
| III. Event-First Integration | ✅ | Redis Streams for events; commands explicitly configured |
| IV. Convention Over Configuration | ✅ | SERVICE_NAME drives hostname; config from mounted files |
| V. Security by Default | ✅ | W3C Trace Context propagated; identity in CloudEvents |
| VI. Observability First | ✅ | Zipkin spans with parent-child; /health + /ready endpoints |
| VII. Portable Packaging | ✅ | Dockerfile provided; no host dependencies |
| VIII. Adaptable Through Configuration | ✅ | config.json drives all routing and transforms |

**Gate passed. Ready for Phase 2 task generation.**
