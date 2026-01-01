# SPAS SDK for .NET

[![.NET](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The .NET SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** — services that publish rich metadata, communicate via events, and maintain distributed trace context.

> Targets **.NET 10.0**. SDK libraries are usable in any .NET application; ASP.NET Core extensions provide optional integration (minimal APIs, middleware, discovery).

## For Users

### Local Development Setup

> **Note:** The SPAS .NET SDK is currently **not published to NuGet.org**. All development uses a **local NuGet feed** only.

When developing services that reference SPAS SDK packages, you need the SDK packages available locally:

**One-time setup:**
```bash
cd components/sdk/dotnet
.\Publish-LocalNuGet.ps1 -Setup
```

This will:
- Create a local NuGet feed at `~/.nuget/local-feed`
- Build all SDK packages with version `1.0.0-local-{timestamp}`
- Publish packages to the local feed

**After SDK changes:**
```bash
.\Publish-LocalNuGet.ps1 -Rebuild
```

**Add to your service's nuget.config:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="spas-local" value="~/.nuget/local-feed" />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
  </packageSources>
</configuration>
```

Or add to global config with: `.\Publish-LocalNuGet.ps1 -Setup -Global`

### Quick Start

1. Run the reference SampleService:

```bash
cd components/sdk/dotnet/examples/SampleService
dotnet run
```

2. Use a runnable end-to-end example: [Examples Services README](../../../examples/services/README.md)

### Generate Design-time Metadata (Offline)

Generate the complete design-time metadata archive without starting the HTTP server:

```bash
cd components/sdk/dotnet/examples/SampleService
dotnet run -- --generate-metadata --output ./metadata
```

This writes `./metadata/service.metadata.zip` (containing `spas.json` + referenced schemas).

### Packages

| Package                    | Purpose                    | Key Types                                                          |
| -------------------------- | -------------------------- | ------------------------------------------------------------------ |
| `Spas.Sdk.Core`            | Context, clock, identity   | `SpasContext`, `SpasTrace`, `ISpasClock`, `SpasIdentityMiddleware` |
| `Spas.Sdk.Metadata`        | Attributes, builders       | `SpasComposer`, builders, attributes, `DiscoverSpasMetadata()`     |
| `Spas.Sdk.Events`          | Event publishing (sidecar) | `EventPublisher`, `SpasEventBuilder`, `SpasEventEnvelope`          |
| `Spas.Sdk.Observability`   | Tracing & logging          | `TracelogMiddleware`, `AddSpasTracing()`, `AddSpasServices()`      |
| `Spas.Sdk.Configuration`   | Env var helpers            | Environment variable helpers                                       |
| `Spas.Sdk.Inbound`         | _(deferred)_               | Future: handler scaffolding                                        |
| `Spas.Sdk.Testing`         | _(placeholder)_            | Future: test utilities                                             |

### Features

**Metadata Generation:**

- **ASP.NET Core MVC Controllers & Minimal APIs** — supports both `app.MapPost`/`MapGet` and controller actions with `[SpasCommand]`/`[SpasQuery]`
- Endpoint-centric: `[SpasCommand]`, `[SpasQuery]` on handlers/controller actions; `[SpasEvent]` on event types
- DTOs are plain classes (no attributes required) — **request schemas inferred automatically**
- **Schema generation limitation**: Only request/command body schemas are generated; response schemas are not inferred (PoC scope)
- Fluent builders for identity, contracts, security, consistency, network
- Validates generated `spas.json` against design-time schema
- Kebab-case normalization: `OrderCreated` → `order-created`

**Event Publishing:**

- Type-safe `PublishAsync<TEvent>(payload)` API
- Automatic headers: trace context, correlation ID, service name, identity
- Sidecar HTTP integration (CloudEvents envelope handled by sidecar)

**Context & Observability:**

- W3C Trace Context propagation (Activity/OpenTelemetry)
- Identity propagation via headers (`x-user-id`, `x-tenant-id`)
- Tracelog middleware for request timing and correlation

### Configuration

The SDK uses flat environment variables matching docker-compose patterns:

| Variable       | Description            | Default                   | Example                         |
| -------------- | ---------------------- | ------------------------- | ------------------------------- |
| `SERVICE_NAME` | Service identifier     | `"unknown-service"`       | `"order-service"`               |
| `SIDECAR_URL`  | Full sidecar URL       | Derived from convention   | `"http://localhost:7000"`       |
| `SIDECAR_HOST` | Sidecar hostname       | Derived from SERVICE_NAME | `"order-sidecar"` or `"custom"` |
| `SIDECAR_PORT` | Sidecar port           | `7000` (default)          | `7001` or `3000`                |
| `ZIPKIN_URL`   | Zipkin endpoint        | Optional                  | `"http://localhost:9411"`       |
| `PORT`         | Service listening port | `5000`                    | `8080`                          |

**Sidecar URL Resolution:** `SIDECAR_URL` > `SIDECAR_HOST:PORT` > derived from `SERVICE_NAME` > localhost. See [Sidecar Contract](../../../principles/component/10-sidecar-contract.md) for details.

### Writing Effective Descriptions

Descriptions improve AI-assisted choreography. Use plain text describing intent, not implementation.

- ✅ Good: "Creates a new order and reserves inventory; returns the new orderId"
- ❌ Bad: "CreateOrder" (restates name), "Handles orders" (too generic)

More examples: [SDK Principles](../../../principles/component/12-sdk.md)

### Health Checks

The SDK exposes standard health endpoints on the main application port. To enable them:

```csharp
using Spas.Sdk.Inbound.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register SPAS health checks (wraps ASP.NET Core Health Checks)
builder.Services.AddSpasHealthChecks();

var app = builder.Build();

// Map health endpoints at /_spas/health/*
app.UseSpasHealthChecks();

app.Run();
```

**Endpoints:**

- `GET /_spas/health/live`: Liveness probe (Always UP)
- `GET /_spas/health/ready`: Readiness probe (Delegates to ASP.NET Core Health Checks)

**Response format:**
```json
{ "status": "UP" }
```

**Adding custom checks:**

```csharp
builder.Services.AddSpasHealthChecks();
builder.Services.AddHealthChecks()
    .AddCheck<MyDatabaseCheck>("database");
```

### Additional Resources

- [SampleService](./examples/SampleService/README.md) — Complete working example
- [Examples Services](../../../examples/services/README.md) — Runnable domain examples
- [SPAS SDK Principles](../../../principles/component/12-sdk.md)
- [Communication Model](../../../principles/protocol/07-communication-model.md)
- [Event Protocol](../../../principles/protocol/09-event-protocol.md)

### PoC vs Production

This SDK is a PoC. Review [SECURITY.md](../../../specs/001-dotnet-spas-sdk/SECURITY.md) before treating it as production-ready.

## For Contributors

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

See [LICENSE](../../../LICENSE) in the repository root.
