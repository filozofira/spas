# SPAS SDK for .NET

[![.NET](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-94%20passing-success)](./test)

The .NET SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** - services that publish rich metadata, communicate via events, and maintain distributed trace context.

## 📦 What is SPAS?

SPAS is an architectural framework where:

- **Services publish metadata** (`spas.json`) describing their contracts, security, and health
- **Events flow through sidecars** that handle CloudEvents wrapping and topic adaptation
- **Trace context propagates** automatically via W3C Trace Context headers
- **Services remain portable** - no vendor lock-in, run anywhere

## ✨ Features

### 🎯 Metadata Composition

- **Attribute-based auto-discovery**: Decorate endpoints with `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]`
- **Fluent builders**: Compose identity, contracts, security, health metadata programmatically
- **Schema validation**: Validates generated `spas.json` against SPAS schema
- **Dev endpoint**: `/_spas/metadata` returns ZIP with metadata + all schemas (Development only)

### 📤 Event Publishing

- **Type-safe API**: `PublishAsync<TEvent>(payload)` - derives event type from `[SpasEvent]` attribute
- **Automatic headers**: SDK adds trace context, correlation ID, service name, identity
- **Sidecar integration**: Publishes to sidecar via HTTP POST; sidecar wraps in CloudEvents
- **Topic routing**: Sidecar handles topic routing based on event type configuration
- **Trace propagation**: W3C Trace Context flows through entire event chain

### 📊 Observability

- **Tracelog middleware**: Logs requests with timing, status, trace/correlation IDs
- **OpenTelemetry integration**: Creates Activity spans for distributed tracing
- **Zipkin export**: Built-in Zipkin exporter for PoC (production uses Prometheus/Jaeger)
- **Dual logging**: Text logs (ILogger) + structured traces (OpenTelemetry)

### 🔐 Identity & Context

- **AsyncLocal context**: Thread-safe, async-flow-safe identity storage
- **Automatic population**: Middleware extracts identity from HTTP context
- **Header propagation**: Identity flows in `x-user-id` / `x-tenant-id` headers
- **PoC pattern**: Identity in headers (Production uses mTLS + SPIFFE)

## 🚀 Quick Start

### Installation

Add project references to your service:

```xml
<ItemGroup>
  <ProjectReference Include="path/to/Spas.Sdk.Core" />
  <ProjectReference Include="path/to/Spas.Sdk.Metadata" />
  <ProjectReference Include="path/to/Spas.Sdk.Events" />
  <ProjectReference Include="path/to/Spas.Sdk.Observability" />
</ItemGroup>
```

### Minimal Setup

```csharp
using Spas.Sdk.Core.Identity;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;
using Spas.Sdk.Observability.Tracing;

var builder = WebApplication.CreateBuilder(args);

// 1. Register metadata services with auto-discovery
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
});

// 2. Configure all SPAS infrastructure (EventPublisher + OpenTelemetry + Zipkin)
// Reads: SERVICE_NAME, SIDECAR_HOST, SIDECAR_PORT, ZIPKIN_URL from environment
var serviceName = builder.Services.AddSpasServices(builder.Configuration, "my-service");

var app = builder.Build();

// 3. Enable identity middleware (populates SpasContext from HTTP headers/claims)
app.UseSpasIdentity();

// 4. Enable tracelog middleware (request/response logging + distributed tracing)
app.UseSpasTracelog();

// 5. Discover contracts from attributes
var contracts = app.DiscoverSpasMetadata();

// 6. Define endpoints with SPAS attributes
app.MapPost("/commands/create-order", async (CreateOrderRequest request) =>
{
    var orderId = Guid.NewGuid();
    return Results.Ok(new { orderId });
})
.WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0"));

app.Run();
```

**That's it!** Set environment variables and the SDK handles everything.

## 📝 Environment Variables

The SDK uses flat environment variables matching docker-compose patterns:

| Variable       | Description            | Default             | Example                            |
| -------------- | ---------------------- | ------------------- | ---------------------------------- |
| `SERVICE_NAME` | Service identifier     | `"unknown-service"` | `"order-service"`                  |
| `SIDECAR_HOST` | Sidecar hostname       | Required            | `"localhost"` or `"order-sidecar"` |
| `SIDECAR_PORT` | Sidecar port           | Required            | `7001`                             |
| `SIDECAR_URL`  | Alternative single URL | Optional            | `"http://localhost:7001"`          |
| `ZIPKIN_URL`   | Zipkin endpoint        | Optional            | `"http://localhost:9411"`          |
| `PORT`         | Service listening port | `5000`              | `8080`                             |

