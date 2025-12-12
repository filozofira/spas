# SPAS SDK Sample Service

This sample service demonstrates the complete usage of the .NET SPAS SDK, including:

- **Metadata Composition**: Auto-discovery of contracts from attributes + manual composition
- **Dev Metadata Endpoint**: `/_spas/metadata` returns ZIP archive with `spas.json` and schemas
- **Event Publishing**: Publishing events via HTTP to sidecar with trace/correlation headers
- **Tracelog Middleware**: Request/response logging with trace context
- **Distributed Tracing**: OpenTelemetry + Zipkin integration for trace visualization

## Prerequisites

- .NET 10 SDK
- Docker (optional, for Zipkin)

## Quick Start

### 1. Set Environment Variables

The SDK uses simple environment variables matching the sidecar prototype:

```bash
export SERVICE_NAME=sample-service
export SIDECAR_HOST=localhost    # or container name in Docker
export SIDECAR_PORT=3001
export ZIPKIN_URL=http://localhost:9411
```

Or in docker-compose.yml:
```yaml
environment:
  - SERVICE_NAME=sample-service
  - SIDECAR_HOST=sample-service-sidecar
  - SIDECAR_PORT=7001
  - ZIPKIN_URL=http://zipkin:9411
```

### 2. Start Zipkin (Optional - for distributed tracing)

```bash
docker run -d -p 9411:9411 openzipkin/zipkin
```

View traces at: http://localhost:9411

### 3. Run the Sample Service

```bash
cd components/sdk/dotnet/examples/SampleService
dotnet run
```

The service will start on `http://localhost:5000`.

### 3. Verify Metadata Endpoint (Dev Only)

**Request:**
```bash
curl http://localhost:5000/_spas/metadata -o metadata.zip
```

**Response:**
- ZIP archive containing:
  - `spas.json` - Composed service metadata with discovered contracts
  - `schemas/create-order.schema.json` - CreateOrder command schema
  - `schemas/get-order.schema.json` - GetOrder query schema
  - `schemas/order-created.schema.json` - OrderCreated event schema

**Verify Contents:**
```bash
unzip -l metadata.zip
```

Expected output:
```
Archive:  metadata.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
     1234  2025-12-12 10:30   spas.json
      345  2025-12-12 10:30   schemas/create-order.schema.json
      256  2025-12-12 10:30   schemas/get-order.schema.json
      412  2025-12-12 10:30   schemas/order-created.schema.json
---------                     -------
     2247                     4 files
```

### 4. Test Command Endpoint (Create Order)

**Request:**
```bash
curl -X POST http://localhost:5000/commands/create-order \
  -H "Content-Type: application/json" \
  -H "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" \
  -H "x-correlation-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-user-id: user-123" \
  -H "x-tenant-id: tenant-abc" \
  -d '{"customerId": "CUST-001", "total": 99.99}'
```

**Response:**
```json
{
  "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "created"
}
```

**What Happens:**
1. Request is logged with trace context by `TracelogMiddleware`
2. Activity span created for distributed tracing
3. Order creation logic executes
4. `OrderCreated` event published to sidecar at `http://localhost:3001` with headers:
   - `traceparent`: W3C Trace Context (propagated from request)
   - `x-service-name`: `sample-service`
   - `x-event-type`: `com.sample-service.order.created`
   - `x-correlation-id`: `550e8400-e29b-41d4-a716-446655440000`
   - `x-user-id`: `user-123`
   - `x-tenant-id`: `tenant-abc`
5. Response sent to client
6. Request/response logged with timing and trace IDs

**Console Output:**
```
POST /commands/create-order | Status=200 | Latency=45ms | TraceId=0af7651916cd43dd8448eb211c80319c | CorrelationId=550e8400-e29b-41d4-a716-446655440000 | UserId=user-123 | TenantId=tenant-abc
```

### 5. Test Query Endpoint (Get Order)

**Request:**
```bash
curl http://localhost:5000/queries/get-order/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
```

**Response:**
```json
{
  "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "completed",
  "total": 99.99
}
```

### 6. Verify Zipkin Traces

1. Open http://localhost:9411
2. Click "Run Query" to see recent traces
3. Find the trace for your request (search by trace ID: `0af7651916cd43dd8448eb211c80319c`)
4. Inspect span details:
   - `http.method`: `POST`
   - `http.url`: `/commands/create-order`
   - `http.status_code`: `200`
   - `correlation.id`: `550e8400-e29b-41d4-a716-446655440000`
   - `user.id`: `user-123`
   - `tenant.id`: `tenant-abc`

## Key SDK Features Demonstrated

### 1. Metadata Auto-Discovery

Endpoints decorated with `SpasCommandAttribute` and `SpasQueryAttribute`:

```csharp
app.MapPost("/commands/create-order", handler)
    .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0") 
    { 
        Schema = "schemas/create-order.schema.json" 
    });
```

Events decorated with `SpasEventAttribute`:

```csharp
[SpasEvent("OrderCreated", "1.0", Schema = "schemas/order-created.schema.json")]
public record OrderCreatedEvent(...);
```

Auto-discovery enabled via:

```csharp
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
    options.AutoGenerateSchemaReferences = true;
});

// Later: discover all contracts
var contracts = app.DiscoverSpasMetadata();
```

### 2. Metadata Composition

```csharp
var identity = new ServiceIdentityBuilder()
    .WithName("sample-service")
    .WithVersion("1.0.0")
    .WithDescription("Sample SPAS service")
    .WithOwner("platform-team")
    .Build();

var composer = new SpasComposer();
composer.ComposeToFile("spas.json", identity, contracts, security, health);
```

### 3. Dev Metadata Endpoint

