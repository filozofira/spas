# Implementation Plan: .NET SPAS SDK

**Branch**: `001-dotnet-spas-sdk` | **Date**: 2025-12-12 | **Completed**: 2025-12-12 | **Status**: ✅ Complete (PoC)  
**Spec**: [specs/001-dotnet-spas-sdk/spec.md](specs/001-dotnet-spas-sdk/spec.md)  
**Input**: Feature specification from `/specs/001-dotnet-spas-sdk/spec.md`

**Completion Summary**: All PoC user stories implemented (P1-P3). SDK provides metadata composition with auto-discovery, dev metadata endpoint, event publishing with trace/correlation propagation, and tracelog middleware with Zipkin integration. Configuration abstracted using environment variables matching sidecar prototype patterns. 88 unit tests passing. See [SECURITY.md](SECURITY.md) for Production migration requirements.

**Note**: Plan reflects decisions captured during clarify: SDK-only metadata composition, dev `/_spas/metadata` archive payload, identity helpers now, minimal observability middleware now. Inbound handler scaffolding (FR-005) and custom configuration package (FR-006) deferred in favor of native ASP.NET Core patterns.

## Summary

Deliver a modular .NET SDK enabling SPAS-compliant service development: metadata builders and SDK composition of `spas.json`; dev-only metadata endpoint returning an archive with `spas.json` and contract schemas; CloudEvents publish helpers with W3C trace/correlation; inbound scaffolding for commands/queries/events; configuration helpers; minimal opt-in tracelog middleware; and testing utilities. Projects are placed under `components/sdk/dotnet/src` as separate packages with a shared core.

## Technical Context

**Language/Version**: .NET 10 (current LTS)  
**Primary Dependencies**:

- Microsoft.Extensions.Logging (minimal logging abstractions)
- System.Text.Json (JSON serialization)
- OpenTelemetry (distributed tracing - PoC)
- OpenTelemetry.Exporter.Zipkin (Zipkin integration - PoC)

**Storage**: N/A (SDK is library; dev endpoint aggregates in-memory)  
**Testing**: xUnit for unit tests; lightweight integration samples (example service)  
**Target Platform**: Windows/Linux containers for services; SDK targets `net10.0`  
**Project Type**: Multi-package library (shared core + capability packages)  
**Performance Goals**: Tracelog middleware adds < 1% overhead on p95; event publish helper constructs envelopes in < 1ms avg  
**Constraints**: No external infra dependency; dev endpoint disabled in production; adherence to Constitution boundaries  
**Scale/Scope**: Phase 1 SDK scope only (no gRPC scaffolding; auth wiring deferred)  
**Observability**: Zipkin tracing (PoC via OpenTelemetry); Production transitions to full OTel with Prometheus/Jaeger

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Alignment with SDK Constitution:

- Dev metadata endpoint: optional, dev-only; aggregation without persistence; disabled in production.
- CloudEvents + W3C Trace Context propagation: required and implemented in publish helpers.
- Boundaries: No duplication of sidecar concerns; CLI composes/publishes later; Repository remains source of truth post-publish.
- Events boundary: SDK prepares payload and propagates trace/correlation/identity context; sidecar wraps into CloudEvents 1.0 and performs transformations.
- Observability First: Tracelog middleware creates Activity spans for distributed tracing; Zipkin exporter (PoC); text logging to ILogger; advanced OTel features (Prometheus/Jaeger) deferred to Production.

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
  └── .net/
    ├── SPAS.SDK.sln
    ├── src/
    │  ├── Spas.Sdk.Core/
    │  ├── Spas.Sdk.Metadata/
    │  ├── Spas.Sdk.Events/
    │  ├── Spas.Sdk.Inbound/
    │  ├── Spas.Sdk.Configuration/
    │  ├── Spas.Sdk.Observability/
    │  └── Spas.Sdk.Testing/
    ├── test/
    │  ├── Spas.Sdk.Core.Tests/
    │  ├── Spas.Sdk.Metadata.Tests/
    │  ├── Spas.Sdk.Events.Tests/
    │  ├── Spas.Sdk.Inbound.Tests/
    │  ├── Spas.Sdk.Configuration.Tests/
    │  ├── Spas.Sdk.Observability.Tests/
    │  └── Spas.Sdk.Testing.Tests/
    └── examples/
       └── SampleService/
         ├── SampleService.csproj
         └── README.md
