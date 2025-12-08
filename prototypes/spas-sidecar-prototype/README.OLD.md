# SPAS: Sidecar Pattern for Asynchronous Services

This is a production-ready implementation of the **SPAS (Sidecar Pattern for Asynchronous Services)** architecture with **CloudEvents** messaging and **Zipkin** distributed tracing.

## Architecture Overview

The SPAS pattern uses a dedicated transformer sidecar deployed alongside each service. Each sidecar handles:
- Message transformation (input/output)
- Redis pub/sub integration
- Distributed tracing via CloudEvents + Zipkin
- Service invocation orchestration

```
          Order Service (port 5001)
                ↓ POST /publish/orders-requested
    Order Service Sidecar (port 7001)
       ├─ Transforms (CloudEvents wrapper)
       ├─ Propagates trace ID
       ├─ Logs span to Zipkin
       └─ Publishes to Redis: orders-requested
                ↓
              Redis (port 6379)
                ↓
Fulfillment Service Sidecar (port 7002)
       ├─ Transforms (CloudEvents)
       ├─ Extracts trace ID
       ├─ Logs span to Zipkin
       └─ HTTP POST /incoming to Fulfillment Service
                ↓
       Fulfillment Service (port 5002)
       ├─ Processes order
       ├─ Publishes fulfillment event
       └─ POST /publish/orders-processed to sidecar
                ↓
Fulfillment Service Sidecar (port 7002)
       ├─ Transforms (CloudEvents wrapper)
       ├─ Preserves trace ID
       ├─ Logs span to Zipkin
       └─ Publishes to Redis: orders-processed
                ↓
Order Service Sidecar (port 7001)
       ├─ Transforms (CloudEvents)
       ├─ Preserves trace ID
       ├─ Logs span to Zipkin
       └─ HTTP POST /incoming to Order Service
                ↓
          Order Service (port 5001)
       └─ Receives with SAME trace ID ✅
```

## Key Features

✅ **CloudEvents Standard**: All messages wrapped in CloudEvents 1.0 format
✅ **Distributed Tracing**: W3C Trace Context for end-to-end correlation
✅ **Zipkin Integration**: Real-time span visualization at localhost:9411
✅ **Full Decoupling**: Services don't know about Redis or other services
✅ **Symmetric Design**: Both publisher and subscriber use identical sidecar pattern
✅ **Bidirectional Flow**: Services can publish and subscribe simultaneously
✅ **Multi-topic Ready**: Sidecars configurable for multiple topics and transformations
✅ **Event Correlation**: Same trace ID propagates through entire event lifecycle

## Message Format: CloudEvents

All messages flowing through the SPAS sidecars are wrapped in the CloudEvents specification:

```json
{
  "specversion": "1.0",
  "type": "message.transformed",
  "source": "spas-sidecar",
  "subject": "orders-requested",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": "2025-12-08T20:00:00.000Z",
  "datacontenttype": "application/json",
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "data": {
    "orderId": "ORDER-1",
    "amount": 100,
    "timestamp": "2025-12-08T20:00:00.000Z",
    "_transformed": true,
    "_transformed_at": "2025-12-08T20:00:00.123Z",
    "_component": "spas-sidecar-input"
  }
}
```

### CloudEvents Fields

| Field | Purpose |
|-------|---------|
| `specversion` | CloudEvents spec version (always "1.0") |
| `type` | Event type: `message.publish`, `message.transformed`, `message.received` |
| `source` | Origin: `spas-sidecar`, `order-service`, `fulfillment-service` |
| `subject` | Redis topic name: `orders-requested`, `orders-processed` |
| `id` | Unique event ID (UUID v4) |
| `time` | ISO 8601 timestamp |
| `datacontenttype` | Always `application/json` |
| `traceparent` | W3C Trace Context for correlation: `00-{traceId}-{spanId}-{flags}` |
| `data` | Actual message payload + transformation metadata |

## Distributed Tracing with Zipkin

### W3C Trace Context Format

Trace IDs follow the W3C standard:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             |  |                                 |                |
           version   16-byte trace ID (32 hex)   8-byte span ID   trace-flags
