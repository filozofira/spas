# Implementation Plan: .NET SPAS SDK

**Branch**: `001-dotnet-spas-sdk` | **Date**: 2025-12-12 | **Spec**: [specs/001-dotnet-spas-sdk/spec.md](specs/001-dotnet-spas-sdk/spec.md)
**Input**: Feature specification from `/specs/001-dotnet-spas-sdk/spec.md`

**Note**: Plan reflects decisions captured during clarify: SDK-only metadata composition, dev `/_spas/metadata` archive payload, identity helpers now, minimal observability middleware now.

## Summary

Deliver a modular .NET SDK enabling SPAS-compliant service development: metadata builders and SDK composition of `spas.json`; dev-only metadata endpoint returning an archive with `spas.json` and contract schemas; CloudEvents publish helpers with W3C trace/correlation; inbound scaffolding for commands/queries/events; configuration helpers; minimal opt-in tracelog middleware; and testing utilities. Projects are placed under `components/sdk/.Net` as separate packages with a shared core.

## Technical Context


**Language/Version**: .NET 10 (current LTS)  
**Primary Dependencies**: Microsoft.Extensions.Logging (minimal logging abstractions), System.Text.Json (JSON serialization)  
**Storage**: N/A (SDK is library; dev endpoint aggregates in-memory)  
**Testing**: xUnit for unit tests; lightweight integration samples (example service)  
**Target Platform**: Windows/Linux containers for services; SDK targets `net10.0`  
**Project Type**: Multi-package library (shared core + capability packages)  
**Performance Goals**: Tracelog middleware adds < 1% overhead on p95; event publish helper constructs envelopes in < 1ms avg  
**Constraints**: No external infra dependency; dev endpoint disabled in production; adherence to Constitution boundaries  
**Scale/Scope**: Phase 1 SDK scope only (no gRPC scaffolding; auth wiring deferred)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Alignment with SDK Constitution:

- Dev metadata endpoint: optional, dev-only; aggregation without persistence; disabled in production.
- CloudEvents + W3C Trace Context propagation: required and implemented in publish helpers.
- Boundaries: No duplication of sidecar concerns; CLI composes/publishes later; Repository remains source of truth post-publish.
- Events boundary: SDK prepares payload and propagates trace/correlation/identity context; sidecar wraps into CloudEvents 1.0 and performs transformations.
- Observability First: minimal opt-in tracelog middleware included; advanced features deferred.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/
└── sdk/
  └── .Net/
    ├── Spas.Sdk.sln
    ├── Spas.Sdk.Core/
    ├── Spas.Sdk.Metadata/
    ├── Spas.Sdk.Events/
    ├── Spas.Sdk.Inbound/
    ├── Spas.Sdk.Configuration/
    ├── Spas.Sdk.Observability/
    ├── Spas.Sdk.Testing/
    └── examples/
      └── SampleService/
        ├── SampleService.csproj
        └── README.md

tests/
└── dotnet/
  ├── Spas.Sdk.Core.Tests/
  ├── Spas.Sdk.Metadata.Tests/
  ├── Spas.Sdk.Events.Tests/
  ├── Spas.Sdk.Inbound.Tests/
  ├── Spas.Sdk.Configuration.Tests/
  ├── Spas.Sdk.Observability.Tests/
  └── Spas.Sdk.Testing.Tests/
```

**Structure Decision**: Multi-package SDK under `components/sdk/.Net` with shared `Spas.Sdk.Core` and capability-specific projects; dedicated tests per package; example service for integration demonstrations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Additional packages beyond core | Modular capabilities, independent versioning | Monolithic library would force coupled releases and heavier installs |
| Inbound scaffolding abstraction | Consistent handler ergonomics across services | Ad-hoc controllers would fragment conventions and tracing |

## Inbound Package Responsibilities

The `Spas.Sdk.Inbound` package provides developer ergonomics and conventions for receiving commands, queries, and events within a SPAS service while respecting Constitution boundaries.

- Responsibilities:
  - Provide attributes and base classes to declare inbound handlers (e.g., `SpasCommandHandler`, `SpasQueryHandler`, `SpasEventHandler`).
  - Normalize inbound request context: access to trace ID, correlation ID, and identity claims via `SpasContext` (from Core).
  - Route-agnostic routing: Provide attributes/base classes without enforcing a specific path. Samples MAY use `/incoming` as a recommended default; an optional `inbound.basePath` config key can guide templates, not required by the library.
  - Model binding helpers for request/response payloads aligned with contract schemas (validation hooks delegated to Metadata/Testing packages).
  - Optional dev-mode handler registration helpers for quick scaffolding in sample services.

- Boundaries:
  - Does NOT implement transport-specific servers (e.g., Kestrel hosting); it supplies abstractions used by the service.
  - Does NOT perform sidecar routing or transformation; inbound payloads are considered post-sidecar mediation.
  - Does NOT implement authorization; relies on upstream middleware and identity helpers from Core.
  - Keeps PoC transport assumptions minimal (HTTP), designed for future gRPC alignment without breaking handler APIs.

- Success Signals:
  - Handlers can access `SpasContext` consistently.
  - Incoming requests validated against declared contract types.
  - Traces recorded via observability middleware when enabled.
