# Tasks: Remove Redundant Java SDK Metadata

**Input**: Design documents from `/specs/030-java-metadata-dedup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Key Finding**: The SDK's `SpasMetadataArchiveGenerator` already reads service identity directly from the `@SpasService` annotation. No code changes are needed to the SDK itself. The only task is to remove the redundant `spas.service.*` configuration from example services' `application.yml` files.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Example Services Cleanup

**Purpose**: Remove redundant `spas.service.*` configuration from all example services since metadata generation already reads from `@SpasService` annotation

- [X] T001 [P] Remove `spas.service.id`, `spas.service.bounded-context`, and `spas.service.version` from `examples/services/basket-service/src/main/resources/application.yml` (lines 10-13)
- [X] T002 [P] Remove `spas.service.id`, `spas.service.bounded-context`, and `spas.service.version` from `examples/services/rental-service/src/main/resources/application.yml` (lines 10-13)
- [X] T003 [P] Remove `spas.service.id`, `spas.service.bounded-context`, and `spas.service.version` from `examples/services/fulfillment-service/src/main/resources/application.yml` (lines 10-13)

---

## Phase 2: Verification

**Purpose**: Verify that example services still function correctly without the redundant configuration

- [X] T004 [P] Build and run basket-service, verify startup logs show correct service identity from `@SpasService` annotation
- [X] T005 [P] Build and run rental-service, verify startup logs show correct service identity from `@SpasService` annotation
- [X] T006 [P] Build and run fulfillment-service, verify startup logs show correct service identity from `@SpasService` annotation
- [X] T007 Generate metadata for basket-service using `-Dspas.generate-metadata=true`, verify `spas.json` contains correct identity values
- [X] T008 Generate metadata for rental-service using `-Dspas.generate-metadata=true`, verify `spas.json` contains correct identity values
- [X] T009 Generate metadata for fulfillment-service using `-Dspas.generate-metadata=true`, verify `spas.json` contains correct identity values

---

## Phase 3: Documentation Update

**Purpose**: Update documentation to clarify that `@SpasService` annotation is the single source of truth

- [X] T010 Update quickstart guide in `specs/030-java-metadata-dedup/quickstart.md` to emphasize that `spas.service.*` properties should NOT be used in `application.yml`
- [X] T011 Update Java SDK README `components/sdk/java/README.md` to document that service identity comes from `@SpasService` annotation only
- [X] T012 Add note to `@SpasService` annotation Javadoc in `components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/annotations/SpasService.java` explaining it is used at metadata generation time
- [X] T013 Update spec status to "Completed" in `specs/030-java-metadata-dedup/spec.md`

---

## Dependencies

1. **Phase 1 (Cleanup)** can be done in parallel across all three services
2. **Phase 2 (Verification)** must wait for Phase 1 to complete
3. **Phase 3 (Documentation)** can be done in parallel with verification

## Parallel Execution

- **Cleanup Phase**:
  - Developer A: Updates basket-service (T001)
  - Developer B: Updates rental-service (T002)
  - Developer C: Updates fulfillment-service (T003)

- **Verification Phase**:
  - Developer A: Verifies basket-service (T004, T007)
  - Developer B: Verifies rental-service (T005, T008)
  - Developer C: Verifies fulfillment-service (T006, T009)

- **Documentation Phase**:
  - Developer A: Updates quickstart (T010)
  - Developer B: Updates README (T011)
  - Developer C: Updates Javadoc and spec (T012, T013)

## Implementation Notes

**Why no SDK code changes are needed:**
- `SpasMetadataArchiveGenerator.buildMetadataAtRuntime()` already reads from `@SpasService` annotation (lines 306-325)
- The annotation scanning happens during metadata generation (`-Dspas.generate-metadata=true`)
- The `spas.service.*` properties in `application.yml` are NOT used by the SDK at all
- Removing them eliminates duplication without breaking functionality

**Configuration precedence (if needed in future):**
- `SpasServiceOptions` passed to `SpasServiceRunner.run()` can override annotation values
- Environment variables can override through Spring Boot's standard mechanism
- But for service identity, the annotation should be the primary source