```

### Trace Flow

1. **Order Service** generates trace ID and sends to sidecar with `traceparent` header
2. **Order Sidecar** receives, wraps in CloudEvents, preserves `traceparent`
3. **Redis** carries the CloudEvent with embedded traceparent
4. **Fulfillment Sidecar** extracts `traceparent` from CloudEvent, propagates to Fulfillment Service
5. **Zipkin UI** correlates all spans via the shared trace ID

### Viewing Traces in Zipkin

1. Start the system: `docker compose up --build`
2. Open Zipkin UI: http://localhost:9411
3. Click "Find Traces"
4. Search by service name (order-service-sidecar, fulfillment-service-sidecar)
5. Click any trace to see the full flow and span details

## Service Description

### order-service (Publisher & Subscriber)

**Port**: 5001

Generates order events and publishes them. Also receives fulfillment responses:

```
Publishes 5 test orders:
  for i in 1 to 5:
    POST http://order-service-sidecar:7001/publish/orders-requested
    Headers: traceparent, x-service-name
    Body: { orderId, amount, timestamp }

  Receives processed orders from sidecar:
    POST http://order-service:5001/incoming
    Headers: traceparent (from sidecar)
    Body: CloudEvent containing { orderId, status: "fulfilled", ... }
```

**Key Features**:

- W3C Trace Context generation (random trace ID)
- Receives fulfillment responses with **same trace ID** for correlation
- Logs trace ID for end-to-end tracking

### order-service-sidecar (Transformer)

**Port**: 7001

Handles message transformation and Redis pub/sub for the order service:

```
GET  /health                    - Health check
POST /publish/orders-requested  - Accept order from service
                               - Wrap in CloudEvents
                               - Publish to Redis
SUBSCRIBE orders-processed      - Listen for fulfillment responses
                               - Transform and invoke service
```

**Configuration**: `config.order-service.json`

### fulfillment-service (Subscriber & Publisher)

**Port**: 5002

Processes orders and publishes fulfillment events back:

```
Receives CloudEvents-wrapped orders from sidecar:
  POST http://fulfillment-service:5002/incoming
  Headers: traceparent (from sidecar)
  Body: CloudEvent containing order data

Publishes fulfillment events through sidecar:
  POST http://fulfillment-service-sidecar:7002/publish/orders-processed
  Headers: traceparent, x-service-name
  Body: { orderId, status: "fulfilled", amount, timestamp }
```

**Key Features**:

- Extracts and logs trace ID from incoming CloudEvents
- **Publishes fulfillment event with same trace ID** for correlation
- Uses sidecar to wrap and publish back to Redis

### fulfillment-service-sidecar (Transformer)

**Port**: 7002

Handles message transformation and Redis pub/sub for the fulfillment service:

```
GET  /health                    - Health check
POST /publish/orders-processed  - Accept fulfillment from service
                               - Wrap in CloudEvents
                               - Publish to Redis
SUBSCRIBE orders-requested      - Listen for orders
                               - Transform and invoke service
