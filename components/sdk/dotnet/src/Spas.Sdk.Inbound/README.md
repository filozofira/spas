# Spas.Sdk.Inbound - Health Check Endpoints

This package provides standardized health check endpoints for SPAS services, implementing the required `/_spas/health/*` protocol.

## Overview

The Inbound package offers the `MapSpasHealthChecks()` extension method to register SPAS-compliant health check endpoints. These endpoints follow the SPAS health check protocol and return standardized JSON responses for liveness and readiness probes.

> Future standard inbound endpoints may be added to this package.

## Usage

Register health check endpoints in your ASP.NET Core application:

```csharp
using Spas.Sdk.Inbound.Extensions;

var app = builder.Build();

// Register SPAS health check endpoints
app.MapSpasHealthChecks();

app.Run();
```

## Endpoints

### Liveness Endpoint

**Path**: `/_spas/health/live`  
**Method**: GET  
**Purpose**: Indicates if the service is running  
**Response**:

```json
{
  "status": "UP"
}
```

### Readiness Endpoint

**Path**: `/_spas/health/ready`  
**Method**: GET  
**Purpose**: Indicates if the service is ready to accept traffic  
**Response**:

```json
{
  "status": "UP"
}
```

or

```json
{
  "status": "DOWN"
}
```

The readiness endpoint integrates with ASP.NET Core's health check system. Configure health checks using standard patterns:

```csharp
builder.Services.AddHealthChecks()
    .AddCheck("database", () => HealthCheckResult.Healthy());
```

## SPAS Health Check Protocol

These endpoints implement the SPAS health check protocol defined in the principles documentation:

- **Anonymous access**: Health checks don't require authentication
- **JSON format**: Responses use simple `{"status": "UP|DOWN"}` format
- **Standard paths**: All SPAS services expose health checks at `/_spas/health/live` and `/_spas/health/ready`

## Originally Planned Features (Deferred)

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
