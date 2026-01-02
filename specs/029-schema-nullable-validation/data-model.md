# Data Model: Schema Nullable Handling and Transformation Validation

**Feature**: 029-schema-nullable-validation  
**Date**: 2026-01-02

## Overview

This feature modifies schema output format rather than introducing new data entities. The primary "data model" is the JSON Schema output structure that must conform to draft-07 with correct `required` and nullable type handling.

## JSON Schema Output Structure

### Properties Object

Each property in the generated schema will have type information:

**Non-nullable property**:
```json
{
  "orderId": {
    "type": "string"
  }
}
```

**Nullable property**:
```json
{
  "notes": {
    "type": ["null", "string"]
  }
}
```

### Required Array

The `required` array at the schema root (and in nested objects) lists all non-nullable property names:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "orderId": { "type": "string" },
    "customerId": { "type": "string" },
    "notes": { "type": ["null", "string"] }
  },
  "required": ["orderId", "customerId"]
}
```

### Nested Objects

Nested objects maintain their own `required` arrays:

```json
{
  "properties": {
    "shippingAddress": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "apartment": { "type": ["null", "string"] }
      },
      "required": ["street", "city"]
    }
  }
}
```

## Nullability Detection Rules

### .NET SDK

| Type Declaration | Nullable? | In Required Array? |
|-----------------|-----------|-------------------|
| `string OrderId` | No | Yes |
| `string? Notes` | Yes | No |
| `int Quantity` | No | Yes |
| `int? Priority` | Yes | No |
| `Address Shipping` (non-null ref) | No | Yes |
| `Address? Billing` (nullable ref) | Yes | No |

### Java SDK

| Field Declaration | Nullable? | In Required Array? |
|------------------|-----------|-------------------|
| `String orderId` | No (default) | Yes |
| `@Nullable String notes` | Yes | No |
| `int quantity` | No (primitive) | Yes |
| `Integer priority` (no annotation) | No (default) | Yes |
| `@Nullable Integer priority` | Yes | No |
| `Address shipping` | No (default) | Yes |
| `@Nullable Address billing` | Yes | No |

## Validation Rules

### Schema Output Validation

1. `required` array MUST only contain property names that exist in `properties`
2. `required` array MUST use camelCase names matching `properties` keys
3. Properties in `required` MUST NOT have `["null", ...]` type
4. Properties with `["null", ...]` type MUST NOT be in `required`
5. Nested objects with properties MUST have their own `required` array

### Transformation Validation (Agent)

1. Agent MUST read target schema's `required` array
2. For each transformation file, agent MUST verify all required fields are mapped
3. Missing required fields MUST be reported with specific field names
4. Validation MUST occur in Phase 4 before proceeding to Phase 5

## State Transitions

N/A - This feature modifies output format, not stateful entities.

## Entity Relationships

```
┌─────────────────────┐
│   Source Type       │
│  (.NET class or     │
│   Java class)       │
└─────────┬───────────┘
          │ generates
          ▼
┌─────────────────────┐
│   JSON Schema       │
│  - properties       │
│  - required[]       │
│  - $schema          │
└─────────┬───────────┘
          │ consumed by
          ▼
┌─────────────────────┐
│   Agent Prompt      │
│  (Phase 4 Validate) │
│  - reads required[] │
│  - checks transform │
└─────────────────────┘
```
