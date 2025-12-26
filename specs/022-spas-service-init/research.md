# Research: spas-service init

**Feature**: 022-spas-service-init  
**Date**: 2025-12-26

## Research Tasks

### 1. Template Engine Selection

**Question**: What Node.js templating package should be used to reduce complexity in template generation code?

**Context**: The existing `components/cli/spas-compose/src/utils/templates.ts` is 1642 lines of TypeScript using string template literals. A templating engine would separate content from logic and improve maintainability.

**Evaluation Criteria**:
- Zero/minimal dependencies (CLI should stay lightweight)
- TypeScript support
- Bundle size
- Template file loading from disk
- Partials/includes support
- Active maintenance

**Comparison**:

| Criteria | Mustache | Handlebars | Eta | Nunjucks |
|----------|----------|------------|-----|----------|
| Dependencies | 0 | 5 | 0 | 3 |
| TypeScript | @types (external) | Built-in | Built-in | @types (external) |
| Bundle Size (min) | 6.4 kB | 73.1 kB | 8.4 kB | 92.3 kB |
| Bundle Size (gzip) | 2.6 kB | 21.6 kB | 3.2 kB | 25.8 kB |
| File Loading | Manual (fs) | Built-in | Built-in (`views`) | Built-in |
| Partials | ✅ via API | ✅ registerPartial | ✅ include/layout | ✅ include/extends |
| Logic | Logic-less | Helpers only | Full JS | Full (Jinja2) |
| Last Publish | 5 years | 2 years | 14 days | 3 years |
| Weekly Downloads | ~5.6M | ~16.3M | ~958K | ~1M |
| ESM Support | CommonJS | CommonJS | ✅ ES Modules | CommonJS |

**Decision**: **Eta** (https://eta.js.org)

**Rationale**:
1. **Zero dependencies** - Aligns with CLI minimal dependency goal
2. **Tiny footprint** - 3.2 kB gzipped (vs 21-26 kB for Handlebars/Nunjucks)
3. **Built-in TypeScript** - Written in TS, no @types needed
4. **Actively maintained** - Published 14 days ago
5. **Built-in file loading** - `new Eta({ views: "./templates" })` handles directories
6. **ES Modules** - Native ESM support, tree-shakeable
7. **Partials/layouts** - Supports `<%~ include() %>` for code reuse
8. **Production proven** - Used by Docusaurus v2

**Alternatives Considered**:
- **Mustache**: Simplest option, but 5 years stale and no built-in file loading
- **Handlebars**: Most popular, but 73 kB bundle and 5 dependencies
- **Keep template literals**: Works but 1600+ lines of mixed content/logic

---

### 2. Existing CLI Pattern Analysis

**Question**: How does `spas-compose init` implement workspace scaffolding?

**Findings**:

**Command Structure** (`components/cli/spas-compose/src/commands/init.ts`):
- Uses Commander.js for CLI parsing
- Validates workspace name (kebab-case pattern)
- Resolves paths based on `--output` flag
- Finds git root for agent file placement
- Delegates to `WorkspaceService.create()`

**Service Pattern** (`components/cli/spas-compose/src/services/workspace-service.ts`):
- `WorkspaceService.create()` handles file system operations
- Creates directories, writes files, handles `--force` overwrite
- Returns `CommandResult` with success/failure status and file list

**Template Pattern** (`components/cli/spas-compose/src/utils/templates.ts`):
- Functions like `generateWorkspaceReadme()`, `generateAgentFile()`
- Uses template literals with variable interpolation
- Helper functions compose complex sections (workflow phases, technical reference)
- 1642 lines total

**Decision**: Follow the same pattern but with Eta templates:
- `init.ts` command handler → same structure
- `WorkspaceService` → reuse pattern
- `templates/` directory with `.eta` files → replaces template literal functions

---

### 3. Agent Prompt Content Requirements

**Question**: What content must the service agent prompt include?

**Findings from spec and constitution**:

**Required Tokens** (FR-013):
- `NAME:<service-id>` - Maps to service folder and spas.json id
- `STACK:<java|dotnet>` - Determines SDK and project structure
- `CONTEXT:<bounded-context>` - Maps to spas.json boundedContext

**9-Phase Workflow** (FR-014):
1. Analyze - Parse tokens, validate workspace
2. Project Structure - Propose stack-appropriate structure
3. Service Metadata - Identity, security, license (from design-time schema)
4. Storage Layer - Interface + in-memory implementation
5. Endpoints & Model - Command/query endpoints, DTOs, domain model
6. Events - Event classes, schemas, produces[] relationships
7. Sidecar Integration - Event publishing via SDK
8. Runtime - Dockerfile generation
9. Validate & Next Steps - Build, generate metadata, publish command

**SDK-Specific Patterns**:

**Java (spas-sdk-spring)**:
- Spring Boot 3.x application
- Maven/Gradle with `io.spas:spas-sdk-spring` dependency
- `@SpasCommand`, `@SpasEvent` annotations
- Event publishing via `EventPublisher.publish()`

**.NET (Spas.Sdk.AspNetCore)**:
- .NET 8+ minimal API or controller-based
- NuGet: `Spas.Sdk.AspNetCore`
- `[SpasCommand]`, `[SpasEvent]` attributes
- Event publishing via `ISpasEventPublisher.PublishAsync()`

**Event Publishing Contract** (FR-016):
- POST /publish to sidecar
- Headers: traceparent, x-service-name, x-event-name, x-correlation-id
- Sidecar wraps in CloudEvents envelope

**Decision**: Structure agent prompt in sections:
1. User Input parsing (tokens)
2. Goal statement
3. Workspace structure reference
4. 9 workflow phases with entry/exit criteria
5. Stack-specific patterns (Java/dotnet sections)
6. Validation checklists per phase
7. Error handling
8. Example prompts

---

### 4. Design-Time Metadata Schema Usage

**Question**: How should the schema be referenced and what key structures matter?

**Findings** (`components/schemas/design-time-metadata-v1.schema.json`):

**Required Fields**:
- `schemaVersion: "design-time-metadata-v1"`
- `id`: kebab-case service identifier
- `name`: human-readable name
- `version`: semver
- `boundedContext`: domain context

**Critical Structures**:

```json
{
  "commands": [{
    "name": "create-order",
    "produces": [{ "type": "order-created", "version": "1.0", "when": "success" }]
  }],
  "endpoints": [{
    "name": "CreateOrder",
    "type": "Command",
    "protocol": "Http",
    "methodPath": "POST /api/orders",
    "version": "1.0",
    "schemaRef": "schemas/endpoints/create-order.schema.json"
  }],
  "events": [{
    "type": "order-created",
    "version": "1.0",
    "schemaRef": "schemas/events/order-created.schema.json"
  }]
}
```

**Key Relationship**: `commands[].produces[]` links commands to events they emit (authoritative source, not endpoints[]).

**Decision**: 
- Copy schema to `.spas/schemas/design-time-metadata-v1.schema.json` in workspace
- Agent prompt references this local copy, not SPAS repo paths
- Document `commands[].produces[]` relationship prominently in agent prompt

---

## Summary

| Topic | Decision |
|-------|----------|
| Template Engine | Eta (zero deps, 3.2 kB, built-in TS, active) |
| CLI Pattern | Follow spas-compose pattern with WorkspaceService |
| Agent Prompt | 9-phase workflow, stack-specific sections, local schema ref |
| Schema Location | Copy to `.spas/schemas/` for self-contained workspace |
