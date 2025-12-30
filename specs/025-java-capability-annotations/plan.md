# Implementation Plan: Java Capability Annotations Guidance

**Branch**: `025-java-capability-annotations` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-java-capability-annotations/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Update `spas-service init` CLI and Java SDK to guide developers toward annotation-based capability declaration (`@SpasCommand`, `@SpasQuery`, `@SpasEvent`) and deprecate the `options.addCapability()` method. The CLI templates will remove all references to `addCapability()`, and the Java SDK will mark the method as deprecated with a clear message pointing to annotations. This ensures a consistent, declarative approach aligned with Java SDK's metadata extraction model.

## Technical Context

**Language/Version**: Java 17+ (Spring Boot 3.2+), TypeScript 5.3+ (Node.js 20 LTS for CLI)  
**Primary Dependencies**: 
- Java SDK: Spring Boot 3.2, Jackson (JSON), Maven (build)
- CLI: Commander.js 11.x, Eta 4.x (templating), chalk 4.x (output)

**Storage**: N/A (configuration and template changes only)  
**Testing**: 
- Java: JUnit 5, Spring Boot Test
- CLI: Node.js built-in test runner + integration tests

**Target Platform**: Cross-platform (Java services, CLI on Linux/macOS/Windows)  
**Project Type**: Multi-component (CLI tool + Java SDK library)  
**Performance Goals**: No performance impact (guidance and deprecation messaging only)  
**Constraints**: 
- Java-only scope (no changes to .NET or other SDK implementations)
- One minor version deprecation window before removal
- No breaking changes to existing services (deprecation warnings only)

**Scale/Scope**: 
- 4 CLI template files to update (sdk-patterns.eta, workflow-phases.eta)
- 2 Java SDK classes to deprecate (`SpasServiceOptions.addCapability()`, `ServiceIdentityBuilder.addCapability()`)
- Java SDK README updates for capability declaration section

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### SDK Components Constitution

**Quality Gates**:
- ✅ Unit tests required: Yes (existing Java SDK tests will be updated; CLI template validation tests)
- ✅ Integration tests: Not required for PoC (template generation can be verified via unit tests)
- ✅ Clear error messages: Yes (deprecation warnings will be clear and actionable)
- ✅ Examples demonstrating capability: Yes (SDK README will show annotation approach)

**Design Constraints**:
- ✅ NO mandatory external infrastructure: Compliant (guidance changes only)
- ✅ NO duplication of sidecar concerns: Compliant (no architectural changes)
- ✅ Pluggable abstractions: Compliant (maintaining existing SDK structure)

**SDK/Events Boundary**:
- ✅ SDK prepares payload/context; Sidecar wraps CloudEvents: Not applicable (no event boundary changes)

### CLI Tools Constitution

**Mandatory Commands**:
- ✅ Service: `init`, `publish`, `pull`: Existing commands preserved; only template content updated

**Design Constraints**:
- ✅ Text I/O protocol: Compliant (no CLI interface changes)
- ✅ Idempotent operations: Compliant (template generation remains idempotent)

**Responsibilities & Boundaries**:
- ✅ No Dev Endpoint dependency: Compliant (offline templates only)
- ✅ CLI orchestrates composition: Compliant (no composition logic changes)

### SPAS Services Constitution

**Impact**: None (services consume updated guidance; no constitutional violations)

### Violations Requiring Justification

**None**. This feature is strictly guidance/deprecation and does not introduce architectural changes, new infrastructure requirements, or constitutional principle violations.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 (Design & Contracts) completion.*

### Design Review

**Artifacts Generated**:
- ✅ `research.md`: All technical unknowns resolved; no [NEEDS CLARIFICATION] remain
- ✅ `data-model.md`: Conceptual entities documented (templates, SDK methods, documentation)
- ✅ `contracts/README.md`: SDK deprecation contracts and CLI output contracts defined
- ✅ `quickstart.md`: Step-by-step implementation guide with validation steps

### Constitution Compliance (Re-check)

**SDK Components Constitution**:
- ✅ Quality Gates: Unit tests planned (CLI template validation, SDK method tests)
- ✅ Clear error messages: Deprecation warnings with actionable guidance
- ✅ Examples demonstrating capability: README sections show annotation approach
- ✅ No architectural changes: Existing SDK structure preserved

**CLI Tools Constitution**:
- ✅ Text I/O protocol: No CLI interface changes
- ✅ Idempotent operations: Template generation remains idempotent
- ✅ No dev endpoint dependency: Templates remain offline-only

**SPAS Services Constitution**:
- ✅ No impact: Services consume updated guidance; no service-level changes

### Gates Status

| Gate | Status | Notes |
|------|--------|-------|
| Constitution Check | ✅ PASS | No violations introduced during design |
| Technical Context Complete | ✅ PASS | All unknowns resolved in research.md |
| Data Model Defined | ✅ PASS | Conceptual entities documented |
| Contracts Defined | ✅ PASS | Deprecation and template contracts specified |
| Quickstart Validated | ✅ PASS | Implementation steps verified against existing codebase |

### Conclusion

**Status**: Ready to proceed to Phase 2 (Tasks Generation via `/speckit.tasks`)

**No design-time violations detected**. The feature maintains full constitutional compliance:
- No new infrastructure dependencies
- No breaking changes (deprecation with one minor version window)
- Clear migration path documented
- Backward compatibility preserved through v1.x releases

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

## Project Structure

### Documentation (this feature)

```text
specs/025-java-capability-annotations/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/
├── cli/
│   └── spas-service/
│       ├── src/
│       │   ├── commands/
│       │   │   └── init.ts                  # CLI init command (context for agent output)
│       │   └── services/
│       │       └── workspace-service.ts      # Generates agent files from templates
│       ├── templates/
│       │   ├── agent-prompt.eta              # Main agent template (uses partials)
│       │   ├── prompt-trigger.eta            # /spas.service trigger (usage examples)
│       │   └── partials/
│       │       ├── sdk-patterns.eta          # MODIFY: Java Application.main() example
│       │       └── workflow-phases.eta       # MODIFY: Phase 3 guidance + examples
│       └── test/
│           └── templates/                    # ADD: Template validation tests
└── sdk/
    └── java/
        ├── spas-sdk-metadata/
        │   ├── src/main/java/io/spas/sdk/metadata/
        │   │   ├── annotations/              # Existing: @SpasCommand, @SpasQuery, @SpasEvent
        │   │   └── builders/
        │   │       └── ServiceIdentityBuilder.java  # DEPRECATE: addCapability()
        │   └── README.md                     # UPDATE: Capability declaration section
        ├── spas-sdk-spring/
        │   ├── src/main/java/io/spas/sdk/spring/
        │   │   └── SpasServiceOptions.java   # DEPRECATE: addCapability()
        │   └── README.md                     # UPDATE: Capability declaration section
        └── README.md                         # UPDATE: Root SDK README
```

**Structure Decision**: This is a multi-component update touching both CLI (TypeScript) and Java SDK. Changes are localized to:
1. CLI templates that generate agent instructions
2. Java SDK methods that provide programmatic capability registration
3. Documentation explaining the canonical annotation-based approach

## Complexity Tracking

No constitutional violations detected. This section is intentionally left empty.
