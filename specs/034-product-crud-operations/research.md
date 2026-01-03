# Research: Product CRUD Operations with Event Emission

**Feature**: 033-product-crud-operations  
**Date**: 2026-01-03  
**Purpose**: Document technology decisions and patterns for implementing CRUD operations with event emission

## Overview

All technical decisions were resolved during the clarification phase. This document consolidates the findings for implementation reference.

## Key Decisions

### 1. Storage Strategy

**Decision**: In-memory storage using ConcurrentDictionary

**Rationale**:
- Example service demonstrates SPAS patterns without infrastructure complexity
- Existing ProductCatalog already uses ConcurrentDictionary
- Thread-safe for concurrent access
- Simple, stateless operation suitable for demos

**Alternatives Considered**:
- External database (PostgreSQL, SQL Server): Rejected - adds unnecessary complexity for example service
- File-based persistence: Rejected - stateless operation more appropriate for containerized examples

### 2. Concurrency Control

**Decision**: No concurrency control mechanisms (last-write-wins)

**Rationale**:
- Example service - demonstrates patterns, not production-grade conflict resolution
- Simplifies implementation
- Appropriate for single-instance demo deployments

**Alternatives Considered**:
- Optimistic locking (ETags): Rejected - unnecessary complexity for example
- Pessimistic locking: Rejected - not suitable for stateless example service

### 3. Event Delivery Guarantees

**Decision**: Best-effort delivery (operation succeeds, event failures logged)

**Rationale**:
- Aligns with other example services in SPAS repository
- Demonstrates event emission pattern without complex retry logic
- PoC mode - focuses on architectural patterns
- Event failures don't block catalog operations

**Alternatives Considered**:
- Transactional (rollback on event failure): Rejected - requires distributed transactions, inappropriate for example
- Async retry with queue: Rejected - adds infrastructure complexity

### 4. Update Semantics

**Decision**: Partial updates (PATCH semantics) - only changed fields provided

**Rationale**:
- More flexible for catalog managers (update just price without resending all fields)
- Modern REST API pattern
- Reduces payload size
- Better user experience

**Alternatives Considered**:
- Full replacement (PUT): Rejected - less flexible, requires clients to retrieve-then-update
- Both PUT and PATCH: Rejected - unnecessary for example service scope

### 5. Validation Constraints

**Decision**: 
- Product ID: lowercase alphanumeric with hyphens, 1-50 chars (pattern: `^[a-z0-9-]+$`)
- Name: max 200 characters, required
- Description: max 2000 characters, required
- Category: required (no length limit specified)
- Price: non-negative decimal, required

**Rationale**:
- Balances flexibility with reasonable limits
- ID format prevents confusion (all lowercase, simple validation)
- Name limit suitable for product titles
- Description limit allows detailed information without excessive data
- Price validation prevents data errors

**Alternatives Considered**:
- No length limits: Rejected - allows unreasonable data sizes
- Stricter ID format (UUID only): Rejected - reduces flexibility for human-readable IDs
- Optional fields: Rejected - all fields essential for product catalog

## SPAS SDK Patterns

### Event Publishing

The SPAS .NET SDK provides event publishing through the `EventPublisher` class:

**Pattern**:
```csharp
// Event model with attribute
[SpasEvent("product-added", "1.0", Description = "Published when a new product is added")]
public record ProductAdded(string ProductId, string Name, string Category, decimal Price, string Description);

// Publishing
await _eventPublisher.PublishAsync<ProductAdded>(new ProductAdded(...));
```

**SDK Behavior**:
- Sends HTTP request to sidecar `/events/publish` endpoint
- Headers: traceparent, x-service-name, x-event-name, x-correlation-id, x-user-id (if present), x-tenant-id (if present)
- Body: Raw JSON payload
- Sidecar wraps in CloudEvents 1.0 format (type: `com.product-service.product-added`)
- Sidecar routes to configured topics based on event name

**Best Practices**:
- Always use `[SpasEvent]` attribute for metadata generation
- Use record types for immutable events
- Include all relevant context in event payload (full product data for traceability)
- Don't catch exceptions - let SDK propagate errors for logging at caller level

### Metadata Generation

Commands, queries, and events must be decorated for metadata extraction:

**Pattern**:
```csharp
[HttpPost]
[SpasCommand("AddProduct", "1.0", Description = "Adds a new product to the catalog")]
public ActionResult<Product> AddProduct([FromBody] AddProductRequest request) { ... }

[HttpPatch("{id}")]
[SpasCommand("UpdateProduct", "1.0", Description = "Updates an existing product")]
public ActionResult<Product> UpdateProduct(string id, [FromBody] UpdateProductRequest request) { ... }

[HttpDelete("{id}")]
[SpasCommand("RemoveProduct", "1.0", Description = "Removes a product from the catalog")]
public IActionResult RemoveProduct(string id) { ... }
```

**Regeneration**:
After adding new operations, regenerate metadata using SPAS tooling:
```bash
spas-service metadata extract --project ./ProductService.csproj --output ./metadata/
```

