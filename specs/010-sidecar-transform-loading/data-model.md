# Data Model: Sidecar Transform File Loading

**Date**: 2025-12-16  
**Spec**: [spec.md](spec.md)  
**Status**: Complete

## Overview

This feature modifies the existing transformer service to support loading JSONata expressions from files. No new data entities are introduced; this documents the enhanced behavior of existing entities.

## Entities

### Transform Expression

A JSONata expression that transforms event payloads.

| Attribute | Type | Description |
|-----------|------|-------------|
| source | string | Either an inline expression or a file path ending in `.jsonata` |
| isFilePath | boolean (derived) | `true` if source ends with `.jsonata` |
| content | string (derived) | For file paths: loaded file content; for inline: same as source |
| compiled | jsonata.Expression | Cached compiled expression |

**Behavior**:
- If `source` ends with `.jsonata`: load file content, compile, cache
- Otherwise: treat `source` as inline expression, compile, cache

### Transform Cache

In-memory storage of compiled JSONata expressions.

| Attribute | Type | Description |
|-----------|------|-------------|
| entries | Map<string, jsonata.Expression> | Key: source (path or inline); Value: compiled expression |

**Invariants**:
- Each unique source string has at most one cached entry
- Cache persists for sidecar lifetime (no TTL)
- Cache can be cleared for testing via `clearTransformCache()`

### Inbound Entry (existing, unchanged schema)

Configuration for consuming events.

| Attribute | Type | Description |
|-----------|------|-------------|
| kind | 'command' \| 'event' | Entry type |
| topic | string? | Topic to subscribe to (for events) |
| command | string? | Command name (for commands) |
| transform | string? | JSONata expression OR `.jsonata` file path |
| invokeEndpoint | string | Service endpoint to invoke |

### Outbound Entry (existing, unchanged schema)

Configuration for publishing events.

| Attribute | Type | Description |
|-----------|------|-------------|
| eventType | string | Event type from header |
| topic | string | Target Redis stream topic |
| transform | string? | JSONata expression OR `.jsonata` file path |

## State Transitions

### Transform Loading Flow

```
┌─────────────────┐
│ transform value │
│   (string)      │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │ Check cache │
    └─────┬──────┘
          │
    ┌─────┴─────┐
    │ In cache? │
    └─────┬─────┘
          │
     Yes  │  No
     ▼    │
┌─────────┴─────────┐
│ Return cached     │
│ expression        │
└───────────────────┘
          │ No
          ▼
    ┌────────────────┐
    │ ends with      │
    │ .jsonata?      │
    └───────┬────────┘
            │
      Yes   │   No
       ▼    │    ▼
┌───────────┴────────────┐
│ Load file content      │ Use source as expression
│ (readFileSync)         │
└───────────┬────────────┘
            │
            ▼
    ┌────────────────┐
    │ Compile with   │
    │ jsonata()      │
    └───────┬────────┘
            │
     ┌──────┴──────┐
     │ Parse error?│
     └──────┬──────┘
            │
      No    │   Yes
       ▼    │    ▼
┌───────────┴────────────┐
│ Cache & return         │ Throw error with file
│ expression             │ path and parse message
└────────────────────────┘
```

## Error States

| Error Type | Trigger | Response |
|------------|---------|----------|
| File not found | `readFileSync` throws ENOENT | `Transform file not found: {path}` |
| Read error | `readFileSync` throws other | `Failed to read transform file {path}: {message}` |
| Parse error | `jsonata()` throws | `Invalid JSONata in {path}: {message}` |
| Evaluation error | `expression.evaluate()` throws | `Transform failed: {message}` |

## Validation Rules

1. **File path format**: Must end with `.jsonata` to be treated as file
2. **File encoding**: Must be valid UTF-8
3. **JSONata syntax**: Must be valid JSONata expression
4. **File access**: Sidecar must have read permission

## Relationships

```
┌─────────────────┐     uses      ┌─────────────────┐
│ EventSubscriber │──────────────▶│   Transformer   │
└─────────────────┘               └────────┬────────┘
                                           │
┌─────────────────┐     uses               │ maintains
│  EventPublisher │──────────────▶         ▼
└─────────────────┘               ┌─────────────────┐
                                  │ Transform Cache │
┌─────────────────┐     uses      └─────────────────┘
│ CommandInvoker  │──────────────▶         ▲
└─────────────────┘                        │
                                           │
                                  ┌────────┴────────┐
                                  │ File System     │
                                  │ (for .jsonata)  │
                                  └─────────────────┘
```