```csharp
builder.Services.AddMetadataEndpoint();

app.MapSpasMetadataEndpoint(
    metadataProvider: () => composer.Compose(...),
    schemasProvider: () => new Dictionary<string, object> { ... }
);
```

- **Enabled**: Development environment only
- **Disabled**: Production (returns 404 or safe message)
- **Response**: ZIP archive with `spas.json` + contract schemas

### 4. Event Publishing

```csharp
builder.Services.AddHttpClient<EventPublisher>(client =>
{
    client.BaseAddress = new Uri("http://localhost:3001"); // sidecar
})
.AddTypedClient((httpClient, sp) =>
    new EventPublisher(httpClient, "sample-service"));

// In endpoint handler:
await publisher.PublishAsync(
    topic: "orders",
    eventType: "com.sample-service.order.created",
    payload: new { orderId, customerId, total, createdAt }
);
```

**Headers sent to sidecar:**
- `traceparent`: W3C Trace Context
- `x-service-name`: `sample-service` → CloudEvents `source`
- `x-event-type`: `com.sample-service.order.created` → CloudEvents `type`
- `x-correlation-id`: Correlation ID → CloudEvents `correlationid` extension
- `x-user-id`: User identity (optional)
- `x-tenant-id`: Tenant identity (optional)

**Payload**: Raw JSON object (sidecar wraps in CloudEvents envelope)

### 5. Tracelog Middleware

```csharp
builder.Services.AddSpasTracing("sample-service", "http://localhost:9411/api/v2/spans");
app.UseSpasTracelog();
```

**Features:**
- Text logging to console/file with trace context
- Activity span creation for distributed tracing
- Span tags: `http.method`, `http.url`, `http.status_code`, `correlation.id`, `user.id`, `tenant.id`
- Error tracking with exception details
- Export to Zipkin via OpenTelemetry

**Log Format:**
```
<METHOD> <PATH> | Status=<CODE> | Latency=<MS>ms | TraceId=<ID> | CorrelationId=<ID> | UserId=<ID> | TenantId=<ID>
```

### 6. Identity Propagation

The SDK provides `SpasContext` for accessing identity from headers:

```csharp
// In endpoint handler:
var correlationId = SpasContext.CorrelationId;
var userId = SpasContext.UserId;
var tenantId = SpasContext.TenantId;
```

**Inbound Headers** (from sidecar):
- `traceparent`: W3C Trace Context
- `x-correlation-id`: Correlation ID
- `x-user-id`: User identity
- `x-tenant-id`: Tenant identity
- `x-event-type`: Event type (for event-driven invocations)

## Configuration

The SDK uses environment variables matching the SPAS sidecar prototype conventions:

### Environment Variables (Primary)

- `SERVICE_NAME`: Service identifier (default: "sample-service")
- `SIDECAR_HOST`: Sidecar hostname (e.g., "order-service-sidecar")
- `SIDECAR_PORT`: Sidecar port (e.g., 7001)
- `SIDECAR_URL`: Alternative single URL (e.g., "http://localhost:3001")
- `ZIPKIN_URL`: Zipkin endpoint (default: "http://localhost:9411")
- `PORT`: Service listening port (default: 5000)
- `ASPNETCORE_ENVIRONMENT`: Set to `Development` to enable `/_spas/metadata` endpoint

### appsettings.json (Alternative)

```json
{
  "SERVICE_NAME": "sample-service",
  "SIDECAR_URL": "http://localhost:3001",
  "ZIPKIN_URL": "http://localhost:9411"
}
```

### Docker Compose Example

```yaml
services:
  my-service:
    build: .
    environment:
      - SERVICE_NAME=my-service
      - SIDECAR_HOST=my-service-sidecar
      - SIDECAR_PORT=7001
      - ZIPKIN_URL=http://zipkin:9411
      - PORT=5001
```

**Note**: Environment variables take precedence over appsettings.json values.

## Testing Without Sidecar

The service will run without a sidecar, but event publishing will fail. To test without sidecar:

1. Catch and log event publishing exceptions (already done in sample)
2. Or mock the sidecar endpoint:

```bash
# Simple HTTP server that accepts POST and returns 202
python -m http.server 3001
```

## Production Considerations

- **Dev Endpoint**: Automatically disabled when `ASPNETCORE_ENVIRONMENT != Development`
- **Zipkin**: PoC only; Production should use full OpenTelemetry with Prometheus/Jaeger
- **Event Publishing**: Add retry logic and circuit breakers for production resilience
- **Identity**: PoC uses headers; Production should use mTLS + SPIFFE identities
- **Validation**: Add input validation and schema validation for commands/queries

## Troubleshooting

### Metadata endpoint returns 404

**Cause**: Running in Production mode  
**Fix**: Set `ASPNETCORE_ENVIRONMENT=Development`

### Event publishing fails

**Cause**: Sidecar not running at configured URL  
**Fix**: Start sidecar or update `Sidecar:Url` in appsettings.json

### No traces in Zipkin

**Cause**: Zipkin not running or wrong URL  
**Fix**: Start Zipkin with `docker run -d -p 9411:9411 openzipkin/zipkin` and verify `Zipkin:Url`

### Build warnings about OpenTelemetry.Api vulnerability

**Cause**: Known vulnerability in OpenTelemetry.Api 1.10.0 (NU1902)  
**Status**: Acknowledged - PoC scope; Production should upgrade to latest OpenTelemetry packages

## Next Steps

- Implement custom event types and handlers
- Add inbound middleware to extract headers and populate `SpasContext`
- Integrate with actual sidecar implementation
- Add schema validation for commands/queries
- Implement error handling and retry logic
- Add health checks and readiness probes
- Configure production-grade observability (Prometheus, Jaeger)
