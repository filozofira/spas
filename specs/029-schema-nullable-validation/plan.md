# Implementation Plan: Schema Nullable Handling and Transformation Validation

**Branch**: `029-schema-nullable-validation` | **Date**: 2026-01-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/029-schema-nullable-validation/spec.md`

## Summary

Enhance SDK schema generation (both .NET and Java) to emit correct `required` arrays and nullable type representations in JSON Schema output. Additionally, extend the `spas-compose init` agent prompt with mandatory field validation instructions in Phase 4 (Validate) to catch transformation completeness issues during design time.

## Technical Context

**Language/Version**: C# (.NET 8+), Java 17+, TypeScript (Node.js 18+)  
**Primary Dependencies**: 
- .NET: NJsonSchema (schema generation)
- Java: victools/jsonschema-generator with JacksonModule
- CLI: Eta template engine  
**Storage**: N/A  
**Testing**: xUnit (.NET), JUnit 5 (Java), Jest (CLI)  
**Target Platform**: Cross-platform (Windows, Linux, macOS)  
**Project Type**: Multi-component (SDK + CLI)  
**Performance Goals**: N/A (build-time tooling)  
**Constraints**: JSON Schema draft-07 compliance  
**Scale/Scope**: ~6 files modified across 3 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Rationale |
|-----------|--------|-----------|
| I. Single Bounded Context | ✅ Pass | Feature modifies SDK/CLI tooling, not service architecture |
| II. No Direct Service Communication | ✅ Pass | N/A - tooling change only |
| III. Event-First Integration | ✅ Pass | N/A - tooling change only |
| IV. Convention Over Configuration | ✅ Pass | Follows existing schema generation patterns |
| V. Security by Default | ✅ Pass | No security impact |
| VI. Observability First | ✅ Pass | N/A - build-time tooling |
| VII. Portable Packaging | ✅ Pass | No packaging changes |
| VIII. Adaptable Through Configuration | ✅ Pass | Schema generation remains config-driven |
| SDK Quality Gates | ✅ Pass | Unit tests required for schema changes |

**Gate Result**: ✅ PASS - No violations

**Post-design re-check**: ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/029-schema-nullable-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/
├── sdk/
│   ├── dotnet/
│   │   ├── src/Spas.Sdk.Metadata/
│   │   │   └── Schema/
│   │   │       └── SchemaGenerator.cs          # FR-001, FR-003, FR-005, FR-006
│   │   └── test/Spas.Sdk.Metadata.Tests/
│   │       └── Schema/
│   │           └── SchemaGeneratorTests.cs     # Unit tests
│   └── java/
│       ├── spas-sdk-spring/
│       │   └── src/main/java/io/spas/sdk/spring/
│       │       └── SpasSchemaGenerator.java    # FR-002, FR-004, FR-005, FR-006
│       │   └── src/test/java/io/spas/sdk/spring/
│       │       └── SpasSchemaGeneratorTest.java # Unit tests
│       └── README.md                           # FR-013
└── cli/
    └── spas-compose/
        └── src/templates/partials/
            └── workflow-phases.eta             # FR-007-FR-011

examples/
└── services/
    └── fulfillment-service/                    # FR-014
        └── src/main/java/.../dto/
            └── CreateShipmentRequest.java      # Add @Nullable demonstration
```

**Structure Decision**: Multi-component modification across SDK (.NET + Java) and CLI, following existing patterns.

