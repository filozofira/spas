# Implementation Plan: Java 21 Upgrade

**Branch**: `031-java-21-upgrade` | **Date**: January 2, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/031-java-21-upgrade/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Upgrade Java SDK and all example services from Java 17 to Java 21. This is a straightforward version bump requiring updates to POM files and Dockerfiles. No code changes expected - Java 21 maintains backward compatibility with Java 17. Approach: Update SDK first (mvn install), then example services, finally Dockerfiles.

## Technical Context

**Language/Version**: Java 21 (upgrading from Java 17)  
**Primary Dependencies**: Maven 3.8+, Spring Boot 3.4.1 (example services), Jackson 2.17.2  
**Storage**: N/A  
**Testing**: JUnit 5.10.2, Mockito 5.11.0 (existing test suites)  
**Target Platform**: JVM (Java 21+)  
**Project Type**: SDK library (Maven multi-module) + example services  
**Performance Goals**: Build time within 5% of Java 17 baseline  
**Constraints**: Backward compatibility - all existing tests must pass without code changes  
**Scale/Scope**: 1 parent POM + 6 SDK modules + 4 example services + 3 Dockerfiles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Result**: ✅ NO VIOLATIONS

**Analysis**:
- **Single Bounded Context**: N/A - Infrastructure upgrade, no new services or bounded contexts
- **No Direct Communication**: N/A - No changes to service communication patterns
- **Event-First Integration**: N/A - No changes to integration patterns
- **Convention Over Configuration**: N/A - No changes to naming conventions
- **SDK Boundaries**: N/A - No changes to SDK responsibilities or API contracts
- **Transformation Language**: N/A - No changes to sidecar transformations
- **Documentation Standards**: ✅ Following speckit workflow with spec.md, plan.md, research.md, etc.
- **Testing Requirements**: ✅ All existing tests must pass (FR-008, SC-002)

This is a pure version upgrade with no architectural changes. All constitution principles remain satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/031-java-21-upgrade/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file (Phase 0-1 output)
├── research.md          # Phase 0 output (minimal - Java 21 compatibility)
├── data-model.md        # N/A for infrastructure upgrade
├── quickstart.md        # Phase 1 output (upgrade steps)
├── contracts/           # N/A for infrastructure upgrade
└── checklists/
    └── requirements.md  # Requirements validation (COMPLETE)
```

### Source Code (repository root)

```text
components/sdk/java/
├── pom.xml                               # Parent POM: java.version=17 → 21
├── spas-sdk-core/pom.xml                 # Module POM (inherits from parent)
├── spas-sdk-metadata/pom.xml             # Module POM (inherits from parent)
├── spas-sdk-metadata-processor/pom.xml   # Module POM (inherits from parent)
├── spas-sdk-events/pom.xml               # Module POM (inherits from parent)
├── spas-sdk-spring/pom.xml               # Module POM (inherits from parent)
├── spas-sdk-observability/pom.xml        # Module POM (inherits from parent)
└── examples/
    └── sample-service/pom.xml            # Sample service: java.version=17 → 21

examples/services/
├── basket-service/
│   ├── pom.xml                           # Service POM: java.version=17 → 21
│   ├── Dockerfile                        # Base image: temurin:17 → temurin:21
│   └── README.md                         # Requirements: Java 17 → 21
├── rental-service/
│   ├── pom.xml                           # Service POM: java.version=17 → 21
│   ├── Dockerfile                        # Base image: temurin:17 → temurin:21
│   └── README.md                         # Requirements: Java 17 → 21
└── fulfillment-service/
    ├── pom.xml                           # Service POM: java.version=17 → 21
    ├── Dockerfile                        # Base image: temurin:17 → temurin:21
    └── README.md                         # Requirements: Java 17 → 21

Documentation (repository wide - excluding historical specs/001-030)
├── README.md                                      # System requirements
├── components/sdk/java/README.md                  # Prerequisites
├── components/sdk/java/CONTRIBUTING.md            # Development setup
└── [other READMEs with Java version references]

CLI Templates (spas-service)
├── templates/partials/sdk-patterns.eta            # Java version in generated POMs
└── [agent prompt templates]                       # Java version in generated instructions
```

**Structure Decision**: Infrastructure upgrade affecting Maven POMs, Dockerfiles, documentation, and CLI templates. No source code changes required. SDK modules inherit java.version from parent POM, simplifying the upgrade to a single change in the parent. Documentation and CLI template updates ensure users and generated projects see current requirements.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Result**: N/A - No constitution violations detected. This is a straightforward infrastructure upgrade with no architectural implications.
