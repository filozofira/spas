# SPAS SDK for .NET

[![.NET](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

The .NET SDK for building **SPAS (Self-contained, Portable, Adaptable Services)** - services that publish rich metadata, communicate via events, and maintain distributed trace context.

> Platform:
>
> - SDK and sample projects target **.NET net10.0**. Plans, tasks, and validation assume net10.0 unless explicitly overridden.
> - Testing framework: **xUnit** for SDK unit tests and validation tasks.

## 📦 What is SPAS?

SPAS is an architectural framework where:

- **Services publish metadata** (`spas.json`) describing their contracts, security, and health
- **Events flow through sidecars** that handle CloudEvents wrapping and topic adaptation
- **Trace context propagates** automatically via W3C Trace Context headers
- **Services remain portable** - no vendor lock-in, run anywhere

## ✨ Features

### 🎯 Metadata Composition

- **Design-time metadata**: SDK emits `spas.json` aligned with SPAS design-time-metadata-v1 schema
  - Includes `schemaVersion`, service identity (`id`, `boundedContext`, `capabilities`), contracts, consistency, network, security
  - Runtime metadata (container image, env, resources) managed by Repository/CLI (not SDK)
- **Attribute-based auto-discovery**: Decorate endpoints with `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]`
- **Fluent builders**: Compose identity, contracts, security, consistency, network metadata programmatically
  - `ServiceIdentityBuilder`: Define service ID, bounded context, capabilities
  - `ContractsBuilder`: Add endpoints (type, protocol, methodPath, schemaRef) and events (type, version, schemaRef)
  - `SecurityBuilder`: Configure authentication + data classification levels
  - `ConsistencyBuilder`: Specify consistency guarantees (commands: ACID/EVENTUAL, queries: STRONG/EVENTUAL)
  - `NetworkBuilder`: Declare required egress dependencies
- **Schema references**: Endpoints and events use `schemaRef` (relative/absolute URIs) instead of embedded schemas
- **Schema validation**: Validates generated `spas.json` against design-time-metadata-v1 JSON Schema
  - Schema location: `components/sdk/schemas/design-time-metadata-v1.schema.json`
  - Distributed via CLI/Repository for validation (not bundled in SDK packages)
- **Dev endpoint**: `/_spas/metadata` returns ZIP with metadata + all schemas (Development only)

### 📤 Event Publishing

- **Type-safe API**: `PublishAsync<TEvent>(payload)` - derives event type from `[SpasEvent]` attribute
- **Automatic headers**: SDK adds trace context, correlation ID, service name, identity
- **Sidecar integration**: Publishes to sidecar via HTTP POST; sidecar wraps in CloudEvents
- **Topic routing**: Sidecar handles topic routing based on event type configuration
- **Trace propagation**: W3C Trace Context flows through entire event chain
- **Event naming**: SDK normalizes event names to **kebab-case** in `spas.json` for cross-language interoperability
  - `[SpasEvent("OrderCreated")]` → stored as `order-created` in spas.json
  - CloudEvents type: `com.{service-name}.{event-name-kebab}` (e.g., `com.order-service.order-created`)
  - Other SDKs (Python, Go, etc.) normalize their native conventions to the same kebab-case format

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
// Reads: SERVICE_NAME, SIDECAR_HOST, SIDECAR_PORT, SIDECAR_URL, ZIPKIN_URL from environment
// Derives sidecar host from SERVICE_NAME if SIDECAR_HOST not set
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

## 📝 Environment Variables & Sidecar URL Resolution

The SDK uses flat environment variables matching docker-compose patterns:

| Variable       | Description            | Default             | Example                            |
| -------------- | ---------------------- | ------------------- | ---------------------------------- |
| `SERVICE_NAME` | Service identifier     | `"unknown-service"` | `"order-service"`                  |
| `SIDECAR_URL`  | Full sidecar URL       | Derived from convention | `"http://localhost:7000"`          |
| `SIDECAR_HOST` | Sidecar hostname       | Derived from SERVICE_NAME | `"order-sidecar"` or `"custom"`|
| `SIDECAR_PORT` | Sidecar port           | `7000` (default)    | `7001` or `3000`                   |
| `ZIPKIN_URL`   | Zipkin endpoint        | Optional            | `"http://localhost:9411"`          |
| `PORT`         | Service listening port | `5000`              | `8080`                             |

### Sidecar URL Resolution Priority

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

### Examples

**Docker Compose (Recommended - Uses Convention)**

```yaml
services:
  order-service:
    environment:
      - SERVICE_NAME=order-service
      # That's it! SDK auto-derives: order-service-sidecar:7000

  order-service-sidecar:
    container_name: order-service-sidecar
    environment:
      - SIDECAR_PORT=7000
```

**Explicit Configuration (Override)**

```yaml
services:
  order-service:
    environment:
      - SERVICE_NAME=order-service
      - SIDECAR_HOST=shared-sidecar  # Override: use custom host
      - SIDECAR_PORT=7001            # Override: use custom port
```

**Full URL (Complete Control)**

```yaml
services:
  order-service:
    environment:
      - SERVICE_NAME=order-service
      - SIDECAR_URL=http://custom-gateway:8080  # Complete URL, highest priority
```

**Local Development (Fallback)**

```bash
# No configuration → defaults to http://localhost:7000
dotnet run
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
  schemaRef: "schemas/create-order-request.json")
{
  Description = "Creates a new order and reserves inventory; returns the new orderId"
});
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
[SpasEvent("OrderCreated", "1.0", schemaRef: "schemas/order-created-event.json",
  Description = "Emitted after an order is successfully created and persisted")]
public record OrderCreatedEvent(string OrderId, string CustomerId, decimal Total);
```

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

Run all unit tests:

```bash
cd components/sdk/dotnet
dotnet test
```

## 🏗️ Architecture

```text
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

This SDK is a PoC. Review [SECURITY.md](../../specs/001-dotnet-spas-sdk/SECURITY.md) before treating it as production-ready.

## 🤝 Contributing

This SDK is part of the SPAS framework PoC. For questions or improvements:

1. Review the [specification](../../specs/001-dotnet-spas-sdk/spec.md)
2. Check [tasks.md](../../specs/001-dotnet-spas-sdk/tasks.md) for implementation details
3. Run tests: `dotnet test`
4. Follow existing patterns (attribute-based discovery, single-line config)

## 📄 License

See [LICENSE](../../../LICENSE) in the repository root.

