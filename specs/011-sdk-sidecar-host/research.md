# Research: SDK Sidecar Host Convention

**Feature**: 011-sdk-sidecar-host  
**Date**: 2025-12-16  
**Status**: Complete

## Research Tasks

### 1. Current Implementation Analysis

**Question**: How does the SDK currently resolve sidecar URL?

**Finding**: `SpasConfiguration.GetSpasSidecarUrl()` in `Spas.Sdk.Core.Configuration`:

```csharp
public static string GetSpasSidecarUrl(this IConfiguration configuration)
{
    var sidecarHost = configuration.GetValue<string>("SIDECAR_HOST");
    var sidecarPort = configuration.GetValue<int?>("SIDECAR_PORT");

    if (!string.IsNullOrEmpty(sidecarHost) && sidecarPort.HasValue)
    {
        return $"http://{sidecarHost}:{sidecarPort}";
    }

    var sidecarUrl = configuration.GetValue<string>("SIDECAR_URL");
    if (!string.IsNullOrEmpty(sidecarUrl))
    {
        return sidecarUrl;
    }

    return "http://localhost:3001";  // Note: Should be 7000 per sidecar standard
}
```

**Gap**: No derivation from `SERVICE_NAME`. Also default port is 3001 (should be 7000).

---

### 2. SERVICE_NAME Availability

**Question**: Is SERVICE_NAME reliably available when sidecar URL is needed?

**Finding**: Yes. `GetSpasServiceName()` exists and is called in `AddSpasServices()` before `GetSpasSidecarUrl()`.

**Decision**: Can safely use SERVICE_NAME for derivation - it's always read first.

---

### 3. DNS Name Normalization

**Question**: What normalization is needed for SERVICE_NAME → DNS hostname?

**Finding**: Docker container names follow DNS label rules:
- Lowercase only
- Alphanumeric and hyphens
- Cannot start/end with hyphen
- Max 63 characters

**Decision**: 
- Convert to lowercase
- Replace underscores with hyphens
- Replace spaces with hyphens
- Trim leading/trailing hyphens

**Example**: `Order_Service` → `order-service` → `order-service-sidecar`

---

### 4. Logging Approach

**Question**: How to log resolved URL without adding logging dependency?

**Finding**: Options:
1. Add `ILogger` parameter (breaking change)
2. Use `Console.WriteLine` (simple but not ideal)
3. Return tuple with URL + derivation source (caller logs)
4. Add separate method with logging

**Decision**: Option 3 - Add overload that returns derivation source. Caller (`SpasServiceExtensions`) already has logging context and can log appropriately.

---

### 5. Backward Compatibility

**Question**: What existing deployments might break?

**Finding**: Current priority:
1. `SIDECAR_HOST` + `SIDECAR_PORT`
2. `SIDECAR_URL`
3. localhost:3001 fallback

New priority (spec'd):
1. `SIDECAR_URL` (moves up - full URL should win)
2. `SIDECAR_HOST` + `SIDECAR_PORT`
3. `SIDECAR_HOST` + default port
4. Derived from `SERVICE_NAME`
5. localhost:7000 fallback

**Risk**: Default port changes from 3001 → 7000. This is a fix, not a break (7000 is the sidecar standard).

**Decision**: Priority reorder is safe. Port change is correct.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| D1: Derivation suffix | `-sidecar` | Matches Spec 009 Docker Compose generation |
| D2: Default port | `7000` | SPAS sidecar standard (was incorrectly 3001) |
| D3: Normalization | Lowercase + hyphens | DNS label compatibility |
| D4: Logging | Caller responsibility | Avoids adding ILogger dependency |
| D5: Method signature | Add `serviceName` parameter | Enables derivation without re-reading config |

## Implementation Approach

### Modified Method Signature

```csharp
public static string GetSpasSidecarUrl(
    this IConfiguration configuration, 
    string? serviceName = null)
```

### Priority Logic

```csharp
// 1. Full URL (highest priority)
var sidecarUrl = configuration.GetValue<string>("SIDECAR_URL");
if (!string.IsNullOrEmpty(sidecarUrl)) return sidecarUrl;

// 2. Explicit host + port
var sidecarHost = configuration.GetValue<string>("SIDECAR_HOST");
var sidecarPort = configuration.GetValue<int?>("SIDECAR_PORT") ?? 7000;
if (!string.IsNullOrEmpty(sidecarHost)) return $"http://{sidecarHost}:{sidecarPort}";

// 3. Derive from service name
if (!string.IsNullOrEmpty(serviceName))
{
    var normalizedName = NormalizeForDns(serviceName);
    return $"http://{normalizedName}-sidecar:{sidecarPort}";
}

// 4. Localhost fallback
return $"http://localhost:7000";
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Port change 3001→7000 breaks local dev | Low | Was incorrect; local dev should set SIDECAR_HOST |
| Derived host unreachable | Medium | Clear error messages + override option |
| SERVICE_NAME has special chars | Low | DNS normalization handles edge cases |

## Open Questions

None - all clarifications resolved.
