# Feature Specification: Java SDK Optional Path Attribute

**Feature Branch**: `027-java-optional-path`  
**Created**: 2025-12-31  
**Completed**: 2025-12-30
**Status**: ✅ Complete (PoC)
**Input**: User description: "Make the path attribute optional in @SpasCommand and @SpasQuery annotations for the Java SDK. Currently path is required, but this is redundant when using Spring controller annotations (@RequestMapping, @PostMapping, @GetMapping, etc.) which already define the route. The compile-time generation should be disabled by default on all example services, and when enabled, the compile-time processor validation must emit an error if both path attribute and Spring annotations are missing."

## Overview

The Java SDK currently requires developers to specify the `path` attribute in `@SpasCommand` and `@SpasQuery` annotations, even when the path is already defined via Spring's routing annotations (`@RequestMapping`, `@PostMapping`, `@GetMapping`, etc.). This creates unnecessary redundancy and maintenance burden.

**Example of current redundancy**:

```java
@SpasCommand(
    name = "CreateBasket",
    version = "1.0.0",
    path = "/api/baskets",  // Redundant - already defined below!
    description = "Creates a new shopping basket"
)
@PostMapping  // Combined with class-level @RequestMapping("/api/baskets")
public ResponseEntity<BasketResponse> createBasket(...) { }
```

The runtime metadata generator (`SpasMetadataArchiveGenerator`) already infers paths from Spring annotations and only uses the explicit `path` attribute as a fallback. This feature formalizes that behavior by making `path` optional, achieving parity with the .NET SDK where `Path` is already optional.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Optional Path in Runtime Metadata Generation (Priority: P1) 🎯 MVP

Java developers using Spring Boot controllers can omit the `path` attribute from `@SpasCommand` and `@SpasQuery` annotations when the route is already defined via Spring annotations. The `--generate-metadata` command continues to work correctly, inferring paths from `@RequestMapping`, `@PostMapping`, `@GetMapping`, etc.

**Why this priority**: This is the primary use case for the feature. All example services use runtime metadata generation via `--generate-metadata`, and eliminating redundant path declarations reduces maintenance burden and potential for path mismatches.

**Independent Test**: Create a Spring Boot controller with `@SpasCommand` without explicit `path`, run `java -jar ... --generate-metadata`, verify the generated metadata contains the correct path inferred from Spring annotations.

**Acceptance Scenarios**:

1. **Given** a controller with `@RequestMapping("/api/orders")` and a method with `@SpasCommand(name="CreateOrder", version="1.0")` and `@PostMapping`, **When** `--generate-metadata` runs, **Then** the endpoint path is `/api/orders`
2. **Given** a controller with `@RequestMapping("/api/orders")` and a method with `@SpasCommand(name="GetOrder", version="1.0")` and `@GetMapping("/{id}")`, **When** `--generate-metadata` runs, **Then** the endpoint path is `/api/orders/{id}`
3. **Given** a controller with `@SpasCommand` that includes explicit `path = "/custom/path"`, **When** `--generate-metadata` runs, **Then** the explicit path is used (backward compatibility)
4. **Given** a controller without `@RequestMapping` and a method with `@SpasCommand` without `path` and `@PostMapping("/direct")`, **When** `--generate-metadata` runs, **Then** the endpoint path is `/direct`

---

### User Story 2 - Disable Compile-Time Generation in Example Services (Priority: P2)

Example services in the repository should have compile-time metadata generation disabled by default to avoid confusion and ensure consistent behavior with the recommended `--generate-metadata` approach.

**Why this priority**: Ensures example services demonstrate the recommended pattern and prevents compile-time generation from being accidentally triggered. This is a configuration change, not a code change.

**Independent Test**: Build any example Java service with `mvn package` and verify that no `spas.json` is generated in the output. Compile-time generation should only occur when explicitly enabled via `-Aspas.generateSpasJson=true`.

**Acceptance Scenarios**:

1. **Given** the basket-service example project, **When** `mvn package` is run without additional flags, **Then** no `spas.json` is generated at compile time
2. **Given** the fulfillment-service example project, **When** `mvn package` is run without additional flags, **Then** no `spas.json` is generated at compile time
3. **Given** any example Java service with `<arg>-Aspas.generateSpasJson=true</arg>` in pom.xml, **When** this feature is implemented, **Then** that compiler argument is removed

---

### User Story 3 - Compile-Time Processor Validation (Priority: P3)

When compile-time metadata generation is explicitly enabled via `-Aspas.generateSpasJson=true`, the annotation processor should emit a clear compile error if a `@SpasCommand` or `@SpasQuery` has neither an explicit `path` attribute nor Spring routing annotations that can be resolved at compile time.

**Why this priority**: The compile-time processor cannot reliably infer paths from Spring annotations (it runs before Spring context is available). This validation provides clear feedback rather than silent failures. This is a nice-to-have safety net for the rare case where compile-time generation is used.

**Independent Test**: Create a test class with `@SpasCommand` without `path` and without Spring annotations, compile with `-Aspas.generateSpasJson=true`, verify a compile error is emitted.

**Acceptance Scenarios**:

