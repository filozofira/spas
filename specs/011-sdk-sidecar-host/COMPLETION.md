# Completion: SDK Sidecar Host Convention

**Status**: ✅ COMPLETE  
**Completed**: 2025-01-20  
**Spec**: [spec.md](spec.md)

## Summary

Implemented convention-based sidecar host resolution for the .NET SDK. The SDK now automatically derives the sidecar hostname from `SERVICE_NAME` environment variable using the pattern `{service-name}-sidecar:7000`, eliminating the need for explicit sidecar configuration in containerized deployments.

## What Was Delivered

### User Story 1: Auto-Derived Sidecar Connection (P1 - MVP) ✅

- Automatic hostname derivation: `order-service` → `http://order-service-sidecar:7000`
- DNS-safe normalization (underscores → hyphens, lowercase)
- Works with Docker Compose networking out of the box

### User Story 2: Explicit Override (P2) ✅

- `SIDECAR_URL` takes full precedence (complete URL)
- `SIDECAR_HOST` + `SIDECAR_PORT` override derived values
- Backward compatible with existing deployments

### User Story 3: Local Development Fallback (P3) ✅

- Falls back to `http://localhost:7000` when no service name or config
- Handles empty/whitespace-only service names gracefully
- Default port aligned to 7000 (SPAS standard)

## Files Modified

### Production Code

| File | Changes |
|------|---------|
| [SpasConfiguration.cs](../../components/sdk/dotnet/src/Spas.Sdk.Core/Configuration/SpasConfiguration.cs) | Added `NormalizeForDns()` helper; modified `GetSpasSidecarUrl()` to accept optional `serviceName` parameter and implement resolution priority logic; fixed default port 3001 → 7000 |
| [SpasServiceExtensions.cs](../../components/sdk/dotnet/src/Spas.Sdk.Observability/Extensions/SpasServiceExtensions.cs) | Pass service name to `GetSpasSidecarUrl()`; added startup logging of resolved sidecar URL |

### Test Code

| File | Changes |
|------|---------|
| [SpasConfigurationTests.cs](../../components/sdk/dotnet/test/Spas.Sdk.Core.Tests/Configuration/SpasConfigurationTests.cs) | Added 14 unit tests covering all user stories, edge cases, and resolution priority |

### CLI Port Alignment

| File | Changes |
|------|---------|
| [types.ts](../../components/cli/spas-compose/src/types.ts) | Changed `sidecarPort` default from 7001 → 7000 |
| [docker-generator.test.ts](../../components/cli/spas-compose/test/unit/services/docker-generator.test.ts) | Updated port assertions 7001 → 7000 |

### Documentation

| File | Changes |
|------|---------|
| [README.md](../../components/sdk/dotnet/README.md) | Added "Sidecar URL Resolution" section documenting priority order |

## Test Results

### SDK Tests
```
Passed!  - Failed: 0, Passed: 125, Skipped: 0, Total: 125
```

### spas-compose Tests
```
Test Suites: 17 passed, 17 total
Tests:       169 passed, 169 total
```

## Functional Requirements Verification

| Requirement | Status | Verification |
|-------------|--------|--------------|
| FR-001: Derive sidecar host as `{SERVICE_NAME}-sidecar` | ✅ | `GetSpasSidecarUrl_WithServiceName_DerivesSidecarHost` test passes |
| FR-002: Use default port 7000 | ✅ | Default port constant changed to 7000 |
| FR-003: Explicit config overrides derived values | ✅ | `GetSpasSidecarUrl_WithSidecarHost_IgnoresServiceName` test passes |
| FR-004: SIDECAR_URL takes full precedence | ✅ | `GetSpasSidecarUrl_WithSidecarUrl_IgnoresDerivation` test passes |
| FR-005: Fall back to localhost when no SERVICE_NAME | ✅ | `GetSpasSidecarUrl_NoConfig_FallsBackToLocalhost7000` test passes |
| FR-006: Log resolved sidecar URL at startup | ✅ | Logging added in SpasServiceExtensions |
| FR-007: Normalize SERVICE_NAME for DNS compatibility | ✅ | `NormalizeForDns_*` tests pass |

## Configuration Priority (Implemented)

```
1. SIDECAR_URL (full URL)              → Use as-is
2. SIDECAR_HOST + SIDECAR_PORT         → Build URL from parts
3. SIDECAR_HOST + default port 7000    → Host with default port
4. SERVICE_NAME derivation + port 7000 → Convention-based
5. http://localhost:7000               → Local development fallback
```

## Implementation Notes

### DNS Normalization Logic

```csharp
private static string NormalizeForDns(string serviceName)
{
    if (string.IsNullOrWhiteSpace(serviceName))
        return string.Empty;
    
    // Replace underscores and spaces with hyphens, lowercase
    return serviceName
        .Replace('_', '-')
        .Replace(' ', '-')
        .ToLowerInvariant()
        .Trim('-');
}
```

### Edge Cases Handled

- Whitespace-only service names → Fall back to localhost
- Service names with underscores → Convert to hyphens
- Service names with spaces → Convert to hyphens  
- Mixed case service names → Normalize to lowercase
- Leading/trailing hyphens → Trim

### Port Alignment Fix

Discovered and fixed port mismatch between SDK (7000) and spas-compose CLI (7001). Both now use 7000 as the SPAS standard sidecar port. The port can be overridden via `SIDECAR_PORT` environment variable.

## Related Documents

- [Plan](plan.md) - Technical architecture
- [Research](research.md) - Design decisions
- [Tasks](tasks.md) - Implementation breakdown (19 tasks)
- [Quickstart](quickstart.md) - Developer guide
- [Data Model](data-model.md) - Configuration structure
