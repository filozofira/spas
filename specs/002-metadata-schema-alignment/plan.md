# Implementation Plan: Service Metadata Schema Alignment

**Branch**: `002-metadata-schema-alignment` | **Date**: 2025-12-13 | **Spec**: [specs/002-metadata-schema-alignment/spec.md](specs/002-metadata-schema-alignment/spec.md)
**Input**: Feature specification from `/specs/002-metadata-schema-alignment/spec.md`

## Summary

Align .NET SDK design-time metadata generation/validation to `design-time-metadata-v1` (updated 06-service-metadata). Endpoints use `schemaRef`, outbound events only, `requiredEgress`, optional `authentication`, required `dataClassification`, and `schemaVersion` emission. Runtime metadata is out-of-scope for this feature and will be handled in a future feature.

## Technical Context

**Language/Version**: C# / .NET (net10.0 per SDK csproj targets)  
**Primary Dependencies**: SPAS .NET SDK projects (`Spas.Sdk.*`), JSON serialization (System.Text.Json), JSON Schema validation lib (NEEDS CLARIFICATION which)  
**Storage**: N/A (design-time metadata files)  
**Testing**: xUnit (assumed; confirm in `components/sdk/dotnet/test/*`)  
**Target Platform**: .NET library consumed by services running in containers (Linux/Windows dev)  
**Project Type**: SDK/library with samples  
**Performance Goals**: Fast metadata generation/validation in dev (<1s typical)  
**Constraints**: Maintain backwards-incompatible schema change; keep SDK slim (no bundled schema file)  
**Scale/Scope**: Affects SDK metadata builders, validators, sample `spas.json`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Single Bounded Context — Pass (metadata keeps single `boundedContext`).
- II. No Direct Service-to-Service — Pass (only declares `requiredEgress`; sidecar mediation unchanged).
- III. Event-First Integration — Pass (outbound events only; commands/queries remain mediated by sidecar).
- V. Security by Default — **Violation/Justified**: Constitution expects `security.enclosureLevel`; design-time schema removes `level` in favor of `requiredEgress` + choreography policy. Justification: per spec decision to keep SDK slim and defer enclosure policy to choreography/repository; PoC amendment allows clarification; must coordinate with governance before production.
- VI. Observability First — Not impacted by design-time metadata change (no health/trace fields altered).
- VII. Portable Packaging — Not impacted (metadata only).
- VIII. Adaptable Through Configuration — Pass (internal schemas referenced via `schemaRef`; choreography governs transformations).

## Project Structure

### Documentation (this feature)

```text
specs/002-metadata-schema-alignment/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (/speckit.plan)
├── data-model.md        # Phase 1 output (/speckit.plan)
├── quickstart.md        # Phase 1 output (/speckit.plan)
├── contracts/           # Phase 1 output (/speckit.plan)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
components/sdk/dotnet/
├── src/
│   ├── Spas.Sdk.Configuration/
│   ├── Spas.Sdk.Core/
│   ├── Spas.Sdk.Events/
│   ├── Spas.Sdk.Inbound/
│   ├── Spas.Sdk.Metadata/        # likely metadata builders/validators
│   ├── Spas.Sdk.Observability/
│   └── Spas.Sdk.Testing/
├── test/
│   ├── Spas.Sdk.Configuration.Tests/
│   ├── Spas.Sdk.Core.Tests/
│   ├── Spas.Sdk.Events.Tests/
│   ├── Spas.Sdk.Inbound.Tests/
│   ├── Spas.Sdk.Metadata.Tests/  # update/extend for schema changes
│   ├── Spas.Sdk.Observability.Tests/
│   └── Spas.Sdk.Testing.Tests/
└── examples/
    └── SampleService/            # update sample spas.json/metadata output
```

**Structure Decision**: Treat as single SDK workspace with multiple projects under `components/sdk/dotnet`. Documentation for this feature lives in `specs/002-metadata-schema-alignment`. Tests alongside SDK projects in `components/sdk/dotnet/test/*`. Samples in `components/sdk/dotnet/examples/SampleService`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Security enclosure level omitted from design-time schema | Keep SDK metadata minimal; defer enclosure policy to choreography/repository; aligns with spec decision | Including `enclosure` in SDK would conflict with new schema alignment and duplicate choreography policy surface |
