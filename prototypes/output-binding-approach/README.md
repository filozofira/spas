
# Transformer-Sidecar Architecture (Decoupled Transformation)

This approach uses a generic transformer-sidecar deployed alongside both publisher and subscriber services. Each sidecar:

- Transforms messages before publishing to Redis
- Subscribes to Redis topics, transforms incoming messages, and invokes the local service endpoint

## Architecture

```
Publisher Service
  ↓
Publisher Transformer Sidecar (port 7001)
  - Transforms and publishes to Redis topic 'orders-requested'
  ↓
Redis (port 6379)
  ↓
Subscriber Transformer Sidecar (port 7002)
  - Subscribes to 'orders-requested', transforms, invokes Subscriber /incoming endpoint
  ↓
Subscriber Service (port 6000)
  - Processes message, can publish new message via its sidecar
```

## Key Advantages

✅ **Full Decoupling**: Services do not connect to Redis directly
✅ **Symmetric Design**: Both publisher and subscriber use the same sidecar pattern
✅ **Multi-topic Ready**: Sidecars can be configured for multiple topics
✅ **Transformation Logic Isolated**: Easy to update/extend transformations

## How It Works

### 1. Publisher sends message via HTTP to its transformer-sidecar

```
POST http://publisher-transformer-sidecar:7001/publish/orders-requested
{
  "orderId": "ORDER-1",
  "amount": 100
}
```

### 2. Publisher transformer-sidecar transforms and publishes to Redis

### 3. Subscriber transformer-sidecar subscribes to Redis, transforms, and invokes Subscriber

```
POST http://subscriber:6000/incoming
{
  "orderId": "ORDER-1",
  "amount": 100,
  "_transformed": true,
  "_transformed_at": "2025-12-08T20:00:00.000Z",
  "_component": "transformer-sidecar-input"
}
```

### 4. Subscriber processes message, can publish new message via its sidecar

## Setup & Running

### 1. Start all services

```bash
docker compose up --build
```

### 2. Monitor publisher

```bash
docker logs dapr-output-binding-publisher -f
```

### 3. Monitor publisher-transformer-sidecar

```bash
docker logs publisher-transformer-sidecar -f
```

### 4. Monitor subscriber-transformer-sidecar

```bash
docker logs subscriber-transformer-sidecar -f
```

### 5. Monitor subscriber

```bash
docker logs dapr-output-binding-subscriber -f
```

## Key Advantages Over Pluggable Components

✅ **No Unix Socket Issues**: HTTP binding is stable and well-tested
✅ **Simpler Debugging**: HTTP requests are easier to debug than gRPC
✅ **Standard Deployment**: Works with standard DAPR without special setup
✅ **Language Agnostic**: Transformer can be any HTTP service
✅ **No Version Compatibility**: Works with DAPR 1.0+
✅ **Clear Message Flow**: Easy to trace and understand

## Disadvantages

❌ **Extra Network Hop**: Message goes through transformer before Redis
❌ **No Automatic Subscription**: Subscriber must connect to Redis directly (not via DAPR pubsub)
❌ **Latency**: Additional HTTP request for each message
❌ **Middleware Deployment**: Requires separate deployment of transformer service

## How It Works

### 1. Publisher Sends Message via Output Binding

```
POST /v1.0/bindings/http-transformer
{
  "data": {
    "orderId": "ORDER-1",
    "amount": 100
  },
  "metadata": {
    "messageId": "1"
  }
}
```

### 2. Transformer Receives and Transforms

- Receives HTTP POST request from DAPR
- Transforms message (adds metadata)
- Publishes to Redis channel `orders-transformed`

### 3. Subscriber Listens to Redis Channel

- Connects directly to Redis (not via DAPR)
- Subscribes to `orders-transformed` channel
- Receives transformed messages in real-time

## Setup & Running

### 1. Start all services

```bash
docker compose up --build
```

### 2. Monitor publisher

```bash
docker logs dapr-output-binding-publisher -f
```

### 3. Monitor transformer

```bash
docker logs dapr-output-binding-transformer -f
```

### 4. Monitor subscriber

```bash
docker logs dapr-output-binding-subscriber -f
```

## Message Flow Example

**Original Message (from Publisher)**:

```json
{
  "orderId": "ORDER-1",
  "amount": 100,
  "timestamp": "2025-12-08T20:00:00.000Z"
}
```

**Transformed Message (in Redis)**:

```json
{
  "orderId": "ORDER-1",
  "amount": 100,
  "timestamp": "2025-12-08T20:00:00.000Z",
  "_transformed": true,
  "_transformed_at": "2025-12-08T20:00:00.123Z",
  "_component": "output-binding-transformer"
}
```

## Why This Works Better

The pluggable component approach failed because:

- DAPR v1.16.4 has issues with Unix socket discovery in Docker
- gRPC reflection implementation was incompatible
- DAPR would hang after discovering the socket

The output binding approach works because:

- HTTP is a stable, tested protocol
- DAPR output bindings are mature and well-supported
- No special gRPC reflection required
- Clear request/response pattern

## Limitations

1. **One-way Flow**: Output binding is request-response, not streaming
2. **Error Handling**: Need to handle transformer failures separately
3. **Subscriber Coupling**: Subscriber connects directly to Redis (not via DAPR)
4. **No Automatic Scaling**: Transformer becomes a potential bottleneck

## Alternative: Input Bindings

Instead of output bindings, could use input bindings:

- Messages come from HTTP endpoint
- DAPR receives and publishes to pubsub
- But still requires Redis pubsub to work (which it does!)

## Next Steps

1. Add error handling and retry logic in transformer
2. Add monitoring and metrics
3. Handle message batching
4. Consider using Kafka instead of Redis for higher throughput
5. Add circuit breaker pattern for transformer failures