1. **Given** compile-time generation is enabled and a method has `@SpasCommand(name="Test", version="1.0")` without `path` and without any Spring mapping annotation, **When** compilation runs, **Then** a compile error is emitted: "SpasCommand requires explicit 'path' attribute when compile-time generation is enabled and no Spring mapping annotation is present"
2. **Given** compile-time generation is enabled and a method has `@SpasCommand(name="Test", version="1.0", path="/api/test")`, **When** compilation runs, **Then** no error is emitted (explicit path provided)
3. **Given** compile-time generation is disabled (default), **When** compilation runs with `@SpasCommand` without `path`, **Then** no error is emitted (runtime will handle it)

---

### User Story 4 - Update Example Services (Priority: P2)

Remove redundant `path` attributes from `@SpasCommand` and `@SpasQuery` annotations in example services to demonstrate the simplified annotation pattern.

**Why this priority**: Examples should demonstrate best practices. Removing redundant paths makes the examples cleaner and validates the feature works correctly.

**Independent Test**: Run `Get-ServiceMetadata.ps1` after updating example services, verify all Java services generate correct metadata with inferred paths.

**Acceptance Scenarios**:

1. **Given** basket-service with redundant `path` attributes removed, **When** `--generate-metadata` runs, **Then** all endpoint paths match the previous output
2. **Given** fulfillment-service with redundant `path` attributes removed, **When** `--generate-metadata` runs, **Then** all endpoint paths match the previous output
3. **Given** any example service, **When** comparing metadata before and after path removal, **Then** the generated `spas.json` content is identical
4. **Given** `spas-service init` generates a Java Spring Boot service, **When** the agent scaffolds controller code, **Then** `@SpasCommand` and `@SpasQuery` annotations do NOT include the `path` attribute

---

### Edge Cases

- **No Spring annotation and no path**: Runtime generator should skip the endpoint with a warning (not fail silently)
- **Multiple HTTP method annotations**: Method with both `@PostMapping` and `@PutMapping` - current behavior preserved
- **Path parameter variations**: `{id}`, `{id?}`, `{id:regex}` patterns should be preserved correctly
- **Absolute vs relative paths**: Method-level `@PostMapping("/absolute")` should take precedence over class-level `@RequestMapping`
- **Empty path attribute**: `path = ""` should be treated as "not specified" and trigger inference

## Requirements _(mandatory)_

### Functional Requirements

#### Annotation Changes

- **FR-001**: `@SpasCommand.path()` MUST change from required `String path()` to optional `String path() default ""`
- **FR-002**: `@SpasQuery.path()` MUST change from required `String path()` to optional `String path() default ""`
- **FR-003**: Empty string for `path` MUST be treated as "not specified" (trigger path inference)
- **FR-004**: Explicit non-empty `path` MUST take precedence over Spring annotation inference (backward compatibility)

#### Runtime Metadata Generation

- **FR-005**: `SpasMetadataArchiveGenerator` MUST continue to infer paths from Spring annotations when `path` is empty/not specified
- **FR-006**: Runtime generator MUST combine class-level `@RequestMapping` with method-level `@PostMapping`/`@GetMapping`/etc.
- **FR-007**: Runtime generator MUST emit a warning (not error) when path cannot be inferred and no explicit path is provided
- **FR-008**: Generated metadata format MUST remain unchanged (no impact on consumers)

#### Compile-Time Generation

- **FR-009**: Compile-time processor MUST emit a compile error when `path` is empty AND no explicit path can be determined AND `-Aspas.generateSpasJson=true` is set
- **FR-010**: Compile error message MUST clearly explain that explicit `path` is required for compile-time generation without Spring runtime context
- **FR-011**: When `-Aspas.generateSpasJson=true` is NOT set, processor MUST NOT emit errors for missing `path` (runtime will handle it)

#### Example Services

- **FR-012**: Example Java services MUST NOT include `-Aspas.generateSpasJson=true` in their Maven configuration
- **FR-013**: Example Java services MUST remove redundant `path` attributes from `@SpasCommand` and `@SpasQuery` annotations
- **FR-014**: Example Java services MUST continue to produce identical metadata after path attribute removal

#### Agent Prompts

- **FR-015**: `spas-service init` agent prompts MUST be updated to instruct the LLM not to include `path` attribute in `@SpasCommand`/`@SpasQuery` when scaffolding Java Spring Boot controllers

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Java developers can write `@SpasCommand(name="X", version="1.0")` without `path` and get correct metadata generation
- **SC-002**: All example Java services (basket-service, fulfillment-service) generate identical metadata before and after path removal
- **SC-003**: Compile-time generation with `-Aspas.generateSpasJson=true` fails with clear error when path cannot be determined
- **SC-004**: `Get-ServiceMetadata.ps1` completes successfully for all services after the change
- **SC-005**: No breaking changes to existing services using explicit `path` attributes

## Assumptions

- Developers primarily use runtime metadata generation (`--generate-metadata`) rather than compile-time generation
- The compile-time annotation processor is opt-in and rarely used (per existing `-Aspas.generateSpasJson=true` flag)
- Spring Boot controllers use standard routing annotations (`@RequestMapping`, `@PostMapping`, etc.)
- The runtime generator's existing path inference logic is correct and well-tested

## Out of Scope

- Adding compile-time path inference from Spring annotations (would require complex annotation mirror processing)
- Changes to .NET SDK (already has optional `Path`)
- Changes to metadata schema or format
- Changes to gRPC path handling (HTTP-only feature)

## Dependencies

- Builds on feature 016 (Java SPAS SDK) - core annotation infrastructure
- Builds on feature 017 (Metadata Descriptions) - current annotation structure
- Related to feature 026 (.NET Controller Support) - parity reference