```

**Configuration**: `config.fulfillment-service.json`

## Setup & Running

### 1. Start all services with Docker Compose

```bash
cd prototypes/spas-sidecar-prototype
docker compose up --build
```

### 2. View logs for each service

**Order Service** (publishes):
```bash
docker logs spas-order-service -f
```

**Order Sidecar** (transforms, publishes):
```bash
docker logs order-service-sidecar -f
```

**Fulfillment Sidecar** (subscribes, transforms, invokes):
```bash
docker logs fulfillment-service-sidecar -f
```

**Fulfillment Service** (processes):
```bash
docker logs spas-fulfillment-service -f
```

**Redis** (pub/sub broker):
```bash
docker logs spas-redis -f
```

**Zipkin** (tracing):
```bash
docker logs spas-zipkin -f
# Open http://localhost:9411
```

### 3. Test the flow

Order service starts automatically and publishes 5 orders. Watch the logs to see:
- Order service generating trace IDs
- Sidecars wrapping messages in CloudEvents
- Fulfillment service processing orders and publishing events
- **Order service receiving fulfillment responses with SAME trace ID**

Example: Same trace ID `00-a2d5f08c3a7dd854bca6a3e761848bed-ee4a56b218ee0cc1-01` appears:
1. When order publishes
2. When fulfillment processes
3. When order receives response (end-to-end correlation!)

## Configuration

### Sidecar Config Files

Each sidecar is configured via a JSON file:

**order-service config** (`config.order-service.json`):
```json
{
  "redis": { "host": "redis", "port": 6379 },
  "subscriptions": [
    {
      "topic": "orders-processed",
      "transform": "transformOutput",
      "invokeEndpoint": "http://order-service:5001/incoming"
    }
  ],
  "publications": [
    {
      "topic": "orders-requested",
      "transform": "transformInput"
    }
  ]
}
```

**fulfillment-service config** (`config.fulfillment-service.json`):
```json
{
  "redis": { "host": "redis", "port": 6379 },
  "subscriptions": [
    {
      "topic": "orders-requested",
      "transform": "transformOutput",
      "invokeEndpoint": "http://fulfillment-service:5002/incoming"
    }
  ],
  "publications": [
    {
      "topic": "orders-processed",
      "transform": "transformInput"
    }
  ]
}
```

### Environment Variables

**Sidecars**:
- `PORT`: Sidecar HTTP port (7001, 7002)
- `CONFIG_PATH`: Path to config JSON file
- `SERVICE_NAME`: Name for Zipkin traces (order-service-sidecar, fulfillment-service-sidecar)
- `ZIPKIN_URL`: Zipkin collector endpoint (http://zipkin:9411)

## Message Flow Example: Complete Cycle

### Phase 1: Order Publication

**1. Order Service publishes (with trace ID)**

```
POST http://order-service-sidecar:7001/publish/orders-requested
traceparent: 00-a2d5f08c3a7dd854bca6a3e761848bed-ee4a56b218ee0cc1-01
x-service-name: order-service

{
  "orderId": "ORDER-1",
  "amount": 123.45,
  "timestamp": "2025-12-08T20:00:00.000Z"
}
```

**2. Order Sidecar transforms and publishes**

- Receives message with trace ID
- Applies transformInput function
- Wraps in CloudEvents with traceparent
- Logs span to Zipkin
- Publishes to Redis topic `orders-requested`

**3. Fulfillment Sidecar receives and transforms**

- Subscribes to Redis topic `orders-requested`
- Receives CloudEvent with embedded traceparent (SAME TRACE ID)
- Applies transformOutput function
- Logs span to Zipkin
- Invokes fulfillment-service:/incoming with traceparent header

**4. Fulfillment Service processes**

- Receives CloudEvent-wrapped order with traceparent
- Extracts and logs trace ID
- Processes order (simulated fulfillment)
- Returns 200 OK

### Phase 2: Fulfillment Event Publication (NEW!)

**5. Fulfillment Service publishes fulfillment event**

```
POST http://fulfillment-service-sidecar:7002/publish/orders-processed
traceparent: 00-a2d5f08c3a7dd854bca6a3e761848bed-ee4a56b218ee0cc1-01
x-service-name: fulfillment-service

