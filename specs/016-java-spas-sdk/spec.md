# Feature Specification: Java SPAS SDK

**Feature Branch**: `016-java-spas-sdk`  
**Created**: December 19, 2025  
**Status**: Draft  
**Input**: User description: "Build a Java SPAS SDK equivalent to the .NET SDK in components/sdk/dotnet/. Include a SampleService for testing. Target Java 17+, Maven."

## Clarifications

### Session 2025-12-19

- Q: When EventPublisher fails to reach the sidecar, what should the SDK's default behavior be? → A: Throw immediately (no retry) - application decides retry policy
- Q: When SERVICE_NAME environment variable is not set and cannot be derived, what should the SDK do? → A: Fail fast at startup with clear error message requiring explicit configuration

## Overview

Create a Java SDK for building SPAS (Self-contained, Portable, Adaptable Services) that mirrors the functionality of the existing .NET SDK. The Java SDK enables Java developers to build services that:

- Publish rich metadata (`spas.json`) describing contracts, security, and capabilities
- Communicate via events through the SPAS sidecar
- Propagate distributed trace context (W3C Trace Context)
- Maintain portable, vendor-agnostic architecture

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Metadata Generation with Annotations (Priority: P1) 🎯 MVP

A Java developer decorates their Spring Boot or JAX-RS endpoints with SPAS annotations (`@SpasCommand`, `@SpasQuery`, `@SpasEvent`) and builds the project. Maven generates a valid `spas.json` file containing service identity, contracts (endpoints + events), security, consistency, and network metadata aligned with the design-time-metadata-v1 schema.

**Why this priority**: Without metadata generation, services cannot be published to the SPAS Repository or discovered by composition tools. This is the foundational capability that enables all other SPAS integration.

**Independent Test**: Create a minimal Java service with annotated endpoints, run `mvn compile`, verify `target/spas/spas.json` is generated and validates against the design-time-metadata-v1 schema.

**Acceptance Scenarios**:

1. **Given** a Java class with `@SpasCommand("CreateOrder", version="1.0")` on a method, **When** Maven compiles the project, **Then** `spas.json` contains an endpoint entry with `name: "create-order"`, `type: "Command"`, `version: "1.0"`
2. **Given** a Java class annotated with `@SpasEvent("OrderCreated", version="1.0")`, **When** Maven compiles the project, **Then** `spas.json` contains an event entry with `type: "order-created"`, `version: "1.0"`
3. **Given** service identity configured via `ServiceIdentityBuilder`, **When** Maven compiles, **Then** `spas.json` contains correct `id`, `name`, `version`, `boundedContext`, `capabilities`
4. **Given** an invalid configuration (missing required fields), **When** Maven compiles, **Then** build fails with clear error message

---

### User Story 2 - Event Publishing to Sidecar (Priority: P1) 🎯 MVP

A Java service uses `EventPublisher.publishAsync(payload)` to send domain events to the SPAS sidecar. The SDK automatically populates required headers (`traceparent`, `x-service-name`, `x-event-name`, `x-correlation-id`) and sends the raw JSON payload. The sidecar handles CloudEvents wrapping and topic routing.

**Why this priority**: Event publishing is the core integration mechanism for SPAS services. Without it, services cannot participate in choreography.

**Independent Test**: Mock sidecar endpoint, call `EventPublisher.publishAsync()`, verify HTTP POST with correct headers and JSON payload.

**Acceptance Scenarios**:

1. **Given** an `EventPublisher` configured with sidecar URL and service name, **When** `publishAsync(new OrderCreatedEvent(...))` is called, **Then** HTTP POST to `{sidecar}/publish` includes `x-service-name`, `x-event-name: order-created`, `traceparent` headers
2. **Given** a traced request context, **When** publishing an event, **Then** `traceparent` header contains the current trace/span IDs
3. **Given** `SpasContext` with user/tenant identity, **When** publishing an event, **Then** `x-user-id` and `x-tenant-id` headers are included
4. **Given** sidecar is unreachable, **When** publishing an event, **Then** exception is thrown with clear error message (service decides retry policy)

---

### User Story 3 - Fluent Builders for Metadata Composition (Priority: P2)

A Java developer uses fluent builder APIs (`ServiceIdentityBuilder`, `SecurityBuilder`, `ConsistencyBuilder`, `NetworkBuilder`) to programmatically compose service metadata, complementing annotation-based discovery.

**Why this priority**: Builders provide flexibility for complex configurations and enable metadata composition at runtime. Annotations alone may not cover all scenarios.

**Independent Test**: Use builders to construct full service metadata, serialize to JSON, validate structure matches expected format.

**Acceptance Scenarios**:

