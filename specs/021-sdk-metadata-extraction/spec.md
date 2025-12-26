# Feature Specification: SDK Metadata Archive Extraction

**Feature Branch**: `021-sdk-metadata-extraction`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: User description: "SDK Metadata Archive Extraction - Extend both .NET and Java SDKs to support extracting the complete metadata archive to disk without requiring the _spas/metadata endpoint to be called. A .Net and Java service developer needs to generate the complete SPAS metadata archive, with identical output format as the current SDK extraction (see \".\\examples\\services\\metadata\\order-service-1.0.0.zip\"). Metadata design-time schema must not be changed and implementation should encapsulate metadata generation logic inside SDK as much as possible, thus requiring minimal service developer effort. Ideally developers can generate metadata via a CLI trigger (e.g., for .NET: `dotnet run -- --generate-metadata` with optional `--output`). _metadata endpoint functionality must be removed as well as .Net ComposeToFile method and its usage. All example services must be updated to use new model."

> **Historical note**: This spec documents the transition away from the runtime metadata endpoint at `/_spas/metadata`.
> References to the endpoint below are preserved for context; the supported approach is offline archive generation and archive-based publishing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Metadata Archive Without Starting Server (Priority: P1)

A .NET or Java service developer wants to generate the complete SPAS metadata archive to disk without starting the HTTP server and without calling `/_spas/metadata`.

**Why this priority**: This enables reliable CI/CD metadata generation and removes any need to run the service for metadata capture.

**Independent Test**: From a service project root, run the supported “generate metadata” invocation and verify a ZIP archive is written and the process terminates successfully.

**Acceptance Scenarios**:

1. **Given** a .NET SPAS service project, **When** the developer runs `dotnet run -- --generate-metadata` (optionally with `--output <path>`), **Then** a metadata archive ZIP is written and the process exits without starting the HTTP server.
2. **Given** a Java SPAS service project, **When** the developer enables metadata generation via the system property trigger, **Then** a metadata archive ZIP is written and the process exits without starting the HTTP server.
3. **Given** a service that defines commands, queries, and events, **When** metadata is generated, **Then** the archive contains `spas.json` and the required schema files for those contracts.
4. **Given** the order-service example, **When** metadata is generated, **Then** the archive file list (paths inside the ZIP) matches the reference archive `.\\examples\\services\\metadata\\order-service-1.0.0.zip`.

---

### User Story 2 - Control Output Location (Priority: P1)

A developer wants to control where the metadata archive is written, with a consistent default.

**Why this priority**: This supports both local workflows and CI artifact conventions.

**Independent Test**: Run generation with default settings and with an output override and confirm the archive is written to the correct location.

**Acceptance Scenarios**:

1. **Given** a service project root, **When** the developer runs metadata generation without an output override, **Then** the SDK writes the archive under a default `./metadata` directory in the project root.
2. **Given** a service project root, **When** the developer specifies an output override, **Then** the SDK writes the archive to the specified path.
3. **Given** the output directory does not exist, **When** generation runs, **Then** the directory is created automatically.
4. **Given** an archive already exists at the output path, **When** generation runs, **Then** the archive is overwritten.

---

### User Story 3 - Populate Endpoints Without Listening (Priority: P1)

A service developer wants the generated archive to include `endpoints[]` in `spas.json` (including `methodPath` and `protocol`) even though the service does not start listening for HTTP traffic.

**Why this priority**: The reference archives include populated `endpoints[]`, and downstream tooling expects a complete picture of the service surface.

**Independent Test**: Generate metadata for order-service and verify `endpoints[]` entries match the reference archive for `methodPath` and `protocol`.

**Acceptance Scenarios**:

1. **Given** a service with HTTP routes defined, **When** metadata generation runs, **Then** `spas.json` includes `endpoints[]` populated with correct `methodPath`, `protocol`, and `type` for each contract.
2. **Given** metadata generation mode, **When** the app is initialized for discovery, **Then** it does not open listening ports and does not accept inbound traffic.
3. **Given** metadata generation mode, **When** the SDK initializes the service for endpoint discovery, **Then** it does not perform outbound network calls as part of metadata generation.

---

### User Story 4 - Schema-Compliant Output (Priority: P1)

A developer wants the produced `spas.json` to conform to the existing design-time metadata schema and not require schema changes.

**Why this priority**: Tooling compatibility depends on stable schema; changing the schema is explicitly disallowed.

**Independent Test**: Validate generated `spas.json` against `components\\sdk\\schemas\\design-time-metadata-v1.schema.json`.

**Acceptance Scenarios**:

1. **Given** a generated archive, **When** `spas.json` is validated against the design-time schema, **Then** it passes without requiring any schema changes.
2. **Given** the order-service example, **When** extraction runs, **Then** `spas.json` includes endpoints (where applicable), commands, and events consistent with the reference archive.

---

### User Story 5 - Remove Runtime Metadata Endpoint and ComposeToFile (Priority: P2)

A platform maintainer wants to remove runtime metadata endpoint functionality and the .NET `ComposeToFile` API and update all examples accordingly.

