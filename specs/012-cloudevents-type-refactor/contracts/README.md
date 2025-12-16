# Contracts: CloudEvents Type Construction Refactor

**Feature**: 012-cloudevents-type-refactor  
**Date**: 2025-01-20

## API Contracts

This feature modifies the SDK → Sidecar HTTP contract for event publishing.

### POST /publish (Updated)

**Endpoint**: `POST /publish`

**Request Headers** (Updated):

| Header | Required | Type | Description |
|--------|----------|------|-------------|
| `traceparent` | Recommended | string | W3C Trace Context |
| `x-service-name` | Yes | string | Service name (e.g., "order-service") |
| `x-event-name` | Conditional | string | Short event name in kebab-case (NEW) |
| `x-event-type` | Conditional | string | Full CloudEvents type (LEGACY) |
| `x-correlation-id` | Yes | string | Correlation ID |
| `x-user-id` | No | string | User identity |
| `x-tenant-id` | No | string | Tenant identity |

**Validation**: At least ONE of `x-event-name` OR `x-event-type` must be present.

**Priority**: When both present, `x-event-name` takes precedence.

**Request Body**: JSON event payload

**Response**: 

Success (202 Accepted):
```json
{
  "status": "accepted",
  "id": "ce-uuid",
  "topic": "orders.created",
  "eventType": "com.order-service.order-created"
}
```

Error (400 Bad Request):
```json
{
  "error": "Missing required header: x-event-type or x-event-name",
  "missing": ["x-event-type", "x-event-name"]
}
```

---

## Type Construction Contract

When `x-event-name` header is present, sidecar constructs CloudEvents `type` as:

```
type = "com." + x-service-name + "." + x-event-name
```

**Example**:
- `x-service-name`: `order-service`
- `x-event-name`: `order-created`
- Constructed type: `com.order-service.order-created`

When only `x-event-type` is present (legacy), the value is used as-is.

---

## CloudEvents Envelope

The constructed `type` appears in the CloudEvents envelope:

```json
{
  "specversion": "1.0",
  "type": "com.order-service.order-created",
  "source": "order-service",
  "id": "ce-uuid",
  "time": "2025-01-20T12:00:00.000Z",
  "datacontenttype": "application/json",
  "traceparent": "00-trace-id-span-id-01",
  "correlationid": "correlation-uuid",
  "data": { ... }
}
```

---

## Sidecar Config Schema (Unchanged)

Outbound entries still use full `eventType` for routing:

```json
{
  "$schema": "https://spas.dev/schemas/sidecar-config.json",
  "outbound": [
    {
      "eventType": "com.order-service.order-created",
      "topic": "orders.created",
      "transform": "transforms/order-created.jsonata"
    }
  ]
}
```

The sidecar matches the constructed type against `outbound[].eventType` for routing.