1. **Given** `ServiceIdentityBuilder.withId("order-service").withBoundedContext("orders").addCapability("order-management")`, **When** `build()` is called, **Then** returns valid `ServiceIdentity` object
2. **Given** `SecurityBuilder.withAuthenticationType("jwt").addDataClassification("confidential")`, **When** `build()` is called, **Then** returns valid `Security` object
3. **Given** `ConsistencyBuilder.withCommands("ACID").withQueries("EVENTUAL")`, **When** `build()` is called, **Then** returns valid `Consistency` object

---

### User Story 4 - Trace Context Propagation (Priority: P2)

The SDK provides middleware/filters that extract W3C Trace Context from incoming requests, populate `SpasTrace` for the current execution, and propagate context to outgoing events and HTTP calls.

**Why this priority**: Distributed tracing is essential for observability in microservices. Without trace propagation, debugging distributed flows becomes impossible.

**Independent Test**: Simulate incoming request with `traceparent` header, verify context is available in handler, verify outgoing event includes same trace context.

**Acceptance Scenarios**:

1. **Given** incoming HTTP request with `traceparent: 00-{trace-id}-{span-id}-01`, **When** middleware processes request, **Then** `SpasTrace.current()` returns populated trace context
2. **Given** populated `SpasTrace`, **When** calling `EventPublisher.publishAsync()`, **Then** outgoing request includes matching `traceparent` header
3. **Given** no incoming trace context, **When** middleware processes request, **Then** new trace context is generated

---

### User Story 5 - Identity Context Propagation (Priority: P3)

The SDK provides `SpasContext` that captures user/tenant identity from incoming requests and makes it available throughout request processing. Identity propagates to outgoing events.

**Why this priority**: Multi-tenant scenarios require identity propagation, but basic SPAS functionality works without it.

**Independent Test**: Simulate request with `x-user-id` and `x-tenant-id` headers, verify `SpasContext` is populated, verify outgoing events include identity headers.

**Acceptance Scenarios**:

1. **Given** incoming request with `x-user-id: user-123`, **When** middleware processes request, **Then** `SpasContext.current().getUserId()` returns `"user-123"`
2. **Given** populated `SpasContext`, **When** publishing event, **Then** `x-user-id` and `x-tenant-id` headers are included

---

### User Story 6 - SampleService Reference Implementation (Priority: P3)

A complete working example service demonstrates all SDK features: annotations, event publishing, builders, trace propagation, and identity context. Serves as reference for Java developers adopting SPAS.

**Why this priority**: Examples accelerate adoption but are not required for SDK functionality.

**Independent Test**: Build and run SampleService, verify it generates valid `spas.json`, can publish events to mock sidecar.

**Acceptance Scenarios**:

1. **Given** SampleService source code, **When** `mvn clean compile` is run, **Then** valid `spas.json` is generated in `target/spas/`
2. **Given** SampleService running with mock sidecar, **When** POST to `/commands/create-order`, **Then** event is published to sidecar with correct headers

---

### Edge Cases

- What happens when annotation processor encounters invalid annotation values? → Build fails with descriptive error
- How does SDK handle missing `SERVICE_NAME` environment variable? → Fail fast at startup with clear error message; explicit configuration required
- What happens when sidecar URL is not configured? → Clear error at first publish attempt
- How does SDK handle Java records vs classes for event types? → Both should be supported for payload serialization
- What happens when sidecar is unreachable (timeout, connection refused, 5xx)? → SDK throws immediately; application decides retry policy (no built-in retry)

## Requirements *(mandatory)*

### Functional Requirements

#### Annotations & Metadata

- **FR-001**: SDK MUST provide `@SpasCommand` annotation with `name` and `version` parameters for marking command endpoints
- **FR-002**: SDK MUST provide `@SpasQuery` annotation with `name` and `version` parameters for marking query endpoints  
- **FR-003**: SDK MUST provide `@SpasEvent` annotation with `name` and `version` parameters for marking event types
- **FR-004**: Annotation processor MUST generate `spas.json` at compile time in `target/spas/` directory
- **FR-005**: Generated `spas.json` MUST validate against `design-time-metadata-v1.schema.json`
- **FR-006**: Event and endpoint names MUST be normalized to kebab-case in generated metadata (e.g., `OrderCreated` → `order-created`)

#### Builders

- **FR-007**: SDK MUST provide `ServiceIdentityBuilder` for constructing service identity (id, name, version, boundedContext, capabilities)
- **FR-008**: SDK MUST provide `SecurityBuilder` for configuring authentication type and data classification
- **FR-009**: SDK MUST provide `ConsistencyBuilder` for specifying consistency guarantees (commands: ACID/EVENTUAL, queries: STRONG/EVENTUAL)
- **FR-010**: SDK MUST provide `NetworkBuilder` for declaring required egress dependencies
- **FR-011**: SDK MUST provide `MetadataComposer` to combine identity, contracts, security, consistency, network into complete metadata

#### Event Publishing

