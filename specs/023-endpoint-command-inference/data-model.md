# Data Model: SDK Simplification for AI-Assisted Development

**Feature**: 023-endpoint-command-inference  
**Date**: 2025-12-27

## Overview

This feature modifies SDK internals; no new data entities are introduced. The changes affect how existing entities are processed.

## Entities

### EndpointInfo (Internal)

**Purpose**: Captures discovered endpoint metadata including inferred schema type.

**Location**: `Spas.Sdk.Metadata.Extensions.WebApplicationDiscoveryExtensions` (internal)

| Field | Type | Description |
|-------|------|-------------|
| Name | string | Command/query name (kebab-case) |
| Version | string | Semantic version |
| Type | EndpointType | Command or Query |
| Path | string | HTTP route path |
| SchemaRef | string | Path to JSON schema file |
| Description | string? | Optional description |
| **RequestBodyType** | Type? | **NEW**: Inferred parameter type for schema generation |

### SchemaGenerationRequest (New Internal)

**Purpose**: Request to generate a JSON schema from a type.

**Location**: `Spas.Sdk.Metadata.Schema.SchemaGenerator` (internal)

| Field | Type | Description |
|-------|------|-------------|
| Type | Type | .NET type to generate schema from |
| SchemaPath | string | Target path for the schema file |

## Relationships

```
┌─────────────────────┐
│ [SpasCommand]       │ ← Endpoint handler attribute
│ on endpoint method  │
└────────┬────────────┘
         │ ProcessEndpoint()
         ▼
┌─────────────────────┐
│ EndpointInfo        │
│ - Name, Version     │
│ - RequestBodyType ◄─┼─── Inferred from first complex parameter
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ SchemaGenerator     │
│ GenerateSchemaAsync │◄─── Called with RequestBodyType (no attribute needed)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ JSON Schema file    │
│ schemas/endpoints/  │
│ {command}.schema.json│
└─────────────────────┘
```

## State Transitions

N/A - No stateful entities. Schema generation is a pure transformation.

## Validation Rules

1. **RequestBodyType inference**:
   - MUST be a class or record type (not primitive)
   - MUST NOT be a framework type (HttpContext, CancellationToken, etc.)
   - MAY be null (endpoint with no body)

2. **Schema generation**:
   - Type MUST be serializable to JSON
   - Nested types MUST be included in schema

## Changes to Existing Entities

### SpasCommandAttribute

**Change**: Remove `AttributeTargets.Class | AttributeTargets.Struct` from `AttributeUsage`.

**Before**:
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Delegate | AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false)]
```

**After**:
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Delegate, AllowMultiple = false)]
```

**Impact**: Applying `[SpasCommand]` to a DTO class will produce a compile-time error. This is intentional to enforce endpoint-centric usage.

### SpasQueryAttribute

**Change**: Same as SpasCommandAttribute.

### EventPublisher.PublishAsync(string, object)

**Change**: Visibility from `public` to `internal`.

**Before**:
```csharp
public async Task PublishAsync(string eventName, object payload)
```

**After**:
```csharp
internal async Task PublishAsync(string eventName, object payload)
```

**Impact**: External code calling this overload will fail to compile. The generic `PublishAsync<TEvent>(object payload)` remains public.
