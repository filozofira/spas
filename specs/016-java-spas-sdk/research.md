# Research: Java SPAS SDK

**Feature**: 016-java-spas-sdk  
**Date**: 2025-12-19  
**Phase**: 0 - Outline & Research

## Research Tasks

### 1. Java Annotation Processing (JSR 269)

**Task**: Research best practices for compile-time annotation processing in Java 17+

**Decision**: Use `javax.annotation.processing.AbstractProcessor` with incremental processing support

**Rationale**:
- JSR 269 is the standard API for compile-time annotation processing since Java 6
- Well-supported by Maven via `maven-compiler-plugin` with `annotationProcessorPaths`
- Generates source/resources during compilation phase, ideal for `spas.json` generation
- Separate processor module avoids circular dependencies (processor cannot depend on processed code)

**Alternatives Considered**:
- **Reflection at runtime**: Rejected - metadata needed at build time for CLI/Repository consumption
- **Gradle annotation processing**: Out of scope per spec; Maven-first approach
- **ByteBuddy/ASM bytecode generation**: Overkill for metadata generation; adds complexity

**Implementation Notes**:
- Processor must be in separate Maven module (`spas-sdk-metadata-processor`)
- Register via `META-INF/services/javax.annotation.processing.Processor`
- Use `Filer.createResource()` to write `spas.json` to `CLASS_OUTPUT` (`target/classes/`)
- Support incremental compilation with `@SupportedOptions` and `processingEnv.getOptions()`

---

### 2. JSON Serialization Library

**Task**: Select JSON library for metadata generation and event serialization

**Decision**: Jackson 2.x with `jackson-databind`

**Rationale**:
- Industry standard for Java JSON processing
- Excellent support for Java records (Java 17+)
- Spring Boot's default serializer (seamless integration)
- Mature, well-documented, high performance
- Supports schema generation plugins if needed later

**Alternatives Considered**:
- **Gson**: Simpler but less feature-rich; record support requires configuration
- **JSON-B (Jakarta)**: Standard but less widely adopted; fewer ecosystem integrations
- **Moshi**: Kotlin-first; less natural for pure Java projects

**Implementation Notes**:
- Use `ObjectMapper` with `JavaTimeModule` for date/time types
- Configure for kebab-case with `PropertyNamingStrategies.KEBAB_CASE` where appropriate
- Use `@JsonProperty` annotations for explicit field naming control

---

### 3. HTTP Client for Sidecar Communication

**Task**: Select HTTP client for publishing events to sidecar

**Decision**: `java.net.http.HttpClient` (Java 11+ built-in)

**Rationale**:
- Zero external dependencies
- Async support with `CompletableFuture` (`sendAsync()`)
- HTTP/2 support out of the box
- Modern API design (builder pattern, immutable requests)
- Sufficient for simple POST requests to local sidecar

**Alternatives Considered**:
- **OkHttp**: Feature-rich but adds dependency; overkill for local sidecar calls
- **Apache HttpClient 5**: Mature but heavy; unnecessary complexity
- **Spring WebClient**: Reactive; adds Spring WebFlux dependency

**Implementation Notes**:
- Create single `HttpClient` instance per `EventPublisher` (thread-safe, connection pooling)
- Use `HttpRequest.BodyPublishers.ofString()` for JSON payloads
- Set reasonable timeouts (connect: 5s, request: 30s)
- Handle `HttpTimeoutException`, `ConnectException` with clear error messages

---

### 4. Thread-Local Context Propagation

**Task**: Research patterns for async-safe context propagation in Java

**Decision**: `InheritableThreadLocal` with explicit propagation utilities for `CompletableFuture`

**Rationale**:
- `InheritableThreadLocal` automatically propagates to child threads (thread pool scenarios)
- Standard Java mechanism; no external dependencies
- Spring's `RequestContextHolder` uses similar pattern
- Explicit propagation needed for `CompletableFuture` (uses common fork-join pool)

**Alternatives Considered**:
- **ThreadLocal only**: Doesn't propagate to child threads; breaks in async scenarios
- **Project Reactor Context**: Adds reactive dependency; overkill for non-reactive services
- **OpenTelemetry Context**: Could use, but adds heavyweight dependency

