# Implementation Plan: Command Produced Events Mapping

**Branch**: `018-command-produces-events` | **Date**: 2025-12-22 | **Spec**: ./spec.md
**Input**: Add a PoC capability in `spas.json` metadata that expresses which events each command produces on success (structured `produces[]`), to improve agent-assisted choreography.

## Summary

Extend SPAS design-time metadata so each command can declare a structured `produces[]` list referencing declared events by `(type, version)` with `when: "success"`. Implement via developer-declared mapping in both SDKs (declare using event types/classes; SDK resolves `type`+`version`) and fail-fast validation in SDK/tooling.

## Technical Context

**Language/Version**: C# / .NET 10, Java 17+, Node.js 20 (TypeScript)
**Primary Dependencies**: Ajv (JSON Schema validation), System.Text.Json (.NET), Spring/Jackson (Java)
**Storage**: N/A
**Testing**: xUnit (.NET), JUnit (Java), Jest (TypeScript)
**Target Platform**: Cross-platform dev + container runtime (Windows/macOS/Linux)
**Project Type**: Monorepo (multi-component: SDKs, repository, sidecar, CLIs)
**Performance Goals**: Metadata generation/validation remains fast; no handler-body inference
**Constraints**: `when` is PoC-limited to `"success"`; command names must be canonical kebab-case; do not manually update `examples/**/spas.json` as part of this plan (examples will be regenerated during e2e testing)
**Scale/Scope**: Update schema/principles + .NET SDK + Java SDK + validation

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- ✅ I. Single bounded context per service: unaffected (metadata extension only).
- ✅ II. No direct service-to-service communication: unaffected.
- ✅ III. Event-first integration: supported (adds explicit event linkage).
- ✅ IV. Convention over configuration: aligned (canonical kebab-case command identifiers).
- ✅ V–VIII: unaffected (security/observability/packaging/config boundaries unchanged).

**Post-design re-check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/018-command-produces-events/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks) - not created by /speckit.plan
```

### Source Code (repository root)

```text
# Principles/docs
principles/service/06-service-metadata.md
principles/protocol/09-event-protocol.md

# Repository schema + validation
components/repository/schemas/design-time-metadata-v1.schema.json
components/repository/schemas/runtime-metadata-v1.schema.json
components/repository/src/models/types.ts
components/repository/src/validation/SpasSchemaValidator.ts

# .NET SDK metadata generation
components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/
components/sdk/dotnet/src/Spas.Sdk.Metadata/Models/MetadataModels.cs
components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs
components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs

# Java SDK metadata generation
components/sdk/java/spas-sdk-metadata/src/main/java/.../annotations/
components/sdk/java/spas-sdk-metadata/src/main/java/.../model/
components/sdk/java/spas-sdk-spring/src/main/java/.../SpasMetadataController.java
```

**Structure Decision**: Implement as schema + metadata changes across Repository and both SDKs, localized to metadata generation and validation paths (no runtime orchestration changes).

## Phase 2 Task Breakdown (for /speckit.tasks)

Tasks MUST be split into these groups:

1. Update metadata schema / principles

- Extend design-time schema to include `commands[]` and `commands[].produces[]` with `when: "success"`.
- Extend runtime schema similarly (if runtime metadata exposes `commands[]`).
- Update principles to document canonical command naming (kebab-case), produces semantics, and validation expectations.

2. .NET SDK changes

- Add developer-declared mapping surface to declare produced events using event types.
- Emit `commands[]` with canonical kebab-case names and `produces[]` resolved from `[SpasEvent]`.
- Add fail-fast validation (missing `[SpasEvent]`, missing event declaration, duplicates).

3. Java SDK changes

- Add developer-declared mapping surface to declare produced events using event classes.
- Emit `commands[]` with canonical kebab-case names and `produces[]` resolved from `@SpasEvent`.
- Add fail-fast validation (missing `@SpasEvent`, missing event declaration, duplicates).

4. Validation (SDK + tooling)

- Repository/CLI validation: schema update + Ajv validation covers new fields.
- Add explicit validation errors for: bad kebab-case command names, invalid produced references, duplicates.

## Complexity Tracking

None.