**docker-compose example:**

```yaml
services:
  order-service:
    environment:
      - SERVICE_NAME=order-service
      - SIDECAR_HOST=order-sidecar
      - SIDECAR_PORT=7001
      - ZIPKIN_URL=http://zipkin:9411
```

## 🎨 Usage Examples

### 1. Define Contracts with Attributes

**Commands:**

```csharp
app.MapPost("/commands/create-order", async (CreateOrderRequest request) =>
{
    // Business logic
    return Results.Ok(new { orderId = Guid.NewGuid() });
})
.WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0",
    schemaRef: "schemas/create-order-request.json"));
```

**Queries:**

```csharp
app.MapGet("/queries/get-order/{id}", async (string id) =>
{
    // Query logic
    return Results.Ok(new { id, status = "completed" });
})
.WithMetadata(new SpasQueryAttribute("GetOrder", "1.0"));
```

**Events:**

```csharp
[SpasEvent("OrderCreated", "1.0", schemaRef: "schemas/order-created-event.json")]
public record OrderCreatedEvent(string OrderId, string CustomerId, decimal Total);
```

### 2. Publish Events

```csharp
// Define event with metadata
[SpasEvent("OrderCreated", "1.0",
    EventType = "com.example.order.created",
    Schema = "schemas/order-created.json")]
public record OrderCreatedEvent(string OrderId, string CustomerId, decimal Total);

app.MapPost("/commands/create-order",
    async (CreateOrderRequest request, EventPublisher publisher) =>
{
    var orderId = Guid.NewGuid();

    // Publish event - type-safe with automatic event type from attribute
    await publisher.PublishAsync<OrderCreatedEvent>(
        payload: new
        {
            orderId,
            customerId = request.CustomerId,
            total = request.Total
        }
    );

    return Results.Ok(new { orderId });
});
```

**What happens:**

1. SDK extracts `EventType` from `[SpasEvent]` attribute (or auto-generates from service name + event name)
2. SDK sends to sidecar at `/publish` endpoint with headers
3. Sidecar routes to appropriate topic based on event type configuration

**Headers sent to sidecar:**

- `traceparent`: `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
- `x-service-name`: `order-service`
- `x-event-type`: `com.example.order.created` (from attribute)
- `x-correlation-id`: `550e8400-e29b-41d4-a716-446655440000`
- `x-user-id`: `user-123` (from SpasContext)
- `x-tenant-id`: `tenant-456` (from SpasContext)

The sidecar wraps this in CloudEvents 1.0 format.

### 3. Compose Metadata Manually

For service-level metadata (identity, security, health):

```csharp
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;

// Build identity
var identity = new ServiceIdentityBuilder()
    .WithName("order-service")
    .WithVersion("1.0.0")
    .WithDescription("Order management service")
    .WithOwner("platform-team")
    .Build();

// Build security metadata
var security = new SecurityBuilder()
    .WithAuthentication(required: true, schemes: ["bearer"])
    .WithAuthorization(["admin", "user"])
    .Build();

// Build health metadata
var health = new HealthBuilder()
    .WithHealthEndpoint("/_health")
    .WithReadinessEndpoint("/_ready")
    .Build();

// Compose spas.json
var composer = new SpasComposer();
await composer.ComposeToFileAsync(
    path: "spas.json",
    identity: identity,
    contracts: contracts, // from app.DiscoverSpasMetadata()
    security: security,
    health: health
);
```

### 4. Access Identity Context

Identity is automatically populated by `UseSpasIdentity()` middleware:

```csharp
app.MapPost("/commands/create-order", async () =>
{
    var userId = SpasContext.UserId;       // From x-user-id header or JWT claim
    var tenantId = SpasContext.TenantId;   // From x-tenant-id header or JWT claim
    var correlationId = SpasContext.CorrelationId; // From x-correlation-id header

    // Use in business logic
    return Results.Ok(new { userId, tenantId });
});
```

### 5. Enable Distributed Tracing

View traces in Zipkin:

```bash
# Start Zipkin
docker run -d -p 9411:9411 openzipkin/zipkin

# Set environment variable
export ZIPKIN_URL=http://localhost:9411

