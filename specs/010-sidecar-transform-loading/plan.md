# Implementation Plan: Sidecar Transform File Loading

**Branch**: `010-sidecar-transform-loading` | **Date**: 2025-12-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-sidecar-transform-loading/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix sidecar transform file loading so that JSONata expressions can be loaded from external `.jsonata` files. Currently the sidecar passes the file path directly to JSONata instead of loading the file content first. The fix involves detecting `.jsonata` file paths, loading file content, caching compiled expressions, and providing clear error messages when files are missing or invalid.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 20+  
**Primary Dependencies**: jsonata 2.1.0, express 4.18.2, redis 4.6.12  
**Storage**: N/A (in-memory transform cache only)  
**Testing**: Jest 29.7 with ts-jest (ESM mode)  
**Target Platform**: Linux containers (Docker), cross-platform Node.js  
**Project Type**: Single component (sidecar service)  
**Performance Goals**: <10ms transformation latency at p95 (per Constitution)  
**Constraints**: Stateless operation, cached expressions for repeated use  
**Scale/Scope**: Handles all inbound/outbound event transforms for a service

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicable | Status | Notes |
|-----------|------------|--------|-------|
| I. Single Bounded Context | N/A | ✅ Pass | Sidecar is infrastructure, not a bounded context |
| II. No Direct Service-to-Service | N/A | ✅ Pass | This fix is within sidecar, no cross-service calls |
| III. Event-First Integration | Yes | ✅ Pass | Enables event transformation for choreography |
| IV. Convention Over Configuration | Yes | ✅ Pass | `.jsonata` extension convention for file detection |
| V. Security by Default | Yes | ✅ Pass | File access limited to mounted volumes |
| VI. Observability First | Yes | ✅ Pass | Errors logged with file path and parse details |
| VII. Portable Packaging | N/A | ✅ Pass | No impact on container packaging |
| VIII. Adaptable Through Configuration | Yes | ✅ Pass | Transforms defined in config, loaded from files |

**Sidecar Component Gates** (from Constitution):
- ✅ Event transformation (inbound/outbound) - this feature
- ✅ Configuration-driven routing and transformation
- ✅ Stateless operation (transformations are pure functions)
- ⚠️ Performance <10ms p95 - cached expressions ensure this

## Project Structure

### Documentation (this feature)

```text
specs/010-sidecar-transform-loading/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (N/A - no new API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/sidecar/
├── src/
│   ├── services/
│   │   └── transformer.ts    # PRIMARY: File loading + caching logic
│   ├── handlers/
│   ├── config/
│   ├── cloudevents/
│   ├── transport/
│   ├── utils/
│   │   └── file-loader.ts    # NEW: File reading utility (optional)
│   ├── types.ts
│   └── index.ts
└── test/
    └── unit/
        └── services/
            └── transformer.test.ts  # Updated with file-based tests
```

**Structure Decision**: Single component modification. The transformer service in `components/sidecar/src/services/transformer.ts` is the primary file to modify. The existing cache mechanism can be extended to support file-based transforms. No new directories needed.

## Complexity Tracking

No constitution violations. Feature is a focused fix within the existing sidecar component architecture.
