# Implementation Plan: SPAS-Service CLI Tool

**Branch**: `004-spas-service-cli` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-spas-service-cli/spec.md`

## Summary

Implement `spas-service` CLI tool that enables developers to publish SPAS service metadata to the Repository with a single command. The CLI downloads metadata archives from running services via `/_spas/metadata` endpoint and publishes to the Repository. **Prerequisite**: Align SDK archive format with Repository expectations before CLI implementation.

**Technical Approach**: Node.js + Commander.js CLI framework, aligning with Repository tech stack for code reuse opportunities.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.x  
**Primary Dependencies**: Commander.js (CLI framework), axios (HTTP client), adm-zip (archive handling), form-data (multipart upload)  
**Storage**: N/A (CLI tool, no persistence)  
**Testing**: Jest (aligns with Repository test setup)  
**Target Platform**: Windows, macOS, Linux (cross-platform Node.js)
**Project Type**: CLI Tool (single project under `components/cli/spas-service/`)  
**Performance Goals**: <10 seconds for typical publish operation (<1MB archives)  
**Constraints**: Must work with SPAS SDK services and Repository; minimal dependencies  
**Scale/Scope**: 4 commands (publish, pull), ~10 source files, ~500-800 LOC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### CLI Tools Constitution Requirements (from `.specify/memory/constitution.md`)

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Mandatory Commands** - Service: init, metadata get, pack, publish, pull | ⚠️ Partial | `publish`, `pull` in scope; `init`, `metadata get`, `pack` deferred per spec |
| **Text I/O protocol**: stdin/args → stdout, errors → stderr | ✅ Pass | Design includes proper output handling |
| **Support JSON + human-readable formats** | ⚠️ Deferred | Human-readable only for PoC; JSON format future |
| **Exit codes**: 0 (success), non-zero (failure with descriptive stderr) | ✅ Pass | FR-011 requires this |
| **Idempotent operations** (safe to re-run) | ✅ Pass | Publish is idempotent (409 on duplicate is documented) |
| **Responsibilities**: Composition, Packaging, Publishing | ⚠️ Partial | Publishing in scope; Composition deferred to spas-compose |
| **Dev Integration**: MAY call `/_spas/metadata` | ✅ Pass | Core workflow |
| **Quality Gates**: Integration tests for workflows | ✅ Pass | Planned in tasks |
| **Quality Gates**: Error messages include actionable remediation | ✅ Pass | FR-010 requires this |
| **Quality Gates**: Help text follows consistent format | ✅ Pass | Commander.js provides this |

**Pre-work Required**: SDK archive format alignment (T001) must complete before CLI can successfully integrate.

## Project Structure

### Documentation (this feature)

```text
specs/004-spas-service-cli/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - CLI command/entity models
├── quickstart.md        # Phase 1 output - usage guide
├── contracts/           # Phase 1 output - (N/A for CLI, no API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/cli/
├── spas-service/                    # spas-service CLI tool
│   ├── src/
│   │   ├── index.ts                 # CLI entry point + Commander setup
│   │   ├── commands/
│   │   │   ├── publish.ts           # publish command implementation
│   │   │   └── pull.ts              # pull command implementation
│   │   ├── services/
│   │   │   ├── metadata-client.ts   # HTTP client for /_spas/metadata
│   │   │   ├── repository-client.ts # HTTP client for Repository API
│   │   │   └── archive-reader.ts    # ZIP extraction for spas.json reading
│   │   ├── utils/
│   │   │   ├── config.ts            # Repository URL resolution
│   │   │   ├── retry.ts             # Retry with backoff logic
│   │   │   └── output.ts            # Console output formatting
│   │   └── types.ts                 # TypeScript interfaces
│   ├── test/
│   │   ├── unit/
│   │   │   ├── archive-reader.test.ts
│   │   │   ├── config.test.ts
│   │   │   └── retry.test.ts
│   │   └── integration/
│   │       ├── publish.test.ts      # End-to-end publish workflow
│   │       └── pull.test.ts         # End-to-end pull workflow
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── spas-compose/                    # Placeholder for future
│   └── README.md
└── README.md                        # CLI documentation
```

**Structure Decision**: Single CLI project under `components/cli/spas-service/`. Follows same pattern as Repository (`components/repository/`). Separate `spas-compose/` directory scaffolded as placeholder for Phase 3 continuation.

## Complexity Tracking

> No constitution violations requiring justification. Scope is appropriately limited for PoC.

## SDK Alignment Pre-work

Before CLI development proceeds, the following SDK changes are required:

| Task | Description | Location |
|------|-------------|----------|
| T001a | Compare formats (DONE in research.md) | N/A |
| T001b | Update `MetadataArchiveWriter` field names | `components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/` |
| T001c | Update schema path structure (categorized) | `components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/` |
| T001d | Update SDK tests for new format | `components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/` |
| T001e | Integration validation with Repository | Manual test |

**Blocked by T001**: All CLI tasks depend on SDK producing Repository-compatible archives.

## Constitution Re-Check (Post-Design)

| Requirement | Pre-Design | Post-Design | Notes |
|-------------|------------|-------------|-------|
| Text I/O protocol | ✅ Pass | ✅ Pass | Confirmed in data-model.md |
| Exit codes | ✅ Pass | ✅ Pass | Error model defined |
| Idempotent operations | ✅ Pass | ✅ Pass | Archive can be re-published |
| Error messages actionable | ✅ Pass | ✅ Pass | Hint field in error model |
| Integration tests | ✅ Pass | ✅ Pass | test/integration/ structure defined |

**Post-Design Gate**: ✅ PASSED - No new violations introduced.

## Generated Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Research | [research.md](./research.md) | Technology decisions, format analysis |
| Data Model | [data-model.md](./data-model.md) | Command interfaces, error codes |
| Quickstart | [quickstart.md](./quickstart.md) | Usage guide and examples |
| Contracts | N/A | CLI has no API contracts |

## Next Steps

1. **Run `/speckit.tasks`** to generate implementation task list
2. **Execute T001 (SDK Alignment)** before CLI scaffolding
3. **Scaffold CLI project** following structure in this plan
4. **Implement commands** per user story priority (P1→P2→P3)
