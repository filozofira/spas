# Research: SPAS Sidecar Component

**Feature**: 007-spas-sidecar  
**Date**: 2025-12-14  
**Phase**: 0 - Research

## Research Tasks

### 1. Existing Prototype Analysis

**Question**: What patterns and code can be reused from the prototype?

**Findings**:

- Prototype at `prototypes/spas-sidecar-prototype/spas-sidecar/` is ~500 lines of JavaScript
- Key reusable patterns:
  - Configuration validation with detailed error messages
  - CloudEvents 1.0 wrapper function
  - Redis Streams XREAD with blocking for subscription
  - Zipkin span emission with parent-child relationships
  - W3C traceparent parsing and propagation
  - Legacy config auto-migration

**Decision**: Refactor prototype to TypeScript with modular architecture. Preserve all patterns, improve testability.

**Alternatives Considered**:

- Start from scratch: Rejected - prototype is battle-tested with working trace correlation
- Keep as JavaScript: Rejected - TypeScript provides better maintainability and type safety

---

### 2. TypeScript + ESM Configuration

**Question**: How to configure TypeScript with ESM for Node.js 20+?

**Findings**:

- Node.js 20+ has stable ESM support
- Use `"type": "module"` in package.json
- Use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` in tsconfig.json
- Jest requires `--experimental-vm-modules` flag (same as spas-compose)

**Decision**: Follow spas-compose patterns for consistency across CLI tools.

**Reference**: `components/cli/spas-compose/tsconfig.json` and `jest.config.js`

---

### 3. Redis Client Selection

**Question**: Which Redis client for Node.js with TypeScript support?

**Findings**:

- Prototype uses `redis` (node-redis) package
- node-redis v4+ has native TypeScript support
- Supports Redis Streams with XREAD, XADD
- Async/await patterns work well

**Decision**: Continue using `redis` package (node-redis v4+).

**Alternatives Considered**:

- ioredis: More features but node-redis sufficient for PoC scope

---

### 4. Transformation Strategy

**Question**: How to handle JSONata transformations?

**Findings**:

- Prototype uses JavaScript functions in transform.js
- Spec mentions JSONata for future; prototype uses function names
- spas-compose generates config with transform file paths

**Decision**: For PoC, continue using JavaScript function approach from prototype. Support both:

1. Inline function names (prototype compatibility)
2. File paths to .jsonata files (future, deferred)

**Rationale**: Maintain prototype compatibility; JSONata file loading is enhancement for future.

---

### 5. Publish Endpoint Design

**Question**: Should topic be in URL path or resolved from configuration?

**Findings**:

- Prototype uses `/publish/{topic}` with topic in URL path
- .NET SDK uses `POST /publish` with `x-event-type` header for topic routing
- SDK explicitly states: "Topic routing is configured in the sidecar, not the service"
- SDK approach decouples services from infrastructure (topic names)

**Decision**: Align with SDK approach - `POST /publish` with topic resolved from `x-event-type` header.

**Rationale**:

1. Services remain decoupled from infrastructure concerns (topic names)
2. Topic routing can change without modifying services
3. SDK is the authoritative contract for service developers
4. Sidecar outbound config maps `eventType` → `topic`

**Breaking Change**: Prototype will need updating to match this contract.

---

### 6. Testing Strategy

**Question**: How to test sidecar without full infrastructure?

**Findings**:

- Unit tests: Mock Redis client, mock HTTP fetch
- Integration tests: Use Redis test container (optional for PoC)
- Constitution allows deferring integration tests in PoC

**Decision**: Focus on comprehensive unit tests with mocks. Structure code for testability.

**Test Coverage Targets**:

- Config validation: All error paths
- CloudEvents wrapper: All fields populated correctly
- Handlers: Success and error responses
- Tracer: Span emission with correct parent-child relationships

---

### 7. Health Check Patterns

**Question**: How to implement health and readiness checks?

**Findings**:

- `/health` - liveness: Is process running? (always 200 if responding)
- `/ready` - readiness: Is Redis connected? (200 only when connected)
- Kubernetes uses these for pod lifecycle management
- Docker Compose HEALTHCHECK can use these

**Decision**: Implement both endpoints per spec:

- `GET /health` → 200 `{ "status": "ok" }`
- `GET /ready` → 200 `{ "status": "ready" }` or 503 `{ "status": "not ready", "reason": "Redis disconnected" }`

---

### 8. Error Handling Patterns

**Question**: How to handle service invocation failures?

**Findings**:

- Prototype logs errors and continues processing
- At-least-once semantics mean message can be redelivered
- Zipkin error spans should be emitted

**Decision**: Log errors, emit error spans, continue processing. Do not block on single failures.

---

## Summary

| Topic           | Decision                                         | Rationale                                           |
| --------------- | ------------------------------------------------ | --------------------------------------------------- |
| Architecture    | TypeScript refactor of prototype                 | Better maintainability, type safety                 |
| Publish API     | `POST /publish` with topic from `x-event-type`   | Align with SDK; decouple services from topics       |
| Redis Client    | node-redis v4+                                   | Prototype compatibility, TypeScript support         |
| Transformations | JavaScript functions (PoC)                       | Prototype compatibility                             |
| Testing         | Unit tests with mocks                            | PoC scope, testable architecture                    |
| Health Checks   | /health + /ready endpoints                       | Kubernetes/Docker compatibility                     |
| Error Handling  | Log, emit span, continue                         | At-least-once semantics                             |
