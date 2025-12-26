# Implementation Plan: SDK Metadata Archive Extraction

**Branch**: `021-sdk-metadata-extraction` | **Date**: 2025-12-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/021-sdk-metadata-extraction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

> **Historical note**: This plan references the runtime metadata endpoint at `/_spas/metadata` as part of documenting its removal.
> References are preserved for context; the supported approach is offline archive generation and archive-based publishing.

## Summary

Add a first-class “offline metadata generation” mode to both the .NET and Java SDKs that writes the complete SPAS metadata archive ZIP to disk without starting the HTTP server and without calling `/_spas/metadata`. The output must match the existing SDK archive structure (reference: `examples/services/metadata/order-service-1.0.0.zip`) and `spas.json` must remain compliant with the existing design-time schema (no schema changes allowed). As part of this change, remove the runtime metadata endpoint features (both SDKs) and remove the .NET `SpasComposer.ComposeToFile` API and its usages across examples.

## Technical Context

**Language/Version**: C# / .NET 10 (SDK + example services), Java 17 (SDK + example services)  
**Primary Dependencies**:
- .NET: ASP.NET Core, `Microsoft.AspNetCore.*` abstractions, `Newtonsoft.Json`, `NJsonSchema`
- Java: Maven, Jackson, (optional) Spring Boot 3.x integration via `spas-sdk-spring`, VicTools JSON Schema Generator
**Storage**: Filesystem output (metadata ZIP written to `./metadata/service.metadata.zip` by default)  
**Testing**: xUnit (.NET SDK tests), JUnit 5 (Java SDK tests)  
**Target Platform**: Cross-platform developer workflows and CI/CD (Windows/macOS/Linux)  
**Project Type**: Monorepo (multiple components: SDKs + examples + tooling)  
**Performance Goals**: Metadata generation is fast and deterministic; no server listen; no outbound network calls  
**Constraints**:
- Design-time schema MUST NOT change (`components/sdk/schemas/design-time-metadata-v1.schema.json`)
- Archive internal paths MUST match reference (`spas.json`, `schemas/endpoints/*.schema.json`, `schemas/events/*.schema.json`)
- Default archive filename MUST be `service.metadata.zip`
- Remove runtime `/_spas/metadata` endpoint features (both SDKs)
- Remove .NET `SpasComposer.ComposeToFile` API and all usages
**Scale/Scope**: Medium (SDK surface changes + tests + multiple example services updates)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | ✅ Pass | No change to bounded context semantics; metadata generation reuses existing identity fields including `boundedContext` |
| II. No Direct Service-to-Service Communication | ✅ Pass | Generation mode must not perform outbound calls; runtime endpoint removal reduces service exposure |
| III. Event-First Integration | ✅ N/A | Metadata extraction is build-time tooling; does not change runtime integration patterns |
| IV. Convention Over Configuration | ✅ Pass | Default output directory `./metadata` and fixed filename `service.metadata.zip` are convention-based |
| V. Security by Default | ✅ Pass | Endpoint removal reduces attack surface; generation does not require secrets/network |
| VI. Observability First | ✅ N/A | No runtime request path changes required |
| VII. Portable Packaging | ✅ Pass | Offline generation supports CI and containerized workflows without special infra |
| VIII. Adaptable Through Configuration | ✅ Pass | No new hard-coded cross-service wiring; output is consumed by tooling |
| SDK Quality Gates | ✅ Pass | Unit tests required for new generation path and for endpoint removal |

**Gate Result**: ✅ PASS - No violations

**Post-design re-check**: ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/021-sdk-metadata-extraction/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
# .NET SDK
components/sdk/dotnet/src/Spas.Sdk.Metadata/
├── Composition/SpasComposer.cs               # REMOVE ComposeToFile; keep composition entrypoints
└── Dev/
   ├── MetadataArchiveWriter.cs              # Reuse/extend archive writing for offline generation
   ├── MetadataEndpointExtensions.cs         # REMOVE runtime endpoint mapping helpers
   └── MetadataEndpointOptions.cs            # REMOVE (or shrink to offline generation options)

components/sdk/dotnet/src/Spas.Sdk.Configuration/
└── SpasConfig.cs                             # Remove endpoint path config if endpoint removed

components/sdk/dotnet/test/Spas.Sdk.Metadata.Tests/
└── SpasComposerTests.cs                      # Update/remove ComposeToFile tests; add archive generation tests

# Java SDK
components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/
├── SpasAutoConfiguration.java                # Remove wiring for SpasMetadataController
├── SpasMetadataController.java               # REMOVE runtime endpoint
└── SpasProperties.java                       # Remove endpoint config surface if no longer supported

components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/
└── SpasMetadataControllerTest.java           # Update/remove tests and add offline generation tests

# Examples
examples/services/order-service/Program.cs    # Remove ComposeToFile usage; add generate-metadata trigger
examples/services/product-service/Program.cs  # Same
examples/services/subscription-service/Program.cs
examples/services/inventory-service/Program.cs
examples/services/basket-service/pom.xml      # Add system property trigger usage / profile as documented
examples/services/fulfillment-service/pom.xml # Same
```

**Structure Decision**: Implement offline metadata generation inside existing SDK metadata modules for each language, and expose minimal integration points in service startup to invoke generation and exit early. Remove runtime endpoint code paths to enforce a single supported archive generation mechanism.

## Implementation Details

### Phase 0: Research

Document the concrete archive format requirements and the safest “initialize without listening” approach per platform:

- Confirm reference archive file list and internal paths.
- Identify how to discover ASP.NET Core route metadata without starting Kestrel.
- Identify how to discover Spring route mappings without starting a listening server.
- Identify where identity is sourced in both example services and how to reuse it in generation mode.

Output: `research.md`

### Phase 1: Design

Design a consistent generation flow that:

- Detects generation trigger early (C#: args contain `--generate-metadata`; Java: system property `spas.generate-metadata=true`).
- Builds the application sufficiently to discover routes and metadata, but does not open listening ports.
- Composes `spas.json` using existing identity sources and discovered contracts/endpoints.
- Writes a ZIP archive with the required internal paths and fixed filename `service.metadata.zip`.
- Exits with success/failure exit code.

Output: `data-model.md`, `quickstart.md`, and `contracts/*`

### Phase 2: Task Breakdown (for /speckit.tasks)

1. **.NET SDK**
  - Remove `SpasComposer.ComposeToFile` and update tests.
  - Implement offline metadata archive generation entrypoint (args trigger, output path handling, overwrite).
  - Remove runtime metadata endpoint extensions and related configuration types.

2. **Java SDK**
  - Remove `/ _spas/metadata` controller and auto-configuration wiring.
  - Implement offline metadata archive generation entrypoint (system property trigger, output path handling, overwrite).
  - Update tests accordingly.

3. **Example services**
  - Update all .NET example services to use the new generation path and remove `ComposeToFile` usage.
  - Update Java example services to document/run with system property trigger and ensure archive matches reference structure.

4. **Verification**
  - Add/adjust tests to validate generated `spas.json` against design-time schema.
  - Validate generated ZIP contains the expected internal file paths for order-service (matches reference).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

No violations expected.
