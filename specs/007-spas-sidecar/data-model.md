# Data Model: SPAS Sidecar Component

**Feature**: 007-spas-sidecar  
**Date**: 2025-12-14  
**Phase**: 1 - Design

## Core Entities

### SidecarConfig

Root configuration object loaded from JSON file.

```typescript
interface SidecarConfig {
  inbound: InboundEntry[];
  outbound: OutboundEntry[];
}
```

**Source**: Mounted JSON file at `CONFIG_PATH` environment variable path.

---

### InboundEntry

Configuration for consuming events or handling commands.

```typescript
interface InboundEntry {
  kind: 'command' | 'event';
  command?: string;        // Required when kind='command'
  topic?: string;          // Required when kind='event'
  transform?: string;      // Optional - passthrough when omitted
  invokeEndpoint: string;  // Service endpoint to invoke
}
```

**Validation Rules**:
- `kind` is required, must be "command" or "event"
- `command` required when `kind='command'`
- `topic` required when `kind='event'`
- `transform` is optional (passthrough when omitted)
- `invokeEndpoint` required for commands, optional for events (but typically present)

---

### OutboundEntry

Configuration for publishing events. Maps event types to target topics.

```typescript
interface OutboundEntry {
  eventType: string;     // Event type from x-event-type header (e.g., 'com.example.order.created')
  topic: string;         // Target Redis stream topic
  transform?: string;    // Optional - when omitted, no transformation applied
}
```

**Validation Rules**:
- `eventType` is required (used for routing lookup)
- `topic` is required
- `transform` is optional (passthrough when omitted)

**Topic Resolution**: When sidecar receives `POST /publish`, it extracts `x-event-type` header and searches outbound entries for matching `eventType`. The corresponding `topic` is used as the Redis stream destination.

---

### CloudEvent

Message envelope following CloudEvents 1.0 specification.

```typescript
interface CloudEvent {
  specversion: '1.0';
  type: string;              // Event type (e.g., 'order.created')
  source: string;            // Event source (e.g., 'order-service')
  subject?: string;          // Topic name
  id: string;                // UUID
  time: string;              // ISO 8601 timestamp
  datacontenttype: string;   // 'application/json'
  traceparent: string;       // W3C Trace Context
  data: unknown;             // Transformed payload
}
```

**CloudEvents Extensions**:
- `traceparent`: W3C Trace Context header (always included)
- `correlationid`: Correlation ID (when present in source)

---

### ZipkinSpan

Trace span for Zipkin API v2.

```typescript
interface ZipkinSpan {
  traceId: string;           // 32 hex chars (from traceparent)
  id: string;                // 16 hex chars (unique per span)
  parentId?: string;         // 16 hex chars (parent span)
  name: string;              // Operation name
  timestamp: number;         // Microseconds since epoch
  duration: number;          // Microseconds
  localEndpoint: {
    serviceName: string;     // e.g., 'order-service-sidecar'
  };
  tags: Record<string, string>;
}
```

**Standard Tags**:
- `kind`: 'event' | 'command'
- `transport`: 'redis' | 'http'
- `event.topic`: Topic name (for events)
- `http.url`: Invocation URL
- `http.method`: 'POST'
- `transform.function`: Transform function name

---

### HealthResponse

Response for health check endpoints.

```typescript
interface HealthResponse {
  status: 'ok' | 'ready' | 'not ready';
  reason?: string;           // Explanation when not ready
  timestamp: string;         // ISO 8601
}
```

---

## State Transitions

### Sidecar Lifecycle

```
┌─────────────┐   config loaded   ┌─────────────┐   Redis connected   ┌─────────────┐
│   STARTING  │ ─────────────────>│ CONNECTING  │ ─────────────────────>│    READY    │
└─────────────┘                   └─────────────┘                       └─────────────┘
       │                                 │                                     │
       │ config invalid                  │ Redis timeout                       │ Redis disconnected
       ▼                                 ▼                                     ▼
┌─────────────┐                   ┌─────────────┐                       ┌─────────────┐
│   FAILED    │                   │   FAILED    │                       │  DEGRADED   │
└─────────────┘                   └─────────────┘                       └─────────────┘
```

**State Mapping to Health Endpoints**:
- STARTING: `/health` 503, `/ready` 503
- CONNECTING: `/health` 200, `/ready` 503
- READY: `/health` 200, `/ready` 200
- DEGRADED: `/health` 200, `/ready` 503
- FAILED: `/health` 503, `/ready` 503 (process should exit)

---

### Event Flow

```
Service → POST /publish
           │ (headers: x-event-type, x-service-name, x-correlation-id, ...)
           ▼
    ┌──────────────┐
    │ Resolve     │ (lookup topic from x-event-type via outbound config)
    │ Topic       │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Apply        │ (if outbound.transform configured)
    │ Transform    │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Wrap in      │
    │ CloudEvents  │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ XADD to      │
    │ Redis Stream │
    └──────────────┘
           │
           ▼
       202 Accepted
```

---

### Subscription Flow

```
Redis Stream (XREAD)
           │
           ▼
    ┌──────────────┐
    │ Parse        │
    │ CloudEvent   │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Apply        │ (inbound.transform)
    │ Transform    │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Invoke       │ (POST to invokeEndpoint)
    │ Service      │
    └──────────────┘
           │
           ▼
    Log result, emit spans
```

---

### Command Flow

```
Client → POST /invoke/{command}
           │
           ▼
    ┌──────────────┐
    │ Lookup       │ (find inbound entry by command)
    │ Command      │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Apply        │ (inbound.transform)
    │ Transform    │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Invoke       │ (POST to invokeEndpoint)
    │ Service      │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ Transform    │ (optional response transform)
    │ Response     │
    └──────────────┘
           │
           ▼
    Return response to client
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONFIG_PATH` | Yes | `./config.json` | Path to config file |
| `SERVICE_NAME` | Yes | - | Target service hostname |
| `SERVICE_PORT` | No | - | Target service port |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `ZIPKIN_URL` | No | - | Zipkin base URL (enables tracing) |
| `SIDECAR_PORT` | No | `7000` | Port for sidecar HTTP server |
