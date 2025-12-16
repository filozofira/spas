# Data Model: SDK Sidecar Host Convention

**Feature**: 011-sdk-sidecar-host  
**Date**: 2025-12-16

## Overview

This feature modifies configuration resolution logic only. No new data entities are introduced.

## Configuration Resolution Model

### Input Variables (Environment)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `SIDECAR_URL` | string | No | Full sidecar URL (e.g., `http://custom:8080`) |
| `SIDECAR_HOST` | string | No | Sidecar hostname (e.g., `order-service-sidecar`) |
| `SIDECAR_PORT` | int | No | Sidecar port (default: 7000) |
| `SERVICE_NAME` | string | No | Service name for derivation |

### Resolution Priority

```
┌─────────────────────────────────────────────────────────────┐
│                    Sidecar URL Resolution                    │
├─────────────────────────────────────────────────────────────┤
│  Priority 1: SIDECAR_URL (explicit full URL)                │
│      ↓ (if not set)                                         │
│  Priority 2: SIDECAR_HOST + SIDECAR_PORT                    │
│      ↓ (if SIDECAR_HOST not set)                            │
│  Priority 3: SERVICE_NAME → {name}-sidecar:7000             │
│      ↓ (if SERVICE_NAME not set)                            │
│  Priority 4: http://localhost:7000 (fallback)               │
└─────────────────────────────────────────────────────────────┘
```

### DNS Normalization Rules

When deriving hostname from SERVICE_NAME:

1. Convert to lowercase
2. Replace underscores (`_`) with hyphens (`-`)
3. Replace spaces (` `) with hyphens (`-`)
4. Remove any characters not alphanumeric or hyphen
5. Trim leading/trailing hyphens

**Examples**:

| SERVICE_NAME | Normalized | Sidecar Host |
|--------------|------------|--------------|
| `order-service` | `order-service` | `order-service-sidecar` |
| `Order_Service` | `order-service` | `order-service-sidecar` |
| `My Service` | `my-service` | `my-service-sidecar` |
| `API` | `api` | `api-sidecar` |

## Output

| Output | Format | Example |
|--------|--------|---------|
| Sidecar URL | `http://{host}:{port}` | `http://order-service-sidecar:7000` |

## Method Signature Change

### Before

```csharp
public static string GetSpasSidecarUrl(this IConfiguration configuration)
```

### After

```csharp
public static string GetSpasSidecarUrl(
    this IConfiguration configuration, 
    string? serviceName = null)
```

The optional `serviceName` parameter enables derivation without re-reading from configuration.
