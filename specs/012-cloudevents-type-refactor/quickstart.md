# Quickstart: CloudEvents Type Construction Refactor

**Feature**: 012-cloudevents-type-refactor  
**Date**: 2025-01-20

## Overview

This feature moves CloudEvents `type` field construction from SDK to Sidecar, simplifying the SDK and centralizing the type format logic.

## Before vs After

### SDK Event Publishing

**Before** (SDK constructs full type):
```csharp
// SDK internally builds: com.order-service.order-created
request.Headers.Add("x-event-type", "com.order-service.order-created");
```

**After** (SDK sends short name):
```csharp
// SDK sends only the event name
request.Headers.Add("x-event-name", "order-created");
```

### Sidecar Type Construction

**Before** (passthrough):
```typescript
// Sidecar just copies header value
cloudEvent.type = headers.eventType;
```

**After** (constructs type):
```typescript
// Sidecar constructs from service-name + event-name
const type = headers.eventName 
  ? `com.${headers.serviceName}.${headers.eventName}`
  : headers.eventType;  // Legacy fallback
cloudEvent.type = type;
```

## Testing the Changes

### 1. Verify SDK Sends Correct Headers

```bash
# Start sidecar with debug logging
docker compose up sidecar

# Publish event from service
curl -X POST http://localhost:7000/publish \
  -H "Content-Type: application/json" \
  -H "traceparent: 00-1234567890abcdef1234567890abcdef-1234567890abcdef-01" \
  -H "x-service-name: order-service" \
  -H "x-event-name: order-created" \
  -H "x-correlation-id: test-123" \
  -d '{"orderId": "ORD-001"}'

# Check sidecar logs for constructed type
# Expected: type = "com.order-service.order-created"
```

### 2. Verify Backward Compatibility (Legacy Header)

```bash
# Old SDK format still works
curl -X POST http://localhost:7000/publish \
  -H "Content-Type: application/json" \
  -H "traceparent: 00-1234567890abcdef1234567890abcdef-1234567890abcdef-01" \
  -H "x-service-name: order-service" \
  -H "x-event-type: com.order-service.order-created" \
  -H "x-correlation-id: test-123" \
  -d '{"orderId": "ORD-001"}'

# Should succeed - legacy format supported
```

### 3. Verify Validation Error (Missing Headers)

```bash
# Missing both event headers
curl -X POST http://localhost:7000/publish \
  -H "Content-Type: application/json" \
  -H "x-service-name: order-service" \
  -H "x-correlation-id: test-123" \
  -d '{"orderId": "ORD-001"}'

# Expected: 400 Bad Request
# Body: { "error": "Missing required header: x-event-type or x-event-name" }
```

## SDK Usage

### Publishing Events (C#)

```csharp
// No changes to service code - SDK handles header change internally

// Option 1: Generic publish with SpasEvent attribute
await _eventPublisher.PublishAsync<OrderCreatedEvent>(payload);
// SDK sends: x-event-name: order-created

// Option 2: Explicit event name (less common)
await _eventPublisher.PublishAsync("order-created", payload);
// SDK sends: x-event-name: order-created
```

### SpasEvent Attribute

```csharp
[SpasEvent("OrderCreated")]
public class OrderCreatedEvent
{
    public string OrderId { get; set; }
    public decimal Amount { get; set; }
}

// "OrderCreated" → kebab-case → "order-created"
// Header sent: x-event-name: order-created
```

## Configuration

### Sidecar Config (Unchanged)

Sidecar config still uses full `eventType` for routing lookup:

```json
{
  "outbound": [
    {
      "eventType": "com.order-service.order-created",
      "topic": "orders.created"
    }
  ]
}
```

The sidecar constructs `com.order-service.order-created` from headers and matches against config.

## Deployment Order

For rolling deployments:

1. **Deploy sidecar first** - Has backward compatibility for `x-event-type`
2. **Deploy SDK-based services** - Will start using `x-event-name`

This order ensures no downtime during migration.

## Troubleshooting

### Event Not Routing

**Symptom**: Events published but not reaching consumers

**Check**:
1. Verify sidecar logs show constructed type: `type = com.{service}.{event}`
2. Compare with `eventType` in sidecar config - must match exactly
3. Ensure service name matches between SDK config and sidecar config

### 400 Bad Request

**Symptom**: Publish fails with missing header error

**Check**:
1. Ensure one of `x-event-type` OR `x-event-name` is present
2. Check SDK version - old SDK should send `x-event-type`
3. Check header names are exact (case-sensitive in some environments)

## Related Files

| Component | File | Changes |
|-----------|------|---------|
| SDK | `EventPublisher.cs` | Send `x-event-name` instead of `x-event-type` |
| Sidecar | `event-publisher.ts` | Extract new header, construct type |
| Sidecar | `types.ts` | Add `eventName` to `PublishHeaders` |
| Sidecar | `wrapper.ts` | Accept constructed type |
| Docs | `10-sidecar-contract.md` | Document new header |
| Docs | `12-sdk.md` | Update SDK section |
