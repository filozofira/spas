# Contracts: SDK Sidecar Host Convention

**Feature**: 011-sdk-sidecar-host

## No New Contracts

This feature modifies internal SDK behavior (configuration resolution) and does not introduce new API contracts.

## Existing Contracts Unchanged

The SDK's existing public API surface remains unchanged:

| Method | Signature | Status |
|--------|-----------|--------|
| `GetSpasSidecarUrl` | `IConfiguration.GetSpasSidecarUrl(string? serviceName = null)` | **Modified** - added optional parameter |
| `AddSpasClient` | `IServiceCollection.AddSpasClient(...)` | Unchanged |

## Environment Variable Contract

The feature uses existing environment variables with this precedence:

| Variable | Required | Description |
|----------|----------|-------------|
| `SIDECAR_URL` | No | Full URL to sidecar (highest priority) |
| `SIDECAR_HOST` | No | Sidecar hostname |
| `SIDECAR_PORT` | No | Sidecar port (default: 7000) |
| `SERVICE_NAME` | No | Service name for derivation |

## Naming Convention Contract

When deriving from `SERVICE_NAME`:

```
Sidecar Host = {normalized-service-name}-sidecar
Default Port = 7000
```

Normalization:
- Lowercase
- Underscores → hyphens
- Strip invalid DNS characters

## Backward Compatibility

All existing configurations continue to work. Explicit `SIDECAR_HOST` takes precedence over derived values.
