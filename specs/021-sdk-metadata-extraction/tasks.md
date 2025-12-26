---

description: "Task list for feature implementation"
---

# Tasks: SDK Metadata Archive Extraction

**Input**: Design documents from `/specs/021-sdk-metadata-extraction/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create a dedicated feature README section in specs/021-sdk-metadata-extraction/quickstart.md describing triggers, defaults, and expected zip layout
- [x] T002 [P] Capture the reference ZIP entry list as a checked-in constant in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Fixtures/ReferenceZipEntries.cs
- [x] T003 [P] Capture the reference ZIP entry list as a checked-in constant in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/fixtures/ReferenceZipEntries.java
- [x] T004 Add a repo-wide note in GROOMING.md clarifying this feature supersedes runtime /_spas/metadata for metadata publication

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Add shared constants for offline generation flags and defaults in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataGenerationConstants.cs
- [x] T006 Add shared constants for offline generation flags and defaults in components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/generation/MetadataGenerationConstants.java
- [x] T007 [P] Add .NET helper to read ZIP entries for assertions in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Helpers/ZipAssert.cs
- [x] T008 [P] Add Java helper to read ZIP entries for assertions in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/helpers/ZipAssert.java
- [x] T009 Add a minimal cross-language definition of output override semantics to specs/021-sdk-metadata-extraction/contracts/metadata-archive.openapi.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Generate Metadata Archive Without Starting Server (Priority: P1) 🎯 MVP

**Goal**: Generate a complete metadata archive ZIP for .NET and Java services without starting the HTTP server and without calling `/_spas/metadata`.

**Independent Test**: From a service project root, run the supported “generate metadata” invocation and verify a ZIP archive is written and the process terminates successfully.

- [x] T010 [P] [US1] Create .NET SDK offline generator entrypoint in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [x] T011 [US1] Wire .NET generator to existing discovery/composition in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [x] T012 [P] [US1] Add .NET unit tests for generator “writes zip and includes spas.json” in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataArchiveGeneratorTests.cs
- [x] T013 [P] [US1] Extract Java archive-building logic out of components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java into components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataArchiveGenerator.java
- [x] T014 [US1] Add Java offline trigger hook (system property) in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasAutoConfiguration.java using an ApplicationRunner/CommandLineRunner that generates then exits
- [x] T015 [P] [US1] Add Java unit tests for generator “writes zip and includes spas.json” in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasMetadataArchiveGeneratorTest.java

---

## Phase 4: User Story 2 - Control Output Location (Priority: P1)

**Goal**: Support a consistent default output directory (`./metadata`) and allow output override, overwriting existing archives.

**Independent Test**: Run generation with default settings and with an output override and confirm the archive is written to the correct location.

- [x] T016 [US2] Implement .NET argument parsing for `--generate-metadata` and optional `--output <path>` in examples/services/order-service/Program.cs
- [x] T017 [P] [US2] Apply the same .NET argument parsing pattern to examples/services/product-service/Program.cs
- [x] T018 [P] [US2] Apply the same .NET argument parsing pattern to examples/services/subscription-service/Program.cs
- [x] T019 [P] [US2] Apply the same .NET argument parsing pattern to examples/services/inventory-service/Program.cs
- [x] T020 [US2] Implement default output directory creation + overwrite behavior in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs
- [x] T021 [P] [US2] Add .NET unit tests for default output and overwrite behavior in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataArchiveGeneratorTests.cs
- [x] T022 [US2] Implement Java output override property `spas.metadata.output` and default `./metadata` in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataArchiveGenerator.java
- [x] T023 [P] [US2] Add Java unit tests for default output and overwrite behavior in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasMetadataArchiveGeneratorTest.java

---

## Phase 5: User Story 3 - Populate Endpoints Without Listening (Priority: P1)

**Goal**: Populate `endpoints[]` in `spas.json` with correct `methodPath` and `protocol` without opening listening ports or making outbound calls.

**Independent Test**: Generate metadata for order-service and verify `endpoints[]` entries match the reference archive for `methodPath` and `protocol`.

- [x] T024 [US3] Ensure .NET endpoint discovery uses route data sources without calling `app.Run()` in components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs
- [x] T025 [P] [US3] Add .NET unit test that generated spas.json contains endpoints[] with methodPath/protocol for a minimal app in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/WebApplicationDiscoveryExtensionsTests.cs
- [x] T026 [US3] Ensure Java methodPath derivation is correct using Spring mapping annotations without starting server in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataArchiveGenerator.java
- [x] T027 [P] [US3] Add Java unit tests for methodPath/protocol extraction in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/EndpointDiscoveryTest.java
- [x] T028 [US3] Add a defensive “no outbound calls” guardrail documentation note in specs/021-sdk-metadata-extraction/research.md

---

## Phase 6: User Story 4 - Schema-Compliant Output (Priority: P1)

**Goal**: Ensure generated `spas.json` remains compliant with the existing design-time schema (schema file and semantics must not change).

**Independent Test**: Validate generated `spas.json` against `components/sdk/schemas/design-time-metadata-v1.schema.json`.

- [ ] T029 [US4] Add a .NET validation step before writing the ZIP in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs using components/sdk/dotnet/src/Spas.Sdk.Metadata/Validation/SchemaValidator.cs
- [x] T029 [US4] Add a .NET validation step before writing the ZIP in components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs using components/sdk/dotnet/src/Spas.Sdk.Metadata/Validation/SchemaValidator.cs
- [x] T030 [P] [US4] Add .NET unit test that invalid metadata fails with actionable error in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/MetadataArchiveGeneratorTests.cs
- [x] T031 [US4] Add Java JSON-schema validation dependency (test scope) to components/sdk/java/spas-sdk-spring/pom.xml
- [x] T032 [US4] Embed the schema file for validation into components/sdk/java/spas-sdk-spring/src/test/resources/schemas/design-time-metadata-v1.schema.json (copied from components/sdk/schemas/design-time-metadata-v1.schema.json)
- [x] T033 [US4] Add Java unit test that generated spas.json validates against the embedded schema in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasJsonSchemaValidationTest.java

---

## Phase 7: User Story 5 - Remove Runtime Metadata Endpoint and ComposeToFile (Priority: P2)

**Goal**: Remove `/_spas/metadata` endpoint functionality and remove .NET `ComposeToFile`, updating all examples accordingly.

**Independent Test**: Build the SDKs and examples and confirm the old endpoint APIs are gone and metadata generation is still possible via the new mechanism.

- [x] T034 [US5] Remove .NET ComposeToFile API from components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs
- [x] T035 [P] [US5] Update .NET unit tests to remove/replace ComposeToFile coverage in components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/SpasComposerTests.cs
- [x] T036 [US5] Remove .NET runtime metadata endpoint helpers in components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/MetadataEndpointExtensions.cs and components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/MetadataEndpointOptions.cs
- [x] T037 [US5] Remove endpoint config surface from components/sdk/dotnet/src/Spas.Sdk.Configuration/SpasConfig.cs (remove EndpointPath or equivalent)
- [x] T038 [US5] Remove Java runtime controller class components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataController.java
- [x] T039 [US5] Remove Java auto-configuration wiring and properties for endpoint exposure in components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasAutoConfiguration.java and components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasProperties.java
- [x] T040 [P] [US5] Update Java tests to remove endpoint controller tests and cover offline generator instead in components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasMetadataControllerTest.java
- [x] T041 [P] [US5] Remove ComposeToFile usage from examples/services/order-service/Program.cs
- [x] T042 [P] [US5] Remove ComposeToFile usage from examples/services/product-service/Program.cs
- [x] T043 [P] [US5] Remove ComposeToFile usage from examples/services/subscription-service/Program.cs
- [x] T044 [P] [US5] Remove ComposeToFile usage from examples/services/inventory-service/Program.cs
- [x] T045 [P] [US5] Remove ComposeToFile usage from components/sdk/dotnet/examples/SampleService/Program.cs
- [x] T046 [P] [US5] Update Java example services docs/commands to use the system property trigger in examples/services/basket-service/README.md and examples/services/fulfillment-service/README.md

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T047 [P] Add a regression test that order-service generated ZIP entry list matches reference in examples/services/order-service/Program.cs (smoke run instructions) and components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/Fixtures/ReferenceZipEntries.cs
- [ ] T048 Update references to `/_spas/metadata` in specs/016-java-spas-sdk/quickstart.md and specs/004-spas-service-cli/* to note the endpoint is removed (documentation-only)
- [ ] T049 Run end-to-end verification commands in specs/021-sdk-metadata-extraction/quickstart.md and record any deltas in specs/021-sdk-metadata-extraction/research.md

---

## Dependencies & Execution Order

### User Story Completion Order

- US1 (P1) → US2 (P1) → US3 (P1) → US4 (P1) → US5 (P2)

### Rationale

- US1 establishes the offline generation mechanism.
- US2 adds output conventions/overrides on top of the generator.
- US3 ensures endpoint population matches reference expectations.
- US4 adds explicit schema compliance checks.
- US5 removes legacy APIs/endpoints once the new path is stable.

---

## Parallel Execution Examples

### US1

- Run in parallel:
  - T010 (.NET generator) and T013 (Java generator extraction)
  - T012 (.NET tests) and T015 (Java tests)

### US2

- Run in parallel:
  - T017–T019 (.NET example updates) after T016 pattern is established
  - T021 (.NET tests) and T023 (Java tests)

### US5

- Run in parallel:
  - T041–T045 (remove ComposeToFile usages across different examples)
  - T038–T040 (Java endpoint removal + test updates)

---

## Implementation Strategy

### MVP Scope (Recommended)

- Implement US1 only (Phase 3) and validate on order-service.

### Incremental Delivery

1. Deliver US1–US4 (P1) to ensure offline generation is complete and schema-compliant.
2. Deliver US5 (P2) to remove the legacy endpoint and APIs.
3. Finish Polish phase documentation/verification.
