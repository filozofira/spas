# Research: CloudEvents Type Construction Refactor

**Feature**: 012-cloudevents-type-refactor  
**Date**: 2025-01-20  
**Status**: Complete

## Research Tasks

### 1. Current Implementation Analysis

**Question**: How does the SDK currently construct and send the CloudEvents type?

**Finding**: 
- SDK `EventPublisher.cs` (lines 139-143) constructs full type: `eventType = $"com.{_serviceName}.{eventName}"`
- SDK sends `x-event-type` header with full value
- SDK has `ConvertToKebabCase()` helper (lines 154-168)

**Decision**: SDK will switch from `x-event-type` to `x-event-name` header
**Rationale**: Cleaner separation - SDK only knows event name, sidecar owns format
**Alternatives Considered**: 
- Keep current behavior: Rejected - violates DRY, both components know format
- Send structured JSON header: Rejected - overengineered for simple string

---

### 2. Sidecar Event Publishing Flow

**Question**: How does sidecar currently use the `x-event-type` header?

**Finding**:
- `event-publisher.ts` receives `PublishHeaders` with `eventType` field
- `wrapper.ts` (line 24) copies `headers.eventType` → CloudEvents `type`
- `topic-router.ts` uses `eventType` for routing lookup
- `types.ts` defines `PublishHeaders` interface with `eventType: string`

**Decision**: Sidecar will construct type from `x-service-name` + `x-event-name`
**Rationale**: Single point of type format knowledge
**Alternatives Considered**:
- Add new endpoint for new format: Rejected - unnecessary complexity
- Parse x-event-type if present: Accepted for backward compatibility

---

### 3. Backward Compatibility Strategy

**Question**: How to support rolling deployments (old SDK + new sidecar)?

**Finding**:
- Current sidecar validates `x-event-type` as required header
- Old SDKs will continue sending `x-event-type`
- New SDKs will send `x-event-name`

**Decision**: Sidecar accepts both headers with priority: `x-event-name` > `x-event-type`
**Rationale**: Enables gradual migration without coordinated deployment
**Alternatives Considered**:
- Require coordinated deployment: Rejected - operationally complex
- Version header (x-protocol-version): Rejected - overengineered

---

### 4. Header Validation Changes

**Question**: What validation logic needs to change?

**Finding**:
- `validatePublishHeaders()` in `event-publisher.ts` checks for `x-event-type`
- `extractPublishHeaders()` requires `eventType` to be non-null

**Decision**: Change validation to require ONE OF: `x-event-type` OR `x-event-name`
**Rationale**: Backward compatible, clear error messages
**Alternatives Considered**:
- Always require both: Rejected - breaks backward compatibility
- Make both optional: Rejected - would allow events without type

---

### 5. CLI Sidecar Config Generation

**Question**: What changes in generated sidecar configs?

**Finding**:
- `sidecar-config-generator.ts` produces `eventType` field in outbound entries
- Sidecar uses `eventType` in config for routing lookup
- Config format: `{ eventType: "com.order.order-created", topic: "..." }`

**Decision**: Keep `eventType` in config for routing; it's the lookup key
**Rationale**: Routing config needs full type to match constructed type
**Alternatives Considered**:
- Change to `eventName`: Rejected - would require config format change in sidecar

---

### 6. Type Format Terminology

**Question**: Spec uses both "boundedContext" and "service-name" - which is correct?

**Finding**:
- SDK code uses `_serviceName` in type construction
- Sidecar receives `x-service-name` header
- principles/10-sidecar-contract.md mentions "boundedContext" in format description
- Actual format in code: `com.{serviceName}.{eventName}`

**Decision**: Standardize on `com.{service-name}.{event-name-kebab}`
**Rationale**: Matches implementation, service-name is the actual header value
**Alternatives Considered**:
- Use boundedContext: Rejected - would require additional header/metadata

---

## Implementation Strategy

### SDK Changes (EventPublisher.cs)

1. Rename/change header from `x-event-type` to `x-event-name`
2. Send only kebab-case event name (not full type)
3. Keep `ConvertToKebabCase()` helper
4. Remove full type construction logic

### Sidecar Changes

1. **types.ts**: Add `eventName?: string` to `PublishHeaders`
2. **event-publisher.ts**: 
   - `extractPublishHeaders()`: Extract both `x-event-type` and `x-event-name`
   - `validatePublishHeaders()`: Require ONE OF the two headers
3. **wrapper.ts** or **event-publisher.ts**: Construct type if `eventName` present
4. Add type construction helper: `constructCloudEventsType(serviceName, eventName)`

### CLI Changes (sidecar-config-generator.ts)

1. Continue generating `eventType` field (sidecar needs it for routing)
2. No changes needed - routing lookup unchanged

### Documentation Changes

1. **10-sidecar-contract.md**: Document `x-event-name` header, update type format
2. **12-sdk.md**: Update SDK event publishing section

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Old SDK breaks with new sidecar | Low | High | Backward compatibility via x-event-type support |
| New SDK breaks with old sidecar | Low | High | Deploy sidecar first, then SDK |
| Routing lookup fails | Low | Medium | Type construction matches config format |
| Performance impact | Very Low | Low | String concat is ~microseconds |

---

## Test Strategy

### SDK Tests
- Verify `x-event-name` header sent (not `x-event-type`)
- Verify kebab-case conversion works
- Verify `x-service-name` still sent

### Sidecar Tests
- Verify type construction from `x-service-name` + `x-event-name`
- Verify backward compat: `x-event-type` still works
- Verify validation: error if neither header present
- Verify priority: `x-event-name` preferred when both present

### Integration Tests (if time permits)
- End-to-end: SDK publish → Sidecar → Redis with correct CloudEvents type