### Validation Approach

Use ASP.NET Core built-in validation with custom validators:

**Pattern**:
```csharp
public class AddProductRequest
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "ProductId must contain only lowercase letters, numbers, and hyphens")]
    public string ProductId { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    // ... other fields
}
```

**Error Handling**:
- ModelState validation automatic via `[ApiController]`
- Returns 400 BadRequest with validation details
- Custom validators for business rules (uniqueness, business constraints)

## Event Schemas

### ProductAdded Event

Emitted when a new product is successfully added to the catalog.

**Payload**:
```json
{
  "productId": "laptop-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1299.99,
  "description": "High-performance laptop with 15-inch display"
}
```

**CloudEvents Type** (constructed by sidecar): `com.product-service.product-added`

### ProductUpdated Event

Emitted when an existing product is successfully updated. Includes change tracking.

**Payload**:
```json
{
  "productId": "laptop-001",
  "changes": {
    "price": {
      "oldValue": 1299.99,
      "newValue": 1199.99
    },
    "description": {
      "oldValue": "High-performance laptop with 15-inch display",
      "newValue": "High-performance laptop with 15-inch 4K display"
    }
  }
}
```

**CloudEvents Type**: `com.product-service.product-updated`

**Notes**:
- Only changed fields included in `changes` object
- Useful for event consumers to track what changed without comparing full objects
- Enables efficient downstream updates

### ProductRemoved Event

Emitted when a product is successfully removed from the catalog.

**Payload**:
```json
{
  "productId": "laptop-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1199.99,
  "description": "High-performance laptop with 15-inch 4K display"
}
```

**CloudEvents Type**: `com.product-service.product-removed`

**Notes**:
- Contains full product data at time of removal
- Enables event sourcing and audit trails
- Consumers can know exactly what was removed without additional queries

## REST API Design

### Endpoint Patterns

Follow REST conventions with SPAS command/query attributes:

| Method | Path | Purpose | Success | Error Codes |
|--------|------|---------|---------|-------------|
| POST | /products | Add new product | 201 Created | 400 (validation), 409 (duplicate ID) |
| PATCH | /products/{id} | Partial update | 200 OK | 400 (validation), 404 (not found) |
| DELETE | /products/{id} | Remove product | 204 No Content | 404 (not found) |
| GET | /products | List products | 200 OK | - |
| GET | /products/{id} | Get product | 200 OK | 404 (not found) |

### Request/Response Examples

**Add Product** (POST /products):
```json
// Request
{
  "productId": "laptop-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1299.99,
  "description": "High-performance laptop"
}

// Response 201 Created
{
  "productId": "laptop-001",
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "price": 1299.99,
  "description": "High-performance laptop"
}
```

**Update Product** (PATCH /products/laptop-001):
```json
// Request (partial)
{
  "price": 1199.99,
  "description": "High-performance laptop with 4K display"
}

// Response 200 OK
{
  "productId": "laptop-001",
  "name": "Laptop Pro 15",  // unchanged
  "category": "Electronics",  // unchanged
  "price": 1199.99,  // updated
  "description": "High-performance laptop with 4K display"  // updated
}
```

**Remove Product** (DELETE /products/laptop-001):
```
// Request: No body
// Response: 204 No Content
```

## Implementation Notes

### Error Handling

Best-effort event publishing means:
1. Execute catalog operation (add/update/remove)
2. Attempt to publish event
3. If event publish fails:
   - Log error with details (event name, product ID, exception)
   - Continue (don't rollback catalog operation)
   - Return success to client

**Rationale**: Event failures shouldn't block user operations in PoC/example service. Production systems would use outbox pattern or similar.

### Thread Safety

ConcurrentDictionary provides thread-safe operations:
- `TryAdd()` for atomic insert with existence check
- `TryGetValue()` for safe reads
- `AddOrUpdate()` for atomic updates
- `TryRemove()` for atomic deletes

No additional locking required for in-memory operations.

### Testing Strategy

**Unit Tests**:
- ProductCatalog: Test business logic (add, update, remove, get, list)
- Validators: Test validation rules (format, length, required fields)
- Controller: Test endpoint logic, status codes, error handling

**Event Tests**:
- Mock EventPublisher to verify events emitted with correct data
- Verify event attributes present for metadata generation
- Test best-effort behavior (operation succeeds even if event fails)

**Integration Tests** (optional for example):
- End-to-end flow with real HTTP requests
- Verify metadata generation includes new operations
- Test with sidecar to verify CloudEvents format

## References

- [SPAS .NET SDK Events](../../../../components/sdk/dotnet/src/Spas.Sdk.Events/)
- [SPAS .NET SDK Metadata Attributes](../../../../components/sdk/dotnet/src/Spas.Sdk.Metadata/)
- [Existing ProductService](../../../../examples/services/product-service/)
- [SPAS Constitution](../../../../.specify/memory/constitution.md)
