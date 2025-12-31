# Implementation Plan: Java SDK Optional Path Attribute

**Branch**: `027-java-optional-path` | **Date**: 2025-12-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/027-java-optional-path/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Make the `path` attribute optional in `@SpasCommand` and `@SpasQuery` Java annotations. The runtime metadata generator (`SpasMetadataArchiveGenerator`) already infers paths from Spring annotations (`@RequestMapping`, `@PostMapping`, etc.) and only uses the explicit `path` as a fallback. This change formalizes that behavior, achieving parity with the .NET SDK where `Path` is already optional. The compile-time processor will emit a clear error when path is missing and compile-time generation is explicitly enabled.

## Technical Context

**Language/Version**: Java 17+  
**Primary Dependencies**: Spring Boot 3.x, Spring Web annotations  
**Storage**: N/A  
**Testing**: JUnit 5, compile-testing library (for annotation processor)  
**Target Platform**: JVM (Spring Boot applications)  
**Project Type**: SDK library + CLI templates + example services  
**Performance Goals**: N/A (no runtime performance impact - annotation change only)  
**Constraints**: Backward compatible - existing code with explicit `path` must continue to work  
**Scale/Scope**: 2 annotation classes, 1 processor class, 2 example services, 1 agent template

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context Per Service | ✅ PASS | SDK change, not service change |
| II. No Direct Service-to-Service Communication | ✅ PASS | Not applicable - annotation metadata only |
| III. Event-First Integration | ✅ PASS | Not applicable - annotation metadata only |
| IV. Convention Over Configuration | ✅ PASS | Improves convention - path inferred from Spring annotations |
| V. Security by Default | ✅ PASS | No security impact |
| VI. Observability First | ✅ PASS | No observability impact |
| VII. Portable Packaging | ✅ PASS | No packaging impact |
| VIII. Adaptable Through Configuration | ✅ PASS | Improves adaptability - less redundant configuration |
| SDK Quality Gates | ✅ PASS | Unit tests required for annotation processor changes |

**Gate Status**: PASS - No violations. Feature aligns with constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/027-java-optional-path/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
├── checklists/
│   └── requirements.md  # Specification validation
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
components/sdk/java/
├── spas-sdk-metadata/
│   └── src/main/java/io/spas/sdk/metadata/annotations/
│       ├── SpasCommand.java           # FR-001: path() default ""
│       └── SpasQuery.java             # FR-002: path() default ""
├── spas-sdk-metadata-processor/
│   └── src/main/java/io/spas/sdk/metadata/processor/
│       └── SpasAnnotationProcessor.java  # FR-009: validation when enabled
│   └── src/test/java/io/spas/sdk/metadata/processor/
│       └── SpasAnnotationProcessorTest.java  # New tests for validation
└── spas-sdk-spring/
    └── src/main/java/io/spas/sdk/spring/
        └── SpasMetadataArchiveGenerator.java  # FR-007: warning for missing path

components/cli/spas-service/
└── templates/
    └── agent-prompt.eta              # FR-015: Update Java pattern

examples/services/
├── basket-service/
│   └── src/main/java/.../controller/
│       └── BasketController.java     # FR-013: Remove redundant path
└── fulfillment-service/
    └── src/main/java/.../controller/
        ├── FulfillmentController.java  # FR-013: Remove redundant path
        └── ShipmentController.java     # FR-013: Remove redundant path
```

**Structure Decision**: Existing SDK structure - no new directories. Changes are localized to annotation definitions, processor validation, and example services.

## Complexity Tracking

> No constitution violations - table not required.
