# SPAS SDK for .NET

[![.NET](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The .NET SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** — services that publish rich metadata, communicate via events, and maintain distributed trace context.

## 🎯 Design

> Targets **.NET net10.0**. SDK libraries are usable in any .NET application; ASP.NET Core extensions provide optional integration (minimal APIs, middleware, discovery).

## 📦 Modules

| Package                  | Description                  | ASP.NET Required? |
| ------------------------ | ---------------------------- | ----------------- |
| `Spas.Sdk.Core`          | Context, clock, identity     | ❌ No             |
| `Spas.Sdk.Metadata`      | Attributes, builders, model  | ❌ No             |
| `Spas.Sdk.Events`        | Event publishing (sidecar)   | ❌ No             |
| `Spas.Sdk.Observability` | Tracing/logging integrations | ✅ Optional       |
| `Spas.Sdk.Configuration` | Env var helpers              | ❌ No             |
| `Spas.Sdk.Inbound`       | Future inbound handlers      | ❌ N/A            |

## ✨ Features

### Metadata Generation

- Attribute-based: `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]`
- Fluent builders for identity, contracts, security, consistency, network
- Validates generated `spas.json` against design-time schema
- Kebab-case normalization: `OrderCreated` → `order-created`

### Event Publishing

- Type-safe `PublishAsync<TEvent>(payload)` API
- Automatic headers: trace context, correlation ID, service name, identity
- Sidecar HTTP integration (CloudEvents envelope handled by sidecar)

### Context & Observability

- W3C Trace Context propagation (Activity/OpenTelemetry)
- Identity propagation via headers (`x-user-id`, `x-tenant-id`)
- Tracelog middleware for request timing and correlation

## 🚀 Quick Start

For runnable examples and configuration, see:

- [Examples Services README](../../../examples/services/README.md)

## 📝 Configuration

### Environment Variables & Sidecar URL Resolution

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

1. **`SIDECAR_URL`** (full URL)

   - Set this for complete control: `http://custom-sidecar:8080`
   - Highest priority

2. **`SIDECAR_HOST` + `SIDECAR_PORT`** (explicit host and port)

   - Host: `"custom-sidecar"` → `http://custom-sidecar:7000` (uses default port 7000)
   - Host + Port: `"my-sidecar"` + `7001` → `http://my-sidecar:7001`

3. **Derived from `SERVICE_NAME`** (convention-based)

   - `SERVICE_NAME=order-service` → `http://order-service-sidecar:7000`
   - `SERVICE_NAME=Order_Service` → `http://order-service-sidecar:7000` (normalized for DNS)
   - Automatic: no additional configuration needed
   - **Recommended for Docker Compose** - sidecars are named `{service-name}-sidecar`

4. **Localhost fallback** (development)
   - No configuration needed → `http://localhost:7000`
   - Use for local development without containers

Examples are provided in the domain and service READMEs. Refer to:

- [Examples Services README](../../../examples/services/README.md)

## 🎨 Usage

Usage examples are consolidated in the runnable examples:

- [Examples Services README](../../../examples/services/README.md)

## ✍️ Writing Effective Descriptions

Descriptions are optional but strongly recommended for AI-assisted choreography.

**Rules**:

- Plain text only (no Markdown semantics)
- May include newlines
- Describe intent, not implementation details

**Good examples**:

- Service: "Order management for checkout and lifecycle updates"
- Command: "Creates a new order and reserves inventory; returns the new orderId"
- Query: "Returns current order state by orderId"
- Event: "Emitted when an order transitions to paid"

**Bad examples**:

- "CreateOrder" (just restates the name)
- "Handles orders" (too generic)
- "Creates an order quickly" (vague/subjective)

### Publish Events

Event publishing examples are available in the example services.

### Compose Metadata Manually

See the examples for metadata composition patterns.

### Access Identity Context

Identity context usage is demonstrated in the example services.

### Enable Distributed Tracing

Distributed tracing setup is covered in the runnable examples.

## 📚 Package Overview

| Package                    | Purpose              | Key Types                                                          |
| -------------------------- | -------------------- | ------------------------------------------------------------------ |
| **Spas.Sdk.Core**          | Foundation types     | `SpasContext`, `SpasTrace`, `ISpasClock`, `SpasIdentityMiddleware` |
| **Spas.Sdk.Metadata**      | Metadata composition | `SpasComposer`, builders, attributes, `DiscoverSpasMetadata()`     |
| **Spas.Sdk.Events**        | Event publishing     | `EventPublisher`, `SpasEventBuilder`, `SpasEventEnvelope`          |
| **Spas.Sdk.Observability** | Tracing & logging    | `TracelogMiddleware`, `AddSpasTracing()`, `AddSpasServices()`      |
| **Spas.Sdk.Configuration** | _(minimal)_          | Environment variable helpers                                       |
| **Spas.Sdk.Inbound**       | _(deferred)_         | Future: handler scaffolding                                        |
| **Spas.Sdk.Testing**       | _(placeholder)_      | Future: test utilities                                             |

## 🧪 Building & Testing

```bash
cd components/sdk/dotnet
dotnet build
dotnet test
```

## 📁 Project Structure

```
components/sdk/dotnet/
├── README.md
├── src/                       # SDK libraries
├── test/                      # Unit tests
└── examples/
  └── SampleService/         # Reference implementation
```

## 🔧 Configuration Patterns

## 📚 Related Documentation

- [SPAS SDK Principles](../../../principles/component/12-sdk.md)
- [Communication Model](../../../principles/protocol/07-communication-model.md)
- [Event Protocol](../../../principles/protocol/09-event-protocol.md)

## ⚠️ PoC vs Production

This SDK is a PoC. Review security guidance before production use.

## 🤝 Contributing

Contributions welcome; see module-specific guides.

## 📖 Additional Resources

- **[Quickstart Guide](../../specs/001-dotnet-spas-sdk/quickstart.md)** - Step-by-step tutorial
- **[SampleService](./examples/SampleService/README.md)** - Complete working example
- **[Specification](../../specs/001-dotnet-spas-sdk/spec.md)** - Full requirements
- **[Security Review](../../specs/001-dotnet-spas-sdk/SECURITY.md)** - PoC→Production migration
- **[Completion Report](../../specs/001-dotnet-spas-sdk/COMPLETION.md)** - Metrics & summary

## ⚠️ PoC vs Production

This SDK is a PoC. Review [SECURITY.md](../../specs/001-dotnet-spas-sdk/SECURITY.md) before treating it as production-ready.

## 🤝 Contributing

This SDK is part of the SPAS framework PoC. For questions or improvements:

1. Review the [specification](../../specs/001-dotnet-spas-sdk/spec.md)
2. Check [tasks.md](../../specs/001-dotnet-spas-sdk/tasks.md) for implementation details
3. Run tests: `dotnet test`
4. Follow existing patterns (attribute-based discovery, single-line config)

## 📄 License

See [LICENSE](../../../LICENSE) in the repository root.
