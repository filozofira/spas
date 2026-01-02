# Feature Specification: Remove Redundant Java SDK Metadata

**Feature Branch**: `030-java-metadata-dedup`
**Created**: 2026-01-02
**Status**: Completed
**Completed**: 2026-01-02
**Input**: User description: "Remove redundant service metadata declaration from Java SDK component. Concretely there IS duplication between application.yml and @SpasService annotation. The @SpasService annotation is used for **metadata generation** (design-time), while application.yml configuration is for **runtime behavior**. However, the duplication of `id`, `bounded-context`, and `version` seems unnecessary."

## Implementation Summary

**Result**: Successfully removed redundant `spas.service.*` configuration from all example services. The SDK's `SpasMetadataArchiveGenerator` already reads service identity directly from the `@SpasService` annotation during metadata generation, so no SDK code changes were needed.

**Files Modified**:
- `examples/services/basket-service/src/main/resources/application.yml`
- `examples/services/rental-service/src/main/resources/application.yml`
- `examples/services/fulfillment-service/src/main/resources/application.yml`
- `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasService.java` (Javadoc updated)
- `specs/030-java-metadata-dedup/quickstart.md` (Documentation updated)

## Clarifications

### Session 2026-01-02

- Q: How should the system handle multiple `@SpasService` annotations found in the application context? → A: Fail startup with a clear error message.
- Q: Where must the `@SpasService` annotation be placed to be detected? → A: On the main application class (annotated with `@SpringBootApplication`).
- Q: Are the attributes in `@SpasService` mandatory or optional? → A: All attributes (`id`, `boundedContext`, `version`) are mandatory.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Source of Truth for Service Identity (Priority: P1)

As a Java developer, I want to define my service's identity (ID, Bounded Context, Version) solely using the `@SpasService` annotation, so that I do not need to duplicate this information in `application.yml`.

**Why this priority**: This is the core value of the feature, eliminating redundancy and potential inconsistencies between design-time metadata and runtime configuration.

**Independent Test**: Create a minimal Java SPAS service that uses `@SpasService` but does not contain any `spas.service` properties in `application.yml`. Verify that the service starts correctly and identifies itself with the values from the annotation.

**Acceptance Scenarios**:

1. **Given** a Java application annotated with `@SpasService(id="order-service", boundedContext="sales", version="1.0.0")` and NO corresponding properties in `application.yml`, **When** the application starts, **Then** the service runtime identity is initialized as ID="order-service", BoundedContext="sales", Version="1.0.0".
2. **Given** a Java application with `@SpasService` values AND explicit overrides in `application.yml`, **When** the application starts, **Then** the values from `application.yml` take precedence over the annotation (following standard Spring Boot configuration priorities).
3. **Given** a Java application with `@SpasService` missing one of the attributes (if allowed by schema) and no config in `application.yml`, **When** the application starts, **Then** the service fails to start or uses a default, consistent with current validation rules (assuming these fields are mandatory in the annotation).

---

### Edge Cases

- **Annotation Missing**: If `@SpasService` is missing and `application.yml` is also missing the properties, the application should fail to start with a clear error message about missing service identity.
- **Partial Configuration**: If `application.yml` defines only `version`, the `id` and `bounded-context` should still be picked up from `@SpasService`.
- **Multiple Annotations**: If multiple `@SpasService` annotations are detected in the application context, the application MUST fail to start to prevent ambiguity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Java SDK runtime MUST scan for the `@SpasService` annotation specifically on the class annotated with `@SpringBootApplication` during startup.
- **FR-002**: The Java SDK MUST populate the runtime service configuration (ID, Bounded Context, Version) using values from the `@SpasService` annotation if they are not explicitly provided in the environment configuration (e.g., `application.yml`, environment variables).
- **FR-003**: The Java SDK MUST ensure that standard Spring Boot configuration sources (like `application.yml`) have higher precedence than the `@SpasService` annotation values, allowing for environment-specific overrides.
- **FR-004**: The Java SDK MUST validate that a complete service identity is available (either from annotation or config) before completing startup.

### Success Criteria

- **Measurable**: 100% of new services can be created without defining `spas.service.id`, `spas.service.bounded-context`, or `spas.service.version` in `application.yml`.
- **User-focused**: Developers can remove 3 lines of configuration from `application.yml` without affecting application behavior.
- **Verifiable**: Integration tests confirm that metadata from `@SpasService` is correctly reflected in the runtime `ServiceContext` or equivalent bean.

### Key Entities *(include if feature involves data)*

- **SpasServiceAnnotation**: The Java annotation containing design-time metadata. All attributes (`id`, `boundedContext`, `version`) are mandatory (no default values).
- **RuntimeServiceConfiguration**: The in-memory representation of the service identity used by the SDK at runtime.
