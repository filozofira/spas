# Implementation Plan: spas-service init Command

**Branch**: `022-spas-service-init` | **Date**: 2025-12-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/022-spas-service-init/spec.md`

## Summary

Add `spas-service init <service-name>` command that scaffolds a language-agnostic workspace for SPAS service development, plus generates a rich AI agent prompt that guides developers through a 9-phase service scaffolding workflow. The CLI creates folder structure, copies the design-time metadata schema, and generates agent files at git root. Uses Eta templating engine (zero deps, 3.2 KB) to reduce template code complexity.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20+  
**Primary Dependencies**: Commander.js 11.x (CLI), Eta 4.x (templating), chalk 4.x (output)  
**Storage**: N/A (file system only)  
**Testing**: Jest 29.x  
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux)  
**Project Type**: CLI tool (single project)  
**Performance Goals**: Workspace creation < 5 seconds (SC-001)  
**Constraints**: Agent prompt < 35KB (SC-007), zero runtime dependencies beyond Commander/Eta/chalk  
**Scale/Scope**: Single CLI command, ~500-800 lines of new code + ~1500 lines of templates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | ✅ N/A | CLI tool, not a service |
| II. No Direct Service-to-Service | ✅ N/A | CLI tool, not a service |
| III. Event-First Integration | ✅ N/A | CLI tool, generates event-capable services |
| IV. Convention Over Configuration | ✅ Pass | Follows kebab-case naming, standard folder structure |
| V. Security by Default | ✅ N/A | CLI tool, no authentication |
| VI. Observability First | ✅ N/A | CLI tool, uses --verbose flag |
| VII. Portable Packaging | ✅ Pass | npm package, cross-platform |
| VIII. Adaptable Through Configuration | ✅ Pass | Supports --output, --force flags |
| CLI Tools Constitution | ✅ Pass | Text I/O, JSON output, exit codes, idempotent |

**Post-Design Re-check**: All gates pass. No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/022-spas-service-init/
├── plan.md              # This file
├── research.md          # Template engine decision, pattern analysis
├── data-model.md        # Entities and state transitions
├── quickstart.md        # Developer quickstart guide
├── contracts/
│   └── cli-contract.md  # CLI command specification
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
components/cli/spas-service/
├── package.json                    # Add eta dependency
├── src/
│   ├── index.ts                    # Add init command registration
│   ├── commands/
│   │   ├── init.ts                 # NEW: init command handler
│   │   ├── publish.ts              # Existing
│   │   └── pull.ts                 # Existing
│   ├── services/
│   │   └── workspace-service.ts    # NEW: workspace creation logic
│   ├── utils/
│   │   ├── config.ts               # NEW: name validation, path resolution
│   │   ├── git.ts                  # NEW: git root detection
│   │   ├── output.ts               # NEW: console output helpers
│   │   └── templates.ts            # NEW: Eta template loading
│   └── types.ts                    # NEW: command types
├── templates/                      # NEW: Eta template files
│   ├── readme.eta                  # Service README template
│   ├── agent-prompt.eta            # Agent instructions template
│   ├── prompt-trigger.eta          # Prompt file template
│   └── partials/
│       ├── workflow-phases.eta     # 9-phase workflow section
│       ├── sdk-patterns.eta        # Java/dotnet SDK patterns
│       ├── validation-checklists.eta
│       └── error-handling.eta
└── test/
    ├── commands/
    │   └── init.test.ts            # NEW: init command tests
    ├── services/
    │   └── workspace-service.test.ts # NEW: workspace service tests
    └── utils/
        └── config.test.ts          # NEW: validation tests
```

**Structure Decision**: Single project structure. The `spas-service` CLI is an existing package; we add the `init` command following the established pattern for `publish` and `pull` commands. Templates are stored in a `templates/` directory alongside `src/` for clear separation of content from logic.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Complexity | Rationale |
|--------|------------|-----------|
| Template engine (Eta) | Low | Zero deps, 3.2 KB, simplifies 1600+ line template literal pattern |
| 9-phase agent prompt | Medium | Required by spec, self-contained markdown |
| Pattern reuse | Low | Follows spas-compose init pattern exactly |

## Implementation Phases

### Phase 0: Research (Complete)

See [research.md](research.md) for:
- Template engine selection: **Eta** (zero deps, built-in TS, 3.2 KB gzipped)
- Existing CLI pattern analysis from spas-compose
- Agent prompt content requirements
- Design-time metadata schema usage

### Phase 1: Design (Complete)

See:
- [data-model.md](data-model.md) - Entity definitions, state transitions
- [contracts/cli-contract.md](contracts/cli-contract.md) - CLI command specification
- [quickstart.md](quickstart.md) - Developer quickstart guide

### Phase 2: Tasks (Next - /speckit.tasks)

Task breakdown will include:
1. Add Eta dependency to package.json
2. Create utility modules (config, git, output, templates)
3. Create WorkspaceService
4. Create init command handler
5. Create Eta templates (readme, agent-prompt, prompt-trigger)
6. Create agent prompt partials (workflow, SDK patterns, validation)
7. Register init command in index.ts
8. Write unit tests for validation, workspace creation
9. Integration test: full init workflow

## Key Design Decisions

### 1. Use Eta for Templates

**Decision**: Use Eta templating engine instead of template literals.

**Rationale**:
- Reduces templates.ts from 1600+ lines to ~100 lines of loader code
- Templates in `.eta` files get proper syntax highlighting
- Partials enable reuse across sections
- Zero dependencies, 3.2 KB gzipped

**Alternative Rejected**: Keep template literals - works but mixes content with logic, harder to maintain.

### 2. Follow spas-compose Pattern

**Decision**: Mirror `spas-compose init` implementation structure.

**Rationale**:
- Proven pattern, already tested
- Consistent developer experience across CLI tools
- Reduces implementation risk

**Key Pattern Elements**:
- `init.ts` command handler
- `WorkspaceService.create()` for file operations
- `findGitRoot()` for agent file placement
- `CommandResult` return type

### 3. Self-Contained Agent Prompt

**Decision**: Embed all SPAS service development guidance in the agent prompt.

**Rationale**:
- External developers won't have SPAS repo access
- Agent needs complete context for autonomous operation
- Follows spec requirement FR-020 (no external repo references)

**Content**:
- 9-phase workflow with entry/exit criteria
- Stack-specific patterns (Java + .NET)
- Event publishing contract
- Validation checklists
- Error handling

### 4. Copy Schema vs Generate

**Decision**: Copy `design-time-metadata-v1.schema.json` from `components/schemas/`.

**Rationale**:
- Single source of truth for schema
- Simpler than runtime generation
- Agent references local copy in `.spas/schemas/`

## Dependencies

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| eta | ^4.5.0 | Template rendering | NEW |
| commander | ^11.1.0 | CLI parsing | Existing |
| chalk | ^4.1.2 | Console output | Existing |
| adm-zip | ^0.5.10 | Archive handling | Existing (not needed for init) |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agent prompt exceeds 35KB | Low | Medium | Structure with partials, measure during development |
| Eta learning curve | Low | Low | Well-documented, simple API |
| Template file packaging | Low | Medium | Configure npm to include templates/ in package |

## References

- [spec.md](spec.md) - Feature specification
- [research.md](research.md) - Research findings
- [../005-spas-compose-cli/](../005-spas-compose-cli/) - Reference implementation pattern
- [../../components/cli/spas-compose/](../../components/cli/spas-compose/) - Source code to mirror
- [../../components/schemas/design-time-metadata-v1.schema.json](../../components/schemas/design-time-metadata-v1.schema.json) - Schema to copy
