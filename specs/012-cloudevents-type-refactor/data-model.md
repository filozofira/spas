# Data Model: CloudEvents Type Construction Refactor

**Feature**: 012-cloudevents-type-refactor  
**Date**: 2025-01-20

## Entities

### PublishHeaders (Sidecar)

HTTP headers extracted from SDK publish request. Updated to support both legacy and new header formats.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceName` | string | Yes | From `x-service-name` header |
| `eventType` | string | Conditional | From `x-event-type` header (legacy) |
| `eventName` | string | Conditional | From `x-event-name` header (new) |
| `correlationId` | string | Yes | From `x-correlation-id` header |
| `traceparent` | string | No | From `traceparent` header |
| `userId` | string | No | From `x-user-id` header |
| `tenantId` | string | No | From `x-tenant-id` header |

**Validation Rule**: At least one of `eventType` OR `eventName` must be present.

---

### CloudEvents Type Format

The `type` field in CloudEvents envelope follows this format:

```
com.{service-name}.{event-name-kebab}
```

| Component | Source | Example |
|-----------|--------|---------|
| Prefix | Hardcoded | `com` |
| Service Name | `x-service-name` header | `order-service` |
| Event Name | `x-event-name` header (kebab-case) | `order-created` |

**Full Example**: `com.order-service.order-created`

---

### SDK Publish Request (Outbound)

Headers sent from SDK to sidecar `/publish` endpoint.

**Current (Before)**:
```
POST /publish
Headers:
  traceparent: 00-{trace-id}-{span-id}-01
  x-service-name: order-service
  x-event-type: com.order-service.order-created  # Full type constructed by SDK
  x-correlation-id: {uuid}
Body: { "orderId": "123", ... }
```

**Target (After)**:
```
POST /publish
Headers:
  traceparent: 00-{trace-id}-{span-id}-01
  x-service-name: order-service
  x-event-name: order-created                    # Short name only
  x-correlation-id: {uuid}
Body: { "orderId": "123", ... }
```

---

### OutboundEntry (Sidecar Config)

Sidecar configuration for outbound event routing. **No changes required** - config still uses full `eventType` for routing lookup.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventType` | string | Yes | Full CloudEvents type for routing lookup |
| `topic` | string | Yes | Target Redis stream topic |
| `transform` | string | No | Optional JSONata transform path |

**Example**:
```json
{
  "eventType": "com.order-service.order-created",
  "topic": "orders.created",
  "transform": "transforms/order-created.jsonata"
}
```

---

## State Transitions

### Header Processing Flow

```
SDK Request → Sidecar Validation → Type Resolution → CloudEvents Construction
```

**Type Resolution Logic**:

```
IF x-event-name present:
  type = constructType(x-service-name, x-event-name)
ELSE IF x-event-type present:
  type = x-event-type  # Legacy passthrough
ELSE:
  REJECT with 400 Bad Request
```

---

## Relationships

```
┌─────────────────────┐
│   SDK EventPublisher │
│                     │
│ - serviceName       │
│ - eventName (kebab) │
└─────────┬───────────┘
          │ POST /publish
          │ x-service-name, x-event-name
          ▼
┌─────────────────────┐
│   Sidecar           │
│                     │
│ PublishHeaders      │──┐
│ - serviceName       │  │ construct
│ - eventName         │  │
│ - eventType (legacy)│  ▼
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CloudEvent        │
│                     │
│ type: com.{svc}.{ev}│ ◄── Constructed by sidecar
│ source: {svc}       │
│ data: {payload}     │
└─────────────────────┘
```

---

## Validation Rules

| Rule | Component | Error |
|------|-----------|-------|
| `x-service-name` required | Sidecar | 400: Missing required header: x-service-name |
| `x-correlation-id` required | Sidecar | 400: Missing required header: x-correlation-id |
| One of `x-event-type` OR `x-event-name` required | Sidecar | 400: Missing required header: x-event-type or x-event-name |
| Event name must be non-empty | SDK | ArgumentNullException |

---

## Terminology Alignment

This feature aligns terminology across documentation:

| Before (Inconsistent) | After (Consistent) |
|----------------------|-------------------|
| `com.{boundedContext}.{event-name}` | `com.{service-name}.{event-name-kebab}` |
| Various descriptions | Single format: prefix.service.event |

**Rationale**: `x-service-name` header is the actual source value; "boundedContext" was aspirational but not implemented.
