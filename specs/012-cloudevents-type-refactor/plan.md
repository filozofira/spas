# Implementation Plan: CloudEvents Type Construction Refactor

**Branch**: `012-cloudevents-type-refactor` | **Date**: 2025-01-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-cloudevents-type-refactor/spec.md`

## Summary

Move CloudEvents `type` field construction from SDK to Sidecar. SDK will send `x-event-name` header (short kebab-case) instead of `x-event-type` (full format). Sidecar constructs `com.{service-name}.{event-name}` from headers. Maintains backward compatibility with legacy `x-event-type` header.

## Technical Context

**Language/Version**: C# 12 / .NET 10.0 (SDK), TypeScript / Node.js 20.x (Sidecar, CLI)  
**Primary Dependencies**: Microsoft.Extensions.Http (SDK), Express.js (Sidecar), Commander (CLI)  
**Storage**: N/A (no persistence changes)  
**Testing**: xUnit (SDK), Jest (Sidecar, CLI)  
**Target Platform**: Docker containers (Linux)
**Project Type**: Multi-component (SDK + Sidecar + CLI + Docs)  
**Performance Goals**: No latency impact - header construction is ~microseconds  
**Constraints**: Backward compatibility with existing deployments using `x-event-type`  
**Scale/Scope**: Cross-cutting change across 3 components + 2 documentation files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution Principle | Relevant? | Status | Notes |
|------------------------|-----------|--------|-------|
| I. Single Bounded Context | No | N/A | Infrastructure change, not service-level |
| II. No Direct Service-to-Service | Yes | ✅ Pass | Change maintains sidecar mediation |
| III. Event-First Integration | Yes | ✅ Pass | Enhances event publishing flow |
| IV. Convention Over Configuration | Yes | ✅ Pass | Establishes consistent header convention |
| V. Security by Default | No | N/A | No security surface changes |
| VI. Observability First | Yes | ✅ Pass | Tracing unaffected |
| VII. Portable Packaging | No | N/A | No packaging changes |
| VIII. Adaptable Through Config | Yes | ✅ Pass | Sidecar config drives routing |

**SDK Constitution Check**:
- ✅ "SDK MUST NOT construct CloudEvents envelopes" - This change aligns: SDK sends short name, sidecar constructs full type
- ✅ "SDK prepares payloads and propagates W3C Trace Context" - Unchanged
- ✅ "Sidecar wraps outgoing events into CloudEvents 1.0" - Enhanced: sidecar now also constructs `type` field

**Terminology Fix Required**: Spec uses both "boundedContext" and "service-name" for type format. Codebase uses service name. Align documentation to: `com.{service-name}.{event-name-kebab}`

## Project Structure

### Documentation (this feature)

```text
specs/012-cloudevents-type-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (affected components)

```text
components/
├── sdk/dotnet/
│   └── src/Spas.Sdk.Events/Publish/
│       └── EventPublisher.cs           # Change x-event-type → x-event-name
├── sidecar/
│   └── src/
│       ├── services/event-publisher.ts # Extract x-event-name, construct type
│       ├── cloudevents/wrapper.ts      # Accept constructed type
│       └── types.ts                    # Add eventName to PublishHeaders
└── cli/spas-compose/
    └── src/services/
        └── sidecar-config-generator.ts # Add eventName to outbound entries

principles/
├── component/
│   ├── 10-sidecar-contract.md          # Document x-event-name header
│   └── 12-sdk.md                       # Update SDK event publishing section
```

**Structure Decision**: No new files required. Changes are modifications to existing components.

## Complexity Tracking

No constitution violations requiring justification.
