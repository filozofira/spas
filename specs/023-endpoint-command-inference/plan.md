# Implementation Plan: SDK Simplification for AI-Assisted Development

**Branch**: `023-endpoint-command-inference` | **Date**: 2025-12-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/023-endpoint-command-inference/spec.md`

## Summary

Simplify .NET SDK to remove redundant DTO attribute requirements and hide error-prone API overloads. Two changes:

1. **Command/Query Schema Inference**: Infer JSON schemas from endpoint handler parameter types instead of requiring `[SpasCommand]` on DTOs. Aligns .NET SDK with Java SDK behavior.
2. **Event Publishing API Simplification**: Hide `PublishAsync(string eventName, object payload)` overload, exposing only the type-safe `PublishAsync<TEvent>(object payload)` method.

## Technical Context

**Language/Version**: C# / .NET 10.0  
**Primary Dependencies**: NJsonSchema 11.1.0, JsonSchema.Net 6.0.0, ASP.NET Core Minimal APIs  
**Storage**: N/A  
**Testing**: xUnit, Moq (existing test infrastructure)  
**Target Platform**: .NET 10.0 (cross-platform)
**Project Type**: SDK library (multi-project solution)  
**Performance Goals**: No regression from current metadata generation (<30s for typical service)  
**Constraints**: Backward compatible with existing services using `PublishAsync<TEvent>`  
**Scale/Scope**: 7 SDK projects, ~10 test projects, 6 example services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| SDK: Offline Design-time Metadata | ✅ Pass | No change to offline generation model |
| SDK: No External Infrastructure | ✅ Pass | No new infrastructure dependencies |
| SDK: Events Preparation vs Wrapping | ✅ Pass | SDK prepares payload; sidecar wraps. No change. |
| SDK: Quality Gates | ✅ Pass | Unit tests required; integration tests for metadata round-trip |
| SDK: Mandatory Capabilities | ✅ Pass | Metadata authoring enhanced, not reduced |

**Constitution Gate**: PASSED — No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/023-endpoint-command-inference/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (migration guide)
├── contracts/           # N/A (internal SDK change)
└── tasks.md             # Phase 2 output
```

### Source Code (existing structure)

```text
components/sdk/dotnet/
├── src/
│   ├── Spas.Sdk.Core/           # Core utilities
│   ├── Spas.Sdk.Events/         # EventPublisher (FR-008, FR-009, FR-010)
│   │   └── Publish/
│   │       └── EventPublisher.cs  # ← MODIFY: Hide string overload
│   ├── Spas.Sdk.Metadata/       # Metadata discovery (FR-001 to FR-007)
│   │   ├── Attributes/
│   │   │   └── SpasContractAttributes.cs  # ← MODIFY: Remove Class target for [SpasCommand]
│   │   ├── Discovery/
│   │   │   └── MetadataDiscovery.cs
│   │   ├── Extensions/
│   │   │   └── WebApplicationDiscoveryExtensions.cs  # ← MODIFY: Add parameter type extraction
│   │   ├── Generation/
│   │   │   └── MetadataArchiveGenerator.cs  # ← MODIFY: Generate schema from param type
│   │   └── Schema/
│   │       └── SchemaGenerator.cs  # ← MODIFY: Add GenerateSchemaForType (no attribute needed)
│   └── ...
└── test/
    ├── Spas.Sdk.Events.Tests/     # ← ADD: Tests for API visibility
    └── Spas.Sdk.Metadata.Tests/   # ← ADD: Tests for endpoint param inference

examples/services/
├── order-service/
│   ├── DTOs/                      # ← MODIFY: Remove [SpasCommand] from DTOs
│   └── Program.cs
├── inventory-service/
│   └── DTOs/                      # ← MODIFY: Remove [SpasCommand] from DTOs
└── subscription-service/
    └── DTOs/                      # ← MODIFY: Remove [SpasCommand] from DTOs
```

**Structure Decision**: Existing SDK project structure maintained. Changes are internal to `Spas.Sdk.Metadata` and `Spas.Sdk.Events` projects.

## Complexity Tracking

> Constitution Check passed with no violations. No complexity justifications required.
