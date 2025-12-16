# Implementation Plan: spas-compose CLI Generator Fixes

**Branch**: `009-compose-generator-fixes` | **Date**: 2025-12-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-compose-generator-fixes/spec.md`

## Summary

Fix spas-compose CLI generator bugs discovered during Phase 2 E-Commerce choreography validation. The generator currently produces docker-compose.yaml and sidecar config files that don't work out-of-the-box due to incorrect image references, eventType formats, port configurations, and transform paths. This plan addresses FG01, FG05, FG06, and FG07.

## Technical Context

**Language/Version**: TypeScript 5.3 (Node.js 20+)
**Primary Dependencies**: Commander 11.x, js-yaml 4.x, jsonata 2.x, axios 1.x
**Storage**: Filesystem (reading/writing config files)
**Testing**: Jest 29.x with ESM modules
**Target Platform**: CLI tool (cross-platform)
**Project Type**: Single CLI package (components/cli/spas-compose)
**Performance Goals**: Sub-second generation for typical domain (5-10 services)
**Constraints**: Must produce valid docker-compose.yaml and sidecar configs that work without manual edits
**Scale/Scope**: Individual domains with 2-20 services

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status   | Notes                                               |
| ------------------------------------- | -------- | --------------------------------------------------- |
| I. Single Bounded Context             | N/A      | CLI tool, not a service                             |
| II. No Direct Service-to-Service      | N/A      | CLI tool, not a service                             |
| III. Event-First Integration          | N/A      | CLI tool, not a service                             |
| IV. Convention Over Configuration     | ✅ PASS  | Using SERVICE_NAME, sidecar naming conventions      |
| V. Security by Default                | N/A      | PoC phase, no runtime security                      |
| VI. Observability First               | N/A      | CLI tool, not a service                             |
| VII. Portable Packaging               | N/A      | CLI tool, not packaged as OCI                       |
| VIII. Adaptable Through Configuration | ✅ PASS  | Generated configs enable domain composition         |
| CLI Tool Design Constraints           | ✅ PASS  | Follows text I/O, exit codes, idempotent operations |
| CLI Quality Gates                     | ⚠️ CHECK | Integration tests for complete workflows required   |

**Gate Result**: PASS - No violations. CLI component constraints satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/009-compose-generator-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - internal CLI)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/cli/spas-compose/
├── src/
│   ├── commands/
│   │   ├── init.ts                      # FR-013 to FR-017: --output argument
│   │   ├── choreography-build.ts
│   │   └── services-pull.ts
│   ├── services/
│   │   ├── docker-generator.ts          # FR-001, FR-002, FR-008 to FR-012
│   │   ├── sidecar-config-generator.ts  # FR-003 to FR-007
│   │   ├── workspace-service.ts         # FR-014 to FR-017
│   │   └── ...
│   ├── types.ts                         # Type definitions (extend ServiceMetadata)
│   └── utils/
│       └── templates.ts                 # Agent prompt templates
└── test/
    ├── unit/
    │   ├── docker-generator.test.ts
    │   └── sidecar-config-generator.test.ts
    └── integration/
        └── choreography-build.test.ts
```

**Structure Decision**: Single project structure within existing `components/cli/spas-compose/` package. No new packages or services required.

## Complexity Tracking

> No violations detected - standard bug fixes within existing CLI architecture.

## Constitution Check (Post-Design)

_Re-check after Phase 1 design._

| Principle                             | Status  | Notes                                                          |
| ------------------------------------- | ------- | -------------------------------------------------------------- |
| IV. Convention Over Configuration     | ✅ PASS | Using SERVICE_NAME, SIDECAR_PORT, /incoming defaults           |
| VIII. Adaptable Through Configuration | ✅ PASS | Generated configs derived from service metadata + choreography |
| CLI Tool Design Constraints           | ✅ PASS | Idempotent generation, JSON/human output support               |
| CLI Quality Gates                     | ✅ PASS | Integration test defined (E-Commerce end-to-end validation)    |

**Final Gate Result**: PASS - Design aligns with constitution. Ready for task generation.

## Generated Artifacts

Phase 0 & Phase 1 complete:

| Artifact            | Path                           | Status                  |
| ------------------- | ------------------------------ | ----------------------- |
| Implementation Plan | [plan.md](plan.md)             | ✅ Complete             |
| Research            | [research.md](research.md)     | ✅ Complete             |
| Data Model          | [data-model.md](data-model.md) | ✅ Complete             |
| Quickstart          | [quickstart.md](quickstart.md) | ✅ Complete             |
| Contracts           | N/A (internal CLI)             | N/A                     |
| Tasks               | [tasks.md](tasks.md)           | ⏳ Next: /speckit.tasks |

## Next Command

Run `/speckit.tasks` to generate implementation tasks.
