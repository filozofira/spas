# Implementation Plan: SDK Sidecar Host Convention

**Branch**: `011-sdk-sidecar-host` | **Date**: 2025-12-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-sdk-sidecar-host/spec.md`

## Summary

Modify the .NET SDK's `SpasConfiguration.GetSpasSidecarUrl()` to auto-derive sidecar hostname from `SERVICE_NAME` using the convention `{service-name}-sidecar:7000`. This eliminates redundant configuration in Docker Compose deployments while maintaining backward compatibility with explicit settings.

## Technical Context

**Language/Version**: C# 12 / .NET 10.0  
**Primary Dependencies**: Microsoft.Extensions.Configuration, Microsoft.Extensions.Logging  
**Storage**: N/A (configuration only)  
**Testing**: xUnit (existing SDK test project)  
**Target Platform**: .NET 10.0 (cross-platform)
**Project Type**: SDK library  
**Performance Goals**: N/A (startup configuration)  
**Constraints**: Must be backward compatible with existing deployments  
**Scale/Scope**: Single method modification + tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | ✅ N/A | SDK library, not a service |
| II. No Direct Service-to-Service | ✅ Supports | Reinforces sidecar pattern by convention |
| III. Event-First Integration | ✅ N/A | Configuration concern only |
| IV. Convention Over Configuration | ✅ **IMPLEMENTS** | This feature directly implements the convention `${SERVICE_NAME}-sidecar` |
| V. Sidecar Mediation | ✅ Supports | Makes sidecar connection easier |
| VI. Schema Evolution | ✅ N/A | No schema changes |
| VII. Observability | ✅ Supports | FR-006 adds startup logging |
| VIII. Security Model | ✅ N/A | No security changes |

**Gate Status**: ✅ PASS - All principles satisfied. Feature directly implements Constitution Principle IV.

## Project Structure

### Documentation (this feature)

```text
specs/011-sdk-sidecar-host/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - config only)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (existing SDK structure)

```text
components/sdk/dotnet/
├── src/
│   ├── Spas.Sdk.Core/
│   │   └── Configuration/
│   │       └── SpasConfiguration.cs    # PRIMARY: Modify GetSpasSidecarUrl()
│   └── Spas.Sdk.Observability/
│       └── Extensions/
│           └── SpasServiceExtensions.cs # Uses GetSpasSidecarUrl() - add logging
└── test/
    └── Spas.Sdk.Core.Tests/
        └── Configuration/
            └── SpasConfigurationTests.cs # Add tests for derivation logic
```

**Structure Decision**: Existing SDK structure. Modify `SpasConfiguration.cs` to add derivation logic.

## Complexity Tracking

> No Constitution violations. Feature directly implements Principle IV (Convention Over Configuration).

## Phase Status

| Phase | Artifacts | Status |
|-------|-----------|--------|
| Phase 0 | [research.md](research.md) | ✅ Complete |
| Phase 1 | [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md) | ✅ Complete |
| Phase 2 | [tasks.md](tasks.md) | ✅ Complete |

## Plan Summary

**Ready for Task Generation**: The SDK Sidecar Host Convention feature is fully researched and designed:

1. **Single Method Change**: Modify `GetSpasSidecarUrl()` in `SpasConfiguration.cs`
2. **Derivation Logic**: `{SERVICE_NAME}-sidecar:7000`
3. **Backward Compatible**: Explicit config takes precedence
4. **Testing**: Add xUnit tests for resolution priority
5. **Logging**: Add startup log in `SpasServiceExtensions.cs`

Proceed to `/speckit.tasks` to generate implementation tasks.