# Run service - traces appear automatically at http://localhost:9411
dotnet run
```

**Trace data includes:**

- HTTP method, URL, status code
- Request duration (latency)
- Correlation ID, user ID, tenant ID
- Error details (if request failed)

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

## 🧪 Testing

Run all 94 unit tests:

```bash
cd components/sdk/dotnet
dotnet test
```

**Test coverage:**

- Core: 12 tests (ISpasClock, SpasContext, SpasTrace, SpasIdentityMiddleware)
- Metadata: 40 tests (builders, composer, validator, auto-discovery)
- Events: 18 tests (event builder, publisher)
- Observability: 12 tests (tracelog middleware, OpenTelemetry)
- Dev Endpoint: 12 tests (metadata endpoint, archive writer)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your Service                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Commands   │  │   Queries    │  │    Events    │ │
│  │  [SpasCmd]   │  │  [SpasQry]   │  │  [SpasEvt]   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │         SPAS SDK (.NET)                          │  │
│  │  • Auto-discovery (attributes → metadata)        │  │
│  │  • SpasContext (identity/correlation)            │  │
│  │  • EventPublisher (HTTP → sidecar)               │  │
│  │  • TracelogMiddleware (Activity spans)           │  │
│  │  • SpasIdentityMiddleware (populate context)     │  │
│  └───────────────┬──────────────────────────────────┘  │
└──────────────────┼─────────────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │   SPAS Sidecar     │
         │ • CloudEvents      │
         │ • Topic adaptation │
         │ • Trace propagation│
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │  Redis / Kafka     │
         │  (Event Broker)    │
         └────────────────────┘
```

## 🔧 Configuration Patterns

### Single-Line Setup (Recommended)

Use `AddSpasServices()` for complete infrastructure:

```csharp
var serviceName = builder.Services.AddSpasServices(
    builder.Configuration,
    defaultServiceName: "my-service"
);
```

This configures:

- EventPublisher with sidecar HTTP client
- OpenTelemetry tracing with Zipkin exporter
- Reads all environment variables automatically

### Manual Setup (Advanced)

For fine-grained control:

```csharp
// 1. Configure EventPublisher manually
builder.Services.AddHttpClient<EventPublisher>(client =>
{
    client.BaseAddress = new Uri("http://localhost:7001");
})
.AddTypedClient((httpClient, sp) =>
{
    return new EventPublisher(httpClient, "my-service");
});

// 2. Configure OpenTelemetry manually
builder.Services.AddSpasTracing(
    serviceName: "my-service",
    zipkinEndpoint: "http://localhost:9411/api/v2/spans"
);
```

## 📖 Additional Resources

- **[Quickstart Guide](../../specs/001-dotnet-spas-sdk/quickstart.md)** - Step-by-step tutorial
- **[SampleService](./examples/SampleService/README.md)** - Complete working example
- **[Specification](../../specs/001-dotnet-spas-sdk/spec.md)** - Full requirements
- **[Security Review](../../specs/001-dotnet-spas-sdk/SECURITY.md)** - PoC→Production migration
- **[Completion Report](../../specs/001-dotnet-spas-sdk/COMPLETION.md)** - Metrics & summary

## ⚠️ PoC vs Production

**Current Status:** ✅ PoC Complete - Ready for development/testing

**Production Migration Required:**

| Component            | PoC                   | Production Required               |
| -------------------- | --------------------- | --------------------------------- |
| **Identity**         | Headers (`x-user-id`) | mTLS + SPIFFE workload identity   |
| **Tracing**          | Zipkin                | Prometheus + Jaeger / Tempo       |
| **OpenTelemetry**    | 1.10.0 (CVE)          | Upgrade to 2.0+                   |
| **Secrets**          | Environment vars      | Azure Key Vault / HashiCorp Vault |
| **Event Publishing** | No retry              | Polly retry + circuit breaker     |
| **Communication**    | HTTP                  | gRPC with TLS 1.3                 |

See [SECURITY.md](../../specs/001-dotnet-spas-sdk/SECURITY.md) for complete checklist.

## 🤝 Contributing

This SDK is part of the SPAS framework PoC. For questions or improvements:

1. Review the [specification](../../specs/001-dotnet-spas-sdk/spec.md)
2. Check [tasks.md](../../specs/001-dotnet-spas-sdk/tasks.md) for implementation details
3. Run tests: `dotnet test`
4. Follow existing patterns (attribute-based discovery, single-line config)

## 📄 License

See [LICENSE](../../../LICENSE) in the repository root.

---

**Built with .NET 10** | **88 Tests Passing** | **Production-Ready Architecture**