- **FR-012**: SDK MUST provide `EventPublisher` class for publishing events to sidecar
- **FR-013**: `EventPublisher` MUST send HTTP POST to sidecar `/publish` endpoint with raw JSON payload
- **FR-014**: `EventPublisher` MUST include `traceparent` header with W3C Trace Context
- **FR-015**: `EventPublisher` MUST include `x-service-name` header with configured service name
- **FR-016**: `EventPublisher` MUST include `x-event-name` header with kebab-case event name (derived from `@SpasEvent` annotation)
- **FR-017**: `EventPublisher` MUST include `x-correlation-id` header from current context
- **FR-018**: `EventPublisher` SHOULD include `x-user-id` and `x-tenant-id` headers when available in `SpasContext`

#### Context Management

- **FR-019**: SDK MUST provide `SpasTrace` for W3C Trace Context storage (ThreadLocal-based or equivalent)
- **FR-020**: SDK MUST provide `SpasContext` for correlation ID and identity storage
- **FR-021**: SDK MUST provide filter/interceptor to extract trace and identity from incoming HTTP headers
- **FR-022**: Context MUST be propagated to child threads/async operations (consider `InheritableThreadLocal` or similar)

#### Configuration

- **FR-023**: SDK MUST read `SERVICE_NAME` environment variable for service identification
- **FR-024**: SDK MUST support `SIDECAR_URL` environment variable for full sidecar URL
- **FR-025**: SDK MUST support `SIDECAR_HOST` + `SIDECAR_PORT` environment variables as fallback
- **FR-026**: SDK MUST derive sidecar host from service name if not explicitly configured (`{service-name}-sidecar`)

### Key Entities

- **ServiceMetadata**: Complete metadata structure matching design-time-metadata-v1 schema
- **ServiceIdentity**: Service identification (id, name, version, boundedContext, capabilities)
- **EndpointContract**: Endpoint definition (name, type, protocol, methodPath, version, schemaRef)
- **EventContract**: Event definition (type, version, schemaRef)
- **SpasTrace**: W3C Trace Context (traceId, spanId, traceFlags, traceState)
- **SpasContext**: Request context (correlationId, userId, tenantId)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Java developers can add SPAS metadata to a service by adding 3 dependencies and <10 lines of configuration
- **SC-002**: Generated `spas.json` passes validation against design-time-metadata-v1 schema in 100% of valid configurations
- **SC-003**: Event publishing round-trip to mock sidecar completes in <50ms for typical payloads
- **SC-004**: SampleService can be built and run without modification as a reference implementation
- **SC-005**: SDK supports Java 17+ and builds with Maven 3.8+
- **SC-006**: Test coverage for SDK modules exceeds 80%
- **SC-007**: SDK API surface mirrors .NET SDK for cross-platform consistency (annotation names, builder patterns, publisher API)

## Technical Notes

### Project Structure

```
components/sdk/java/
├── pom.xml                           # Parent POM
├── README.md
├── spas-sdk-core/                    # Core: SpasTrace, SpasContext, ThreadLocal context
│   ├── pom.xml
│   └── src/
├── spas-sdk-metadata/                # Metadata: Annotations, Builders, Composer
│   ├── pom.xml
│   └── src/
├── spas-sdk-metadata-processor/      # Annotation processor (separate artifact for compilation)
│   ├── pom.xml
│   └── src/
├── spas-sdk-events/                  # Event publishing
│   ├── pom.xml
│   └── src/
├── spas-sdk-spring/                  # Spring Boot integration (filters, auto-config)
│   ├── pom.xml
│   └── src/
└── examples/
    └── sample-service/               # Reference implementation
        ├── pom.xml
        └── src/
```

### Key Implementation Patterns

1. **Annotation Processing**: Use JSR 269 (javax.annotation.processing) to scan annotations at compile time
2. **JSON Serialization**: Jackson for JSON generation (aligns with Spring ecosystem)
3. **HTTP Client**: java.net.http.HttpClient (Java 11+) for sidecar communication
4. **Context Storage**: ThreadLocal with InheritableThreadLocal for async propagation
5. **Spring Integration**: Auto-configuration via `@EnableSpas` or Spring Boot starter

### Assumptions

- Services use HTTP (REST) endpoints; gRPC support is future enhancement
- Sidecar is always co-located (localhost or container sidecar pattern)
- Build tool is Maven (Gradle support is optional future enhancement)
- Primary framework integration is Spring Boot; JAX-RS support is secondary

## Dependencies

- **Compile-time**: design-time-metadata-v1.schema.json (for validation)
- **Runtime**: SPAS sidecar (for event publishing)
- **Test**: Mock HTTP server for sidecar simulation

## Out of Scope

- Runtime metadata enrichment (handled by Repository/CLI)
- CloudEvents envelope construction (handled by Sidecar)
- Topic routing configuration (handled by Sidecar)
- gRPC protocol support (future enhancement)
- Gradle build support (future enhancement)
