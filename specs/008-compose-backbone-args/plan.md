# Implementation Plan: Compose Deploy Backbone Arguments

**Branch**: `008-compose-backbone-args` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-compose-backbone-args/spec.md`

## Summary

Add `--event-backbone` and `--observability-backbone` arguments to the `spas-compose choreography deploy` command. These allow customizing or disabling the infrastructure services (Redis, Zipkin/Jaeger) included in generated docker-compose.yaml files. Defaults provide zero-config experience; `none` value enables BYO infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 20+  
**Primary Dependencies**: Commander.js (CLI), js-yaml (YAML generation)  
**Storage**: N/A (generates files)  
**Testing**: Jest 29.7 with ESM support  
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux)  
**Project Type**: Enhancement to existing spas-compose CLI  
**Performance Goals**: N/A (file generation)  
**Constraints**: Backward compatible - existing commands must work unchanged  
**Scale/Scope**: ~200 lines of new code across 3-4 files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | ✅ PASS | CLI tool, not a service |
| II. No Direct Service-to-Service | ✅ N/A | CLI tool |
| III. Event-First Integration | ✅ N/A | CLI tool |
| IV. Convention Over Configuration | ✅ PASS | Sensible defaults, optional overrides |
| V. Security by Default | ✅ PASS | No security implications |
| VI. Observability First | ✅ PASS | Enables Zipkin/Jaeger configuration |
| VII. Portable Packaging | ✅ N/A | CLI tool |
| VIII. Adaptable Through Configuration | ✅ PASS | Configuration-driven backbone selection |
| CLI Tool Requirements | ✅ PASS | Text I/O, exit codes, idempotent |

**Constitution Check Result**: ✅ ALL GATES PASS

## Project Structure

### Documentation (this feature)

```text
specs/008-compose-backbone-args/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - CLI enhancement)
└── tasks.md             # Phase 2 output
```

### Source Code (existing CLI)

```text
components/cli/spas-compose/
├── src/
│   ├── commands/
│   │   └── choreography-deploy.ts  # MODIFY: Add backbone options
│   ├── services/
│   │   ├── docker-generator.ts     # MODIFY: Accept backbone config
│   │   └── backbone-normalizer.ts  # NEW: Image name normalization
│   ├── types.ts                    # MODIFY: Add backbone types
│   └── utils/
└── test/
    └── unit/
        ├── commands/
        │   └── choreography-deploy.test.ts  # MODIFY: Test backbone options
        └── services/
            ├── docker-generator.test.ts     # MODIFY: Test backbone generation
            └── backbone-normalizer.test.ts  # NEW: Test image normalization
```

**Structure Decision**: Single project enhancement. All changes within existing `components/cli/spas-compose/` structure.

## Complexity Tracking

> No constitution violations. No complexity justification needed.
