# Spas.Sdk.Inbound - DEFERRED

## Status: Not Implemented (Intentional)

This package was created as part of the initial SDK structure but **implementation has been deferred**.

## Decision

**Date**: 2025-12-12  
**Rationale**: Keep SDK simple for PoC; use native ASP.NET Core minimal APIs for inbound handlers

### Current Approach

Services use native ASP.NET Core minimal APIs with SPAS attributes for metadata discovery:

```csharp
app.MapPost("/commands/create-order", async (CreateOrderRequest request) => 
{
    // Handler logic using SpasContext for identity/correlation
    var correlationId = SpasContext.CorrelationId;
    // ...
})
.WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0") 
{ 
    Schema = "schemas/create-order.schema.json" 
});
```

**Benefits**:
- No learning curve - developers use familiar ASP.NET Core patterns
- No abstractions to maintain - SDK stays lightweight
- Flexibility - services can use any routing/middleware approach

**Trade-offs**:
- No built-in handler base classes (e.g., `SpasCommandHandler`, `SpasQueryHandler`)
- No automatic model binding or validation helpers
- Each service implements handlers independently

## Originally Planned Features (from plan.md)

If this package is implemented in the future, it should provide:

1. **Handler Base Classes**
   - `SpasCommandHandler<TRequest, TResponse>`
   - `SpasQueryHandler<TRequest, TResponse>`
   - `SpasEventHandler<TEvent>`

2. **Automatic Context Binding**
   - Inject `SpasContext` automatically
   - Extract trace/correlation/identity from headers

3. **Model Binding Helpers**
   - Validate requests against contract schemas
   - Automatic deserialization with error handling

4. **Registration Helpers**
   - Scan assemblies for handlers
   - Auto-register routes based on attributes

5. **Dev-Mode Scaffolding**
   - Generate handler templates from contracts
   - Interactive handler testing UI

## When to Reconsider

Implement this package if:

1. **Multiple services** need consistent handler patterns → Abstractions reduce duplication
2. **Complex validation** requirements emerge → Built-in schema validation helps
3. **gRPC migration** planned → Abstract handlers ease transport transition
4. **Team requests** ergonomic handler APIs → Developer experience improvement

## Implementation Path

If you decide to implement this package later:

1. Review [plan.md](../../../../../specs/001-dotnet-spas-sdk/plan.md) "Inbound Package Responsibilities"
2. Create User Story 5 in [spec.md](../../../../../specs/001-dotnet-spas-sdk/spec.md)
3. Add implementation tasks to [tasks.md](../../../../../specs/001-dotnet-spas-sdk/tasks.md)
4. Reference [SampleService](../../examples/SampleService/Program.cs) for current patterns to abstract

## Related

- **Current Pattern**: See [SampleService/Program.cs](../../examples/SampleService/Program.cs)
- **Context Access**: Use `SpasContext` from `Spas.Sdk.Core`
- **Metadata Discovery**: Use attributes from `Spas.Sdk.Metadata`