**Implementation Notes**:
- `SpasContext` uses `InheritableThreadLocal<SpasContext>`
- `SpasTrace` uses `InheritableThreadLocal<SpasTrace>`
- Provide `SpasContext.wrap(Runnable)` and `SpasContext.wrap(Callable)` for explicit propagation
- Spring filter sets context on request entry, clears on exit

---

### 5. Spring Boot Integration Pattern

**Task**: Research Spring Boot 3.x auto-configuration patterns

**Decision**: Use `@AutoConfiguration` with conditional beans and optional `@EnableSpas` annotation

**Rationale**:
- Spring Boot 3.x uses `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
- Conditional beans (`@ConditionalOnClass`, `@ConditionalOnMissingBean`) for opt-in behavior
- `@EnableSpas` provides explicit activation for developers who prefer it
- Follows Spring Boot starter conventions

**Alternatives Considered**:
- **Manual configuration only**: Poor developer experience; violates convention-over-configuration
- **AOP aspects**: Heavy-handed; simple filter is sufficient for context extraction

**Implementation Notes**:
- `SpasAutoConfiguration` registers `SpasContextFilter`, `EventPublisher` beans
- `@ConditionalOnProperty(prefix = "spas", name = "enabled", matchIfMissing = true)`
- Configuration properties: `spas.service-name`, `spas.sidecar.url`, `spas.sidecar.host/port`
- Filter order: high precedence (early in chain) to capture trace context

---

### 6. W3C Trace Context Format

**Task**: Validate W3C Trace Context format for `traceparent` header

**Decision**: Implement per W3C Trace Context Level 1 specification

**Format**: `{version}-{trace-id}-{parent-id}-{trace-flags}`
- version: 2 hex chars (currently `00`)
- trace-id: 32 hex chars (16 bytes)
- parent-id: 16 hex chars (8 bytes)  
- trace-flags: 2 hex chars (sampled = `01`)

**Example**: `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01`

**Implementation Notes**:
- Parse incoming `traceparent` header in filter
- Generate new trace-id/span-id if none present
- Store in `SpasTrace.current()`
- Propagate to outgoing requests via `EventPublisher`
- Support `tracestate` header for vendor-specific data (pass-through)

---

### 7. Maven Multi-Module Project Structure

**Task**: Validate Maven multi-module structure for SDK

**Decision**: Parent POM with 6 modules, dependency management via `<dependencyManagement>`

**Module Dependency Graph**:
```
spas-sdk-core              ← no SDK dependencies
spas-sdk-metadata          ← depends on core
spas-sdk-metadata-processor ← depends on metadata (compile-only)
spas-sdk-events            ← depends on core
spas-sdk-spring            ← depends on core, metadata, events
examples/sample-service    ← depends on spring (uses all transitively)
```

**Implementation Notes**:
- Parent POM: Java 17 target, Maven 3.8+ enforced via `maven-enforcer-plugin`
- Shared dependency versions in `<dependencyManagement>`: Jackson, JUnit 5, Mockito
- Each module has own `pom.xml` with minimal configuration
- Use `<relativePath>../pom.xml</relativePath>` for parent resolution
- Annotation processor registered via `annotationProcessorPaths` in sample-service

---

## Resolved Clarifications

| Topic | Resolution | Source |
|-------|------------|--------|
| Error handling on sidecar failure | Throw immediately; no retry | Clarification session |
| Missing SERVICE_NAME behavior | Fail fast at startup | Clarification session |
| Java records support | Jackson 2.x supports records natively | Research |
| Spring Boot version | 3.x (Jakarta EE namespace) | Current standard |
| Compile-time vs runtime metadata | Compile-time via annotation processor | Spec requirement |

## Technology Stack Summary

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Java | 17+ |
| Build | Maven | 3.8+ |
| JSON | Jackson | 2.17+ |
| HTTP | java.net.http.HttpClient | Java 17 built-in |
| Testing | JUnit 5, Mockito, WireMock | 5.10+, 5.x, 3.x |
| Spring | Spring Boot | 3.2+ |
| Context | InheritableThreadLocal | Java built-in |
| Annotation Processing | JSR 269 | Java built-in |
