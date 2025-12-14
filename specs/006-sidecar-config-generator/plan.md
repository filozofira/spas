# Implementation Plan: Sidecar Config Generator

**Branch**: `006-sidecar-config-generator` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-sidecar-config-generator/spec.md`

## Summary

Enhance `spas-compose choreography deploy --docker` to generate sidecar configuration files (`config.{service}.json`) alongside `docker-compose.yaml`. This bridges the gap between choreography definition and runnable sidecar containers, enabling a single-command workflow that produces all artifacts needed to run `docker compose up`.

## Technical Context

**Language/Version**: TypeScript 5.3 (Node.js 20+)  
**Primary Dependencies**: commander, js-yaml, jsonata (already in spas-compose)  
**Storage**: N/A (generates files to filesystem)  
**Testing**: Jest 29.7 with ESM support  
**Target Platform**: Node.js CLI (cross-platform)  
**Project Type**: Enhancement to existing CLI tool  
**Performance Goals**: Config generation adds <1 second to deploy command  
**Constraints**: Must maintain backward compatibility with existing 67 tests  
**Scale/Scope**: Generates 1 config file per participating service

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | N/A | CLI tool, not a service |
| II. No Direct Service-to-Service | N/A | CLI tool, not runtime |
| III. Event-First Integration | N/A | CLI tool, not runtime |
| IV. Convention Over Configuration | ✅ PASS | Uses `config.{SERVICE_NAME}.json` naming convention |
| V. Security by Default | N/A | No security data handled |
| VI. Observability First | N/A | CLI tool, not runtime |
| VII. Portable Packaging | N/A | Enhancement to existing CLI |
| VIII. Adaptable Through Configuration | ✅ PASS | Generates config files for sidecar adaptation |
| CLI Tools Constitution | ✅ PASS | Text I/O protocol, JSON + human-readable, idempotent |

**Gate Result**: ✅ PASS — No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/006-sidecar-config-generator/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (minimal - well-understood domain)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (enhancement to existing)

```text
components/cli/spas-compose/
├── src/
│   ├── commands/
│   │   └── choreography-deploy.ts    # MODIFY: integrate SidecarConfigGenerator
│   ├── services/
│   │   ├── sidecar-config-generator.ts  # NEW: core generation logic
│   │   ├── choreography-loader.ts       # EXISTS: provides choreography input
│   │   ├── docker-generator.ts          # EXISTS: generates docker-compose.yaml
│   │   └── jsonata-validator.ts         # EXISTS: validates transformations
│   └── types.ts                          # MODIFY: add SidecarConfig types
└── test/
    └── unit/
        └── services/
            └── sidecar-config-generator.test.ts  # NEW: unit tests
```

**Structure Decision**: Enhancement to existing spas-compose CLI. New file `sidecar-config-generator.ts` follows existing service pattern. No structural changes needed.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| New service class | Low | Follows existing pattern (e.g., DockerGenerator) |
| Type additions | Low | Simple interfaces for config schema |
| Integration point | Low | Single integration in choreography-deploy.ts |