{
  "orderId": "ORDER-1",
  "status": "fulfilled",
  "amount": 123.45,
  "timestamp": "2025-12-08T20:00:00.523Z"
}
```

Note: **Same trace ID preserved!**

**6. Fulfillment Sidecar transforms and publishes**

- Receives fulfillment event with trace ID
- Applies transformInput function
- Wraps in CloudEvents with traceparent (SAME TRACE ID)
- Logs span to Zipkin
- Publishes to Redis topic `orders-processed`

**7. Order Sidecar receives and transforms**

- Subscribes to Redis topic `orders-processed`
- Receives CloudEvent with embedded traceparent (SAME TRACE ID)
- Applies transformOutput function
- Logs span to Zipkin
- Invokes order-service:/incoming with traceparent header

**8. Order Service receives fulfillment response**

- Receives CloudEvent-wrapped fulfillment with traceparent
- Extracts and logs trace ID
- **Logs: Order ORDER-1 has been fulfilled** with same trace ID
- Correlates with original order request

### Complete Trace Correlation

- **Single trace ID**: `00-a2d5f08c3a7dd854bca6a3e761848bed-ee4a56b218ee0cc1-01`
- **All spans visible in Zipkin** with full service flow:
  1. order-service-sidecar (receive order, transform, publish)
  2. fulfillment-service-sidecar (receive order, transform, invoke)
  3. fulfillment-service (process order)
  4. fulfillment-service-sidecar (receive fulfillment, transform, publish)
  5. order-service-sidecar (receive fulfillment, transform, invoke)
  6. order-service (process fulfillment)
- **Event lifecycle fully observable** with single trace ID

## Why SPAS Architecture?

### ✅ Advantages

1. **Decoupling**: Services don't depend on messaging implementation
2. **Observability**: Built-in distributed tracing via CloudEvents + Zipkin
3. **Flexibility**: Easy to add new transformations or topics
4. **Standard Format**: CloudEvents is industry standard
5. **Scalability**: Each sidecar independently scalable
6. **Symmetric**: Publisher and subscriber use identical patterns

### ❌ Limitations

1. **Extra Network Hop**: Message passes through sidecar
2. **Deployment Complexity**: Two containers per service
3. **Latency**: Additional HTTP request for each message
4. **Resource Overhead**: One sidecar process per service
5. **Debugging**: More layers to trace through

## Comparison with Alternatives

| Aspect | SPAS Sidecar (Selected) | Direct Redis | Message Queue | Service Mesh |
|--------|------|------|--------------|---------------|
| Decoupling | ✅ Full | ❌ Partial | ✅ Full | ✅ Full |
| Tracing | ✅ Built-in (W3C) | ❌ Manual | ⚠️ Limited | ✅ Built-in |
| Transformation | ✅ Native | ❌ None | ❌ None | ⚠️ Limited |
| Complexity | ⚠️ Medium | ✅ Low | ⚠️ Medium | ⚠️ High |
| Standards | ✅ CloudEvents | ❌ None | ✅ Protocol-specific | ✅ CNCF |
| Control | ✅ Full | ✅ Full | ⚠️ Limited | ⚠️ Limited |

**Why SPAS Sidecar**: Combined benefits of transformation layer (unlike direct Redis), built-in tracing (unlike message queues), and lower operational complexity than service mesh. Service mesh deferred to Production for infrastructure concerns (mTLS, policy).

## Next Steps

### Phase 2: Production Hardening

- Add retry logic and circuit breakers
- Implement message dead-letter queues (DLQ)
- Add comprehensive metrics collection
- Error handling and logging improvements

### Phase 3: Advanced Features

- Support for message batching
- Outbox pattern for transactional publishing
- Saga pattern for distributed transactions
- Event sourcing integration

### Phase 4: Multi-Tenant Support

- Per-tenant configuration
- Isolated trace contexts
- Multi-topic orchestration

## Troubleshooting

### No messages flowing

1. Check Redis is running: `docker logs spas-redis`
2. Check sidecars connected to Redis: Look for "Subscribed to topic" logs
3. Check order-service published: Look for "Message sent successfully" logs
4. Check fulfillment-service received: Look for "MESSAGE RECEIVED FROM SIDECAR" logs

### Missing trace IDs in Zipkin

1. Verify `ZIPKIN_URL` environment variable is set on sidecars
2. Check Zipkin container is running: `docker logs spas-zipkin`
3. Look for Zipkin initialization log: "[SIDECAR] Zipkin tracing enabled"

### Services not connecting

1. Verify service names in docker-compose match config files
2. Check sidecar config endpoints point to correct service hosts
3. Verify all containers are on `spas-network`

## References

- [CloudEvents Specification](https://cloudevents.io/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Zipkin Documentation](https://zipkin.io/pages/quickstart.html)
- [SPAS Pattern](https://www.nginx.com/blog/building-microservices-using-an-event-driven-architecture/)
