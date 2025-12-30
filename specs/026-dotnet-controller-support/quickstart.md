# Quickstart: .NET SDK Controller Metadata Support

**Feature**: 026-dotnet-controller-support  
**Audience**: .NET developers using SPAS SDK  
**Date**: 2025-12-30

## Overview

The .NET SDK now supports both **Minimal APIs** and **ASP.NET Core MVC Controllers** for metadata generation. You can use either pattern, or mix both in the same service.

---

## Using Controllers with SPAS

### Basic Controller Example

```csharp
using Microsoft.AspNetCore.Mvc;
using Spas.Sdk.Metadata.Attributes;

[Route("api/orders")]
[ApiController]
public class OrdersController : ControllerBase
{
    [HttpPost]
    [SpasCommand("CreateOrder", "1.0", 
        Description = "Creates a new order",
        Produces = new[] { typeof(OrderCreatedEvent) })]
    public ActionResult<OrderResponse> CreateOrder([FromBody] CreateOrderRequest request)
    {
        // Your logic here
        var orderId = Guid.NewGuid();
        
        // Publish event (same as Minimal API)
        await _eventPublisher.PublishAsync(new OrderCreatedEvent(orderId, request.CustomerId));
        
        return Ok(new OrderResponse(orderId, "Pending"));
    }
    
    [HttpGet("{id}")]
    [SpasQuery("GetOrder", "1.0", 
        Description = "Retrieves an order by ID")]
    public ActionResult<OrderResponse> GetOrder(string id)
    {
        // Your logic here
        return Ok(new OrderResponse(id, "Completed"));
    }
}
```

### Request/Response DTOs (No Attributes Needed)

```csharp
// Plain DTOs - schemas inferred automatically
public record CreateOrderRequest(string CustomerId, decimal Total);
public record OrderResponse(string OrderId, string Status);

// Event type - same as Minimal API
[SpasEvent("OrderCreated", "1.0", 
    EventType = "com.example-service.order.created",
    Description = "Published when a new order is created")]
public record OrderCreatedEvent(string OrderId, string CustomerId);
```

---

## Setting Up Your Service

### Program.cs Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add Controllers support
builder.Services.AddControllers();

// Add SPAS services (same as before)
builder.Services.AddSpasServices();

var app = builder.Build();

// Map Controllers
app.MapControllers();

// Generate metadata or run normally
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "abc123";
    options.ServiceName = "order-service";
    options.Version = "1.0.0";
    options.BoundedContext = "orders";
    
    options.AddCapability("create-order");
    options.AddCapability("query-order");
});
```

### Generate Metadata

```bash
dotnet run -- --generate-metadata --output ./metadata
```

Result: `metadata/service.metadata.zip` containing controller endpoints.

---

## Mixed Pattern: Minimal API + Controllers

You can use both patterns in the same service:

```csharp
var app = builder.Build();

// Minimal API endpoints
app.MapPost("/api/products", 
    [SpasCommand("CreateProduct", "1.0")] 
    (CreateProductRequest request) => 
    {
        // Logic here
        return Results.Ok(new ProductResponse(Guid.NewGuid()));
    });

// Controller endpoints (mapped via AddControllers/MapControllers)
app.MapControllers();

await app.RunSpasServiceAsync(args, options => { /* ... */ });
```

**Both sets of endpoints** will be discovered and included in the metadata.

---

## Route Resolution

### Class + Method Level Routes

```csharp
[Route("api/[controller]")]  // Resolves to "api/orders"
public class OrdersController : ControllerBase
{
    [HttpGet]                   // → /api/orders
    [HttpGet("{id}")]          // → /api/orders/{id}
    [HttpPost("batch")]        // → /api/orders/batch
}
```

### Route Parameters

```csharp
[HttpGet("{id}")]                    // Required parameter
[HttpGet("{id?}")]                   // Optional parameter
[HttpGet("{id:int}")]                // Constrained parameter
[HttpGet("{category}/{id}")]         // Multiple parameters
[HttpGet("{*path}")]                 // Catch-all parameter
```

All route patterns are preserved in the generated metadata.

---

## Schema Inference

### Request Schemas (FROM Body Parameters)

```csharp
// Explicit [FromBody]
[HttpPost]
public IActionResult Create([FromBody] CreateOrderRequest request)
    // ✅ Schema inferred from CreateOrderRequest

// First complex parameter (no [FromBody] needed)
[HttpPost]
public IActionResult Create(CreateOrderRequest request)
    // ✅ Schema inferred from CreateOrderRequest

// No complex parameter
[HttpPost]
public IActionResult DoSomething()
    // ℹ️ No request schema generated
```

### Response Schemas (Return Types)

```csharp
// Direct return type
public OrderResponse GetOrder(string id)
    // ✅ Schema: OrderResponse

// ActionResult<T>
public ActionResult<OrderResponse> GetOrder(string id)
    // ✅ Schema: OrderResponse (unwrapped)

// Task<ActionResult<T>>
public async Task<ActionResult<OrderResponse>> GetOrder(string id)
    // ✅ Schema: OrderResponse (unwrapped)

// IActionResult (no generic type)
public IActionResult GetOrder(string id)
    // ℹ️ No response schema (unknown type)
