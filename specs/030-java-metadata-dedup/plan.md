# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Java SDK will be refactored to use the `@SpasService` annotation on the main application class as the primary source of truth for service identity (`id`, `boundedContext`, `version`). This eliminates the need to duplicate these values in `application.yml`, while still allowing `application.yml` to override them if necessary. The system will fail startup if multiple annotations are found or if the identity is incomplete.

## Technical Context

**Language/Version**: Java 17
**Primary Dependencies**: Spring Boot 3.2.5, Jackson 2.17.2
**Storage**: N/A
**Testing**: JUnit 5.10.2, Mockito 5.11.0
**Target Platform**: JVM (Java 17+)
**Project Type**: Java SDK (Maven multi-module)
**Performance Goals**: Minimal startup impact (scan only main class)
**Constraints**: Must maintain backward compatibility with existing `application.yml` configuration precedence.
**Scale/Scope**: Affects `spas-sdk-spring` and `spas-sdk-metadata` modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single Bounded Context**: **COMPLIANT**. The `@SpasService` annotation enforces a single `boundedContext` definition.
- **II. No Direct Communication**: **N/A**. Feature concerns metadata, not communication.
- **III. Event-First Integration**: **N/A**.
- **IV. Convention Over Configuration**: **COMPLIANT**. Reduces explicit configuration in `application.yml` in favor of code-level metadata conventions.

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

### Source Code (repository root)

```text
components/sdk/java/
├── spas-sdk-metadata/
│   └── src/main/java/io/spas/sdk/metadata/annotation/
│       └── SpasService.java
├── spas-sdk-spring/
│   └── src/main/java/io/spas/sdk/spring/
│       ├── config/
│       │   └── SpasServiceConfiguration.java
│       └── context/
│           └── SpasServiceContext.java
```

**Structure Decision**: Modifying existing `spas-sdk-spring` and `spas-sdk-metadata` modules.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
