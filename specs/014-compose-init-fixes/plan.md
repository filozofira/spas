# Implementation Plan: spas-compose init Scaffolding Fixes

**Branch**: `014-compose-init-fixes` | **Date**: December 19, 2025 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/014-compose-init-fixes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix four bugs in the `spas-compose init` command that prevent proper workspace scaffolding: (1) Missing `runtime-metadata-v1.schema.json` schema file when run outside SPAS repository, (2) Incomplete README.md Structure section that doesn't list all three schemas, (3) Wrong diagram type guidance in agent prompt (sequence diagram vs choreography diagram), and (4) Incorrect build command documentation missing `--docker` flag. Technical approach: Add inline `generateRuntimeMetadataSchema()` function to `templates.ts`, update `generateWorkspaceReadme()` to list all three schemas, update `generateAgentFile()` Phase 3 to specify choreography diagrams with mermaid flowchart format, and fix Actions section command documentation.

## Technical Context

**Language/Version**: TypeScript 5.3+ (ES2022 target), Node.js >=20.0.0  
**Primary Dependencies**: Commander 11 (CLI framework), js-yaml 4 (YAML parsing), chalk 4 (output formatting)  
**Storage**: File system operations (generate/write schema and documentation files)  
**Testing**: Jest (unit tests for template generation functions)  
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux)  
**Project Type**: Single project (CLI tool within monorepo component)  
**Performance Goals**: Template generation <100ms, complete init command <1 second  
**Constraints**: Must work identically inside/outside SPAS repository, idempotent operations  
**Scale/Scope**: 4 template functions affected, ~200 lines of schema JSON to inline, 3 documentation updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### CLI Tools Constitution Compliance

**Applicable Gates** (from `.specify/memory/constitution.md` - CLI Tools section):

✅ **Text I/O Protocol**: Changes maintain stdin/args → stdout, errors → stderr pattern  
✅ **JSON + Human-Readable Formats**: No changes to output formats, only template content  
✅ **Exit Codes**: No changes to error handling or exit codes  
✅ **Idempotent Operations**: Bug fixes ensure idempotent behavior (schema generation vs file copy)  
✅ **Quality Gates**: Integration tests will verify complete init workflow with all three schemas  

**Analysis**: This feature fixes bugs in existing `spas-compose init` command without changing core CLI behavior or responsibilities. No constitutional violations. All changes are internal to template generation functions.

**Design Constraints Verification**:
- ✅ Composition determinism: Schemas generated identically every time (no external file dependencies)
- ✅ Error messages: No changes to error messaging (only fixes missing schema issue)
- ✅ Help text: No changes to command help text

### Re-check After Phase 1 Design (December 19, 2025)

**Phase 1 Artifacts Reviewed**:
- ✅ research.md - No new dependencies, uses existing patterns
- ✅ data-model.md - Schema structure unchanged, only generation method
- ✅ contracts/template-functions.md - Pure functions, no side effects
- ✅ quickstart.md - Testing verifies idempotent behavior

**Constitutional Compliance Verified**:

✅ **Text I/O Protocol**: All template functions return strings, no protocol changes  
✅ **JSON + Human-Readable Formats**: `spas-compose init` output format unchanged  
✅ **Exit Codes**: No changes to success/failure exit codes  
✅ **Idempotent Operations**: Schema generation is deterministic (same input → same output)  
✅ **Quality Gates**: Test coverage includes:
  - Unit tests for all template functions
  - Integration test for full `spas-compose init` workflow
  - Verification of all three schemas in external projects

**CLI Tool Responsibilities Preserved**:
- ✅ Composition: Deterministic schema generation (pure functions)
- ✅ Packaging: No changes to packaging logic
- ✅ Publishing: No changes to publishing logic
- ✅ Dev Integration: No changes to dev endpoint interactions
- ✅ No Aggregation Logic: Schemas are static definitions (no runtime aggregation)

**Design Pattern Consistency**:
- ✅ Follows existing `generateSidecarConfigSchema()` and `generateChoreographySchema()` pattern
- ✅ Uses `JSON.stringify()` with 2-space formatting (consistent with existing templates)
- ✅ No file I/O in template functions (pure generation, writing happens in workspace-service)

**Conclusion**: All constitutional gates pass. Feature implementation preserves CLI Tool design constraints and responsibilities. Ready for task breakdown in Phase 2.

## Project Structure

### Documentation (this feature)

```text
specs/014-compose-init-fixes/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (not needed - all details clear)
├── data-model.md        # Phase 1 output (schema structures)
├── quickstart.md        # Phase 1 output (testing workflow)
├── contracts/           # Phase 1 output (template function signatures)
│   └── template-functions.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
components/cli/spas-compose/
├── src/
│   ├── index.ts                      # CLI entry point (no changes)
│   ├── types.ts                      # TypeScript interfaces (no changes)
│   ├── commands/
│   │   └── init.ts                   # Init command (no changes)
│   ├── services/
│   │   └── workspace-service.ts      # MODIFIED: Remove file copy, call generateRuntimeMetadataSchema()
│   └── utils/
│       └── templates.ts              # MODIFIED: Add generateRuntimeMetadataSchema(), 
│                                     #           update generateWorkspaceReadme(),
│                                     #           update generateAgentFile()
└── test/
    └── utils/
        └── templates.test.ts         # MODIFIED: Add tests for new schema generation
```

**Structure Decision**: Single project CLI tool within monorepo. Changes isolated to two files: `workspace-service.ts` (orchestration) and `templates.ts` (template generation). No new files needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ No constitutional violations detected. This section is not applicable.

This feature fixes bugs in existing functionality without introducing new complexity, architectural patterns, or constitutional violations. All changes preserve CLI Tool design constraints and responsibilities.