```

### Custom Schema Paths

```csharp
[SpasCommand("CreateOrder", "1.0", 
    Schema = "schemas/custom/order-request.schema.json")]
public IActionResult Create([FromBody] CreateOrderRequest request)
    // Uses custom schema path instead of auto-generated
```

---

## Event Production

```csharp
[HttpPost]
[SpasCommand("CreateOrder", "1.0", 
    Produces = new[] { typeof(OrderCreatedEvent) })]
public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
{
    // Your logic
    
    // Publish event (same as Minimal API)
    await _eventPublisher.PublishAsync(new OrderCreatedEvent(orderId, customerId));
    
    return Ok();
}
```

Event references appear in command contract:

```json
{
  "name": "create-order",
  "type": "command",
  "version": "1.0",
  "produces": [
    {
      "type": "order-created",
      "version": "1.0"
    }
  ]
}
```

---

## Migration from Minimal API to Controllers

### Before (Minimal API)

```csharp
app.MapPost("/api/orders", 
    [SpasCommand("CreateOrder", "1.0")] 
    async (CreateOrderRequest request, IEventPublisher eventPublisher) => 
    {
        var orderId = Guid.NewGuid();
        await eventPublisher.PublishAsync(new OrderCreatedEvent(orderId));
        return Results.Ok(new OrderResponse(orderId));
    });
```

### After (Controller)

```csharp
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IEventPublisher _eventPublisher;
    
    public OrdersController(IEventPublisher eventPublisher)
    {
        _eventPublisher = eventPublisher;
    }
    
    [HttpPost]
    [SpasCommand("CreateOrder", "1.0")]
    public async Task<ActionResult<OrderResponse>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var orderId = Guid.NewGuid();
        await _eventPublisher.PublishAsync(new OrderCreatedEvent(orderId));
        return Ok(new OrderResponse(orderId));
    }
}
```

**Metadata Generated**: Identical structure, only route path differs if changed.

---

## Common Patterns

### Dependency Injection

```csharp
public class OrdersController : ControllerBase
{
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<OrdersController> _logger;
    
    public OrdersController(
        IEventPublisher eventPublisher,
        ILogger<OrdersController> logger)
    {
        _eventPublisher = eventPublisher;
        _logger = logger;
    }
}
```

### Validation

```csharp
[HttpPost]
[SpasCommand("CreateOrder", "1.0")]
public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    
    // Process valid request
}
```

### Multiple Commands in One Controller

```csharp
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    [HttpPost]
    [SpasCommand("CreateOrder", "1.0")]
    public IActionResult Create([FromBody] CreateOrderRequest request) { }
    
    [HttpPut("{id}/cancel")]
    [SpasCommand("CancelOrder", "1.0")]
    public IActionResult Cancel(string id) { }
    
    [HttpPost("{id}/approve")]
    [SpasCommand("ApproveOrder", "1.0")]
    public IActionResult Approve(string id) { }
}
```

---

## Common Gotchas

### 1. Missing AddControllers()

**Problem**: Controller actions not discovered.

**Solution**: Ensure `builder.Services.AddControllers()` is called in `Program.cs`.

### 2. Convention Routing Not Supported

**Problem**: Controllers using convention routing (no `[Route]` attributes) are skipped.

**Solution**: Use attribute routing:
```csharp
[Route("api/[controller]")]
public class OrdersController : ControllerBase { }
```

### 3. Duplicate Endpoint Names

**Problem**: Metadata generation fails with duplicate name error.

**Solution**: Ensure each `[SpasCommand]`/`[SpasQuery]` name is unique across the service:
```csharp
// ❌ Bad - duplicate name
[SpasCommand("CreateOrder", "1.0")] 
app.MapPost("/api/orders", ...);

[SpasCommand("CreateOrder", "1.0")]  // Same name!
public IActionResult CreateOrder() { }

// ✅ Good - unique names
[SpasCommand("CreateOrder", "1.0")]
[SpasCommand("CreateBulkOrder", "1.0")]
```

### 4. IActionResult Without Generic Type

**Problem**: Response schema not generated.

**Solution**: Use `ActionResult<T>` instead:
```csharp
// ❌ No schema
public IActionResult GetOrder(string id)

// ✅ Schema inferred from OrderResponse
public ActionResult<OrderResponse> GetOrder(string id)
```

### 5. Missing [FromBody] Attribute

**Problem**: Request schema not generated for parameters.

**Solution**: Add `[FromBody]` or ensure parameter is first complex type:
```csharp
// ✅ Explicit [FromBody]
public IActionResult Create([FromBody] CreateOrderRequest request)

// ✅ First complex parameter inferred
public IActionResult Create(CreateOrderRequest request)
```

---

## Next Steps

1. **Add Controllers** to your service (or keep using Minimal APIs)
2. **Annotate actions** with `[SpasCommand]` or `[SpasQuery]`
3. **Generate metadata**: `dotnet run -- --generate-metadata --output ./metadata`
4. **Publish to repository**: `spas-service publish --archive metadata/service.metadata.zip`

For more details, see:
- [SDK README](../../../components/sdk/dotnet/README.md)
- [Feature Specification](spec.md)
- [Implementation Plan](plan.md)
