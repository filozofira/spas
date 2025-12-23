# SPAS SDK for .NET

[![.NET](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The .NET SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** — services that publish rich metadata, communicate via events, and maintain distributed trace context.

> Targets **.NET net10.0**. SDK libraries are usable in any .NET application; ASP.NET Core extensions provide optional integration (minimal APIs, middleware, discovery).

## For Users

### Quick Start

1. Run the reference SampleService:

```bash
cd components/sdk/dotnet/examples/SampleService
dotnet run
```

2. Use a runnable end-to-end example: [Examples Services README](../../../examples/services/README.md)

### Packages

| Package                  | Description                  | ASP.NET Required? |
| ------------------------ | ---------------------------- | ----------------- |
| `Spas.Sdk.Core`          | Context, clock, identity     | ❌ No             |
| `Spas.Sdk.Metadata`      | Attributes, builders, model  | ❌ No             |
| `Spas.Sdk.Events`        | Event publishing (sidecar)   | ❌ No             |
| `Spas.Sdk.Observability` | Tracing/logging integrations | ✅ Optional       |
| `Spas.Sdk.Configuration` | Env var helpers              | ❌ No             |
| `Spas.Sdk.Inbound`       | Future inbound handlers      | ❌ N/A            |

### Features

**Metadata Generation:**

- Attribute-based: `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]`
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

#### Sidecar URL Resolution Priority

The SDK resolves the sidecar URL in this order (first match wins):

1. **`SIDECAR_URL`** — Full URL, highest priority (`http://custom-sidecar:8080`)
2. **`SIDECAR_HOST` + `SIDECAR_PORT`** — Explicit host/port (`http://my-sidecar:7001`)
3. **Derived from `SERVICE_NAME`** — Convention-based (`order-service` → `http://order-service-sidecar:7000`). Recommended for Docker Compose.
4. **Localhost fallback** — No configuration needed (`http://localhost:7000`)

### Writing Effective Descriptions

Descriptions are optional but strongly recommended for AI-assisted choreography.

**Rules:**: Plain text only; describe intent, not implementation.

**Good examples:**:

- Service: "Order management for checkout and lifecycle updates"
- Command: "Creates a new order and reserves inventory; returns the new orderId"
- Event: "Emitted when an order transitions to paid"

**Bad examples:**: "CreateOrder" (restates name), "Handles orders" (too generic)

### Package Reference

| Package                    | Purpose              | Key Types                                                          |
| -------------------------- | -------------------- | ------------------------------------------------------------------ |
| **Spas.Sdk.Core**          | Foundation types     | `SpasContext`, `SpasTrace`, `ISpasClock`, `SpasIdentityMiddleware` |
| **Spas.Sdk.Metadata**      | Metadata composition | `SpasComposer`, builders, attributes, `DiscoverSpasMetadata()`     |
| **Spas.Sdk.Events**        | Event publishing     | `EventPublisher`, `SpasEventBuilder`, `SpasEventEnvelope`          |
| **Spas.Sdk.Observability** | Tracing & logging    | `TracelogMiddleware`, `AddSpasTracing()`, `AddSpasServices()`      |
| **Spas.Sdk.Configuration** | _(minimal)_          | Environment variable helpers                                       |
| **Spas.Sdk.Inbound**       | _(deferred)_         | Future: handler scaffolding                                        |
| **Spas.Sdk.Testing**       | _(placeholder)_      | Future: test utilities                                             |

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
