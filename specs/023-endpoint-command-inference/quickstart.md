# Quickstart: SDK Simplification Migration Guide

**Feature**: 023-endpoint-command-inference  
**Date**: 2025-12-27

## Overview

This guide covers migrating existing SPAS .NET services to the simplified SDK that:
1. No longer requires `[SpasCommand]` attributes on DTOs
2. Exposes only the type-safe `PublishAsync<TEvent>()` method for event publishing

## Before You Start

**Prerequisite**: Update to SDK version X.Y.Z or later (version TBD after implementation).

## Migration Steps

### Step 1: Remove `[SpasCommand]` from DTO Classes

**Before**:
```csharp
using Spas.Sdk.Metadata.Attributes;

namespace OrderService.DTOs;

[SpasCommand("CreateOrder", "1.0", Description = "Payload for CreateOrder")]
public record CreateOrderRequest(string CustomerId, List<OrderItem> Items, decimal Total);
```

**After**:
```csharp
namespace OrderService.DTOs;

public record CreateOrderRequest(string CustomerId, List<OrderItem> Items, decimal Total);
```

**Action**: Remove the `[SpasCommand]` attribute and its using statement from all DTO classes.

**Note**: The endpoint handler still requires `[SpasCommand]`:
```csharp
app.MapPost("/orders",
    [SpasCommand("CreateOrder", "1.0", Description = "Creates a new order")]
    async (CreateOrderRequest request, ...) => { ... });
```

### Step 2: Verify Event Publishing Uses Generic Method

**Correct** (no change needed):
```csharp
await publisher.PublishAsync<OrderCreatedEvent>(payload: eventPayload);
```

**Incorrect** (will fail to compile after upgrade):
```csharp
// This method is now internal - will not compile
await publisher.PublishAsync("order-created", eventPayload);
```

**Action**: If you have any code using the explicit eventName overload, change it to use the generic method with the event type.

### Step 3: Regenerate Metadata

After removing DTO attributes, regenerate the metadata archive:

```bash
dotnet run -- --generate-metadata --output ./metadata
```

**Expected result**: Metadata generation succeeds with identical output.

### Step 4: Verify Schemas

Check that JSON schemas are still generated correctly:

```bash
ls ./metadata/schemas/endpoints/
# Should contain: create-order.schema.json, etc.
```

## Troubleshooting

### Compile Error: `[SpasCommand]` cannot be applied to class

**Cause**: The new SDK restricts `[SpasCommand]` to methods only.

**Fix**: Remove the attribute from the DTO class. The attribute is only needed on the endpoint handler.

### Compile Error: `PublishAsync(string, object)` is inaccessible

**Cause**: The explicit eventName overload is now internal.

**Fix**: Use the generic method instead:
```csharp
// Before
await publisher.PublishAsync("order-created", payload);

// After
await publisher.PublishAsync<OrderCreatedEvent>(payload);
```

### Schema Not Generated for DTO

**Cause**: The DTO is not used as a parameter in any endpoint with `[SpasCommand]`.

**Fix**: Ensure the endpoint handler accepts the DTO as a parameter:
```csharp
app.MapPost("/orders",
    [SpasCommand("CreateOrder", "1.0")]
    async (CreateOrderRequest request, ...) => { ... });
    //     ^^^^^^^^^^^^^^^^^^^ This type's schema will be generated
```

## Summary

| What Changed | Migration Action |
|--------------|------------------|
| `[SpasCommand]` no longer valid on classes | Remove from DTOs |
| `PublishAsync(string, object)` is internal | Use `PublishAsync<TEvent>()` |
| Schema inference from endpoint params | No action (automatic) |