```

**Structure Decision**: Multi-package SDK under `components/sdk/dotnet` with shared `Spas.Sdk.Core` and capability-specific projects organized beneath `src/`; dedicated tests per package beneath `test/`; example service under `examples/` for integration demonstrations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                       | Why Needed                                    | Simpler Alternative Rejected Because                                 |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Additional packages beyond core | Modular capabilities, independent versioning  | Monolithic library would force coupled releases and heavier installs |
| Inbound scaffolding abstraction | Consistent handler ergonomics across services | Ad-hoc controllers would fragment conventions and tracing            |

## Inbound Package Responsibilities

**STATUS**: ⚠️ DEFERRED - Not implemented in PoC (2025-12-12)

**Decision**: Use native ASP.NET Core minimal APIs for inbound handlers instead of custom abstractions. See `components/sdk/dotnet/src/Spas.Sdk.Inbound/README.md` for rationale and future implementation path.

**Current Approach**: Services use `app.MapPost/MapGet` with `SpasCommandAttribute`/`SpasQueryAttribute` for metadata discovery and `SpasContext` for identity/correlation access.

---

### Original Plan (for future reference)

The `Spas.Sdk.Inbound` package was planned to provide developer ergonomics and conventions for receiving commands, queries, and events within a SPAS service while respecting Constitution boundaries.

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

## SDK/Sidecar Header Contract

The SDK and sidecar communicate via HTTP headers to propagate metadata and context without coupling to CloudEvents structure within the SDK.

### Outbound (Service → Sidecar): Event Publishing

When publishing events via `EventPublisher.PublishAsync()`, the SDK sends the event payload as raw JSON in the HTTP body and propagates metadata via HTTP headers. The sidecar uses these headers to construct the CloudEvents 1.0 envelope.

**Required Headers:**

- `traceparent`: W3C Trace Context (format: `00-{trace-id}-{span-id}-{flags}`) — propagates distributed trace
- `x-service-name`: Source service name → maps to CloudEvents `source` field
- `x-correlation-id`: Correlation ID for request tracking → maps to CloudEvents `correlationid` extension
- `x-event-type`: Event type identifier → maps to CloudEvents `type` field (e.g., `com.example.order.created`)

**Optional Headers:**

- `x-user-id`: User identity claim from `SpasContext.UserId` → included in CloudEvents extensions for identity propagation
- `x-tenant-id`: Tenant identity claim from `SpasContext.TenantId` → included in CloudEvents extensions for multi-tenancy

**HTTP Request Format:**

```http
POST /publish/{topic} HTTP/1.1
Host: localhost:3001
Content-Type: application/json
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
x-service-name: sample-service
x-correlation-id: 550e8400-e29b-41d4-a716-446655440000
x-event-type: com.example.order.created
x-user-id: user-123
x-tenant-id: tenant-456

{
  "orderId": "ORDER-123",
  "amount": 100.50
}
```

**Sidecar Responsibilities:**

1. Extract headers to populate CloudEvents envelope fields
2. Wrap the raw JSON payload in CloudEvents structure
3. Publish to the message broker with routing based on `{topic}` parameter
4. Propagate trace context to downstream systems

### Inbound (Sidecar → Service): Command/Query/Event Handling

When the sidecar invokes service endpoints for commands, queries, or events, it MUST propagate trace context to maintain distributed tracing continuity.

**Required Headers:**

- `traceparent`: W3C Trace Context — ensures trace continuity from originating request
- `x-event-type`: Event type identifier from CloudEvents `type` field (for event-driven invocations)
- `x-correlation-id`: Correlation ID from the originating CloudEvents message

**Optional Headers:**

- `x-user-id`: User identity extracted from CloudEvents extensions or authentication
- `x-tenant-id`: Tenant identity for multi-tenant scenarios

**Note**: Sidecar propagates nearly the same headers for inbound invocations as services send for outbound publishing, except `x-service-name` (omitted because sidecar knows the target service).

**HTTP Request Format:**

```http
POST /incoming/events HTTP/1.1
Host: localhost:5000
Content-Type: application/json
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
x-event-type: com.example.order.created
x-correlation-id: 550e8400-e29b-41d4-a716-446655440000
x-user-id: user-123
x-tenant-id: tenant-456

{
  "orderId": "ORDER-123",
  "amount": 100.50
}
```

**SDK Responsibilities:**

1. Extract `traceparent` header to initialize `SpasTrace` context
2. Extract optional `x-correlation-id`, `x-user-id`, `x-tenant-id` to populate `SpasContext`
3. Propagate context through handler execution
4. Include trace/correlation in any published events or outbound calls

### Header Naming Convention

- **W3C Standards**: Use `traceparent` (lowercase) per W3C Trace Context specification
- **Custom Headers**: Use `x-` prefix with lowercase-hyphen-case (e.g., `x-service-name`, `x-correlation-id`)
- **Rationale**: Consistent with HTTP header conventions and easy to filter/route by proxy/gateway layers
