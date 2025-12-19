# Implementation Plan: Java SPAS SDK

**Branch**: `016-java-spas-sdk` | **Date**: 2025-12-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-java-spas-sdk/spec.md`

## Summary

Build a Java SDK equivalent to the .NET SDK (`components/sdk/dotnet/`) that enables Java developers to build SPAS-compliant services. The SDK provides annotations for contract declaration, compile-time metadata generation (`spas.json`), event publishing to sidecar, and W3C Trace Context propagation. Mirrors .NET SDK API surface for cross-platform consistency.

## Technical Context

**Language/Version**: Java 17+ (user has Java 21)
**Primary Dependencies**: Jackson (JSON), java.net.http.HttpClient, Spring Boot 3.x (optional integration)
**Storage**: N/A (SDK generates files, no runtime storage)
**Testing**: JUnit 5, Mockito, WireMock (mock sidecar)
**Target Platform**: JVM (server-side, containerized services)
**Project Type**: Multi-module Maven project
**Performance Goals**: Event publishing <50ms to sidecar
**Constraints**: No external infrastructure required locally; compile-time metadata generation
**Scale/Scope**: 5 SDK modules + 1 annotation processor + 1 sample service

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | ✅ PASS | SDK is tooling, not a service; enables bounded context declaration |
| II. No Direct S2S Communication | ✅ PASS | SDK publishes to sidecar only; no direct service calls |
| III. Event-First Integration | ✅ PASS | EventPublisher sends to sidecar; sidecar routes |
| IV. Convention Over Configuration | ✅ PASS | SERVICE_NAME, SIDECAR_URL env vars; kebab-case normalization |
| V. Security by Default | ✅ PASS | Identity propagation (x-user-id, x-tenant-id); trace context |
| VI. Observability First | ✅ PASS | W3C Trace Context propagation; correlation IDs |
| VII. Portable Packaging | N/A | SDK is library, not container |
| VIII. Adaptable Through Configuration | ✅ PASS | Metadata-driven; no code changes for transformations |
| SDK Quality Gates | ✅ PASS | Unit test coverage ≥80% specified; examples required |

**Gate Status**: ✅ PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/016-java-spas-sdk/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/sdk/java/
├── pom.xml                              # Parent POM (Java 17, Maven 3.8+)
├── README.md                            # SDK documentation
├── spas-sdk-core/
│   ├── pom.xml
│   └── src/
│       ├── main/java/io/spas/sdk/core/
│       │   ├── context/                 # SpasContext, SpasTrace
│       │   ├── config/                  # Configuration loading
│       │   └── util/                    # KebabCase converter, etc.
│       └── test/java/
├── spas-sdk-metadata/
│   ├── pom.xml
│   └── src/
│       ├── main/java/io/spas/sdk/metadata/
│       │   ├── annotations/             # @SpasCommand, @SpasQuery, @SpasEvent
│       │   ├── builders/                # ServiceIdentityBuilder, etc.
│       │   ├── model/                   # ServiceMetadata, EndpointContract, etc.
│       │   └── composer/                # MetadataComposer
│       └── test/java/
├── spas-sdk-metadata-processor/
│   ├── pom.xml
│   └── src/
│       ├── main/java/io/spas/sdk/metadata/processor/
│       │   └── SpasAnnotationProcessor.java
│       ├── main/resources/META-INF/services/
│       │   └── javax.annotation.processing.Processor
│       └── test/java/
├── spas-sdk-events/
│   ├── pom.xml
│   └── src/
│       ├── main/java/io/spas/sdk/events/
│       │   ├── EventPublisher.java
│       │   ├── EventPublisherConfig.java
│       │   └── SidecarClient.java
│       └── test/java/
├── spas-sdk-spring/
│   ├── pom.xml
│   └── src/
│       ├── main/java/io/spas/sdk/spring/
│       │   ├── SpasAutoConfiguration.java
│       │   ├── SpasContextFilter.java
│       │   └── EnableSpas.java
│       ├── main/resources/META-INF/
│       │   └── spring.factories (or spring/...AutoConfiguration.imports)
│       └── test/java/
└── examples/
    └── sample-service/
        ├── pom.xml
        └── src/main/java/io/spas/examples/orders/
            ├── SampleServiceApplication.java
            ├── OrderController.java
            └── events/OrderCreatedEvent.java
```

**Structure Decision**: Multi-module Maven project mirroring .NET SDK organization. Annotation processor is separate module to avoid circular dependencies. Spring integration is optional module.

## Complexity Tracking

> No violations to justify - Constitution Check passed.
