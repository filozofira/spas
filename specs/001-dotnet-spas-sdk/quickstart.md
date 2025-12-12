# Quickstart: .NET SPAS SDK (Phase 1)

- Place source under `components/sdk/dotnet`
- Create solution `Spas.Sdk.sln`; add projects:
  - Spas.Sdk.Core
  - Spas.Sdk.Metadata
  - Spas.Sdk.Events
  - Spas.Sdk.Inbound
  - Spas.Sdk.Configuration
  - Spas.Sdk.Observability
  - Spas.Sdk.Testing
- Implement SDK composition to generate `spas.json`
- Add dev endpoint `/_spas/metadata` (dev-only) returning archive with `spas.json` + schemas
- Use CloudEvents helpers to publish with trace/correlation
- Enable tracelog middleware for request timing and correlation IDs

## Publishing Events

The SDK sends event payloads to the sidecar via HTTP POST with metadata in headers:

```csharp
// Configure EventPublisher with sidecar endpoint
builder.Services.AddHttpClient<EventPublisher>(client =>
{
    client.BaseAddress = new Uri("http://localhost:3001"); // sidecar endpoint
});
builder.Services.AddSingleton(sp => 
{
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    return new EventPublisher(httpClientFactory.CreateClient(), "sample-service");
});

// Publish event with automatic trace/correlation propagation
await publisher.PublishAsync(
    topic: "orders",
    eventType: "com.example.order.created",
    payload: new { orderId = "ORDER-123", amount = 100.50 }
);
```

**Headers sent to sidecar:**
- `traceparent`: W3C Trace Context (e.g., `00-{trace-id}-{span-id}-{flags}`)
- `x-service-name`: Source service name → CloudEvents `source`
- `x-event-type`: Event type → CloudEvents `type`
- `x-correlation-id`: Correlation ID → CloudEvents `correlationid` extension
- `x-user-id`: Optional user identity from `SpasContext`
- `x-tenant-id`: Optional tenant identity from `SpasContext`

The sidecar wraps the raw payload in a CloudEvents 1.0 envelope using these headers.

## Handling Inbound Requests

When the sidecar invokes service endpoints, it propagates trace context via headers:

```csharp
// Middleware extracts headers and populates SpasContext
app.Use(async (context, next) =>
{
    // Extract traceparent header
    if (context.Request.Headers.TryGetValue("traceparent", out var traceParent))
    {
        SpasTrace.SetTraceParent(traceParent);
    }
    
    // Extract optional correlation and identity
    if (context.Request.Headers.TryGetValue("x-correlation-id", out var correlationId))
    {
        SpasContext.CorrelationId = correlationId;
    }
    
    if (context.Request.Headers.TryGetValue("x-user-id", out var userId))
    {
        SpasContext.UserId = userId;
    }
    
    if (context.Request.Headers.TryGetValue("x-tenant-id", out var tenantId))
    {
        SpasContext.TenantId = tenantId;
    }
    
    await next();
});
```

**Expected inbound headers from sidecar:**
- `traceparent`: W3C Trace Context (required for trace continuity)
- `x-event-type`: Event type from CloudEvents (required for event-driven invocations)
- `x-correlation-id`: Correlation ID from CloudEvents (required)
- `x-user-id`: User identity (optional)
- `x-tenant-id`: Tenant identity (optional)