**Why this priority**: The system should have a single supported way to produce metadata, and it should not require exposing a metadata endpoint.

**Independent Test**: Build the SDKs and examples and confirm the old endpoint APIs are gone and metadata generation is still possible via the new mechanism.

**Acceptance Scenarios**:

1. **Given** the updated .NET SDK, **When** a developer attempts to call `ComposeToFile`, **Then** it is not available.
2. **Given** the updated .NET SDK, **When** a developer attempts to register/map the runtime metadata endpoint using SDK helpers, **Then** those helpers are not available.
3. **Given** the updated Java SDK, **When** a developer runs a service, **Then** `/_spas/metadata` is not exposed.
4. **Given** all example services, **When** metadata generation is run for each, **Then** each generates a metadata archive ZIP successfully.

---

### Edge Cases

- What happens when a service has no discoverable contracts? The archive still contains a valid `spas.json` with identity fields and empty contract arrays.
- What happens when identity metadata is incomplete? Generation fails with a clear, actionable error describing missing fields.
- What happens when schema generation fails for a contract? Generation fails with a clear error that identifies the contract and its associated type.
- What happens when the process is invoked from a non-project directory? Generation fails with a clear message indicating a service project root is required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The .NET SDK MUST support a metadata generation trigger via process arguments (invoked as `dotnet run -- --generate-metadata`) that generates the complete metadata archive to disk.
- **FR-002**: The Java SDK MUST support a metadata generation trigger via a system property (e.g., `-Dspas.generate-metadata=true`) that generates the complete metadata archive to disk.
- **FR-003**: When metadata generation is triggered, the service MUST NOT start its HTTP server.
- **FR-004**: The generated archive MUST include `spas.json` plus all required schemas needed to interpret the declared contracts.
- **FR-005**: The generated archive MUST use the same internal path structure as the reference archive `.\\examples\\services\\metadata\\order-service-1.0.0.zip`.
- **FR-006**: The generated `spas.json` MUST conform to `components\\sdk\\schemas\\design-time-metadata-v1.schema.json`.
- **FR-007**: The design-time schema file and schema semantics MUST NOT be changed.
- **FR-008**: The .NET SDK MUST remove `ComposeToFile` and remove/update all usages in repository examples.
- **FR-009**: The SDKs MUST remove runtime metadata endpoint functionality.
- **FR-010**: The default output location MUST be `./metadata` under the service project root.
- **FR-011**: The .NET SDK MUST support an optional `--output <path>` override for the output location.
- **FR-012**: The Java SDK MUST support an output override for the output location.
- **FR-012a**: The default output filename MUST be `service.metadata.zip`.
- **FR-013**: Metadata generation MUST overwrite existing output at the target path.
- **FR-014**: Metadata generation MUST return a success exit code on success and a non-success exit code on failure.
- **FR-015**: All example services MUST be updated to the new model and successfully generate archives.
- **FR-016**: In metadata generation mode, the SDK MUST be able to populate `endpoints[]` by initializing the service enough to discover routes without opening listening ports.
- **FR-017**: In metadata generation mode, the SDK MUST NOT perform outbound network calls as part of metadata generation.
- **FR-018**: In metadata generation mode, required service identity fields (`id`, `name`, `version`, `boundedContext`) MUST be sourced from the service's existing code-defined identity (the same identity used at runtime), not duplicated in a separate metadata-only configuration.

### Key Entities *(include if feature involves data)*

- **Service Project Root**: The directory used as the base for default output paths.
- **Metadata Archive**: The ZIP file that contains `spas.json` and schemas under `schemas/`.
- **Contract Set**: The discovered endpoints, commands, queries, and events that appear in `spas.json`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can generate an archive for a service in one command and the process exits without starting the HTTP server.
- **SC-002**: For order-service, the generated archive internal file paths match the reference archive.
- **SC-003**: Generated `spas.json` validates against the design-time schema without changes.
- **SC-004**: All example services generate an archive successfully using the new approach.
- **SC-005**: The SDK no longer exposes runtime metadata endpoint functionality and .NET no longer exposes `ComposeToFile`.

## Assumptions

- Metadata generation is invoked from a directory that can be identified as a service project root.
- The SDK can discover the necessary contracts and schemas without contacting a running service.
- Services already define service identity in code (or expose a single code path the SDK can invoke) so the generator can reuse it during metadata generation.

## Decisions

- Java metadata generation is triggered primarily via a system property (e.g., `-Dspas.generate-metadata=true`).
- Default output filename is fixed to `service.metadata.zip` (written under `./metadata` by default).
- Endpoint population uses “initialize for discovery without listening”: the service is initialized enough to build the route map so `endpoints[]` can be populated, but it does not open ports or accept traffic.

## Clarifications

### Session 2025-12-26

- Q: For .NET, what is the canonical invocation to pass app args through `dotnet run`? → A: Use `dotnet run -- --generate-metadata` (and `--output <path>` after `--` when needed).
- Q: In metadata generation mode, where should service identity come from? → A: Reuse the service's existing code-defined identity (same identity used at runtime).
