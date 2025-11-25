# gRPC Protocol

## Service Definition

- Proto package versioning (e.g., `orders.v1`)
- Naming: Commands (`CreateOrder`), Queries (`GetOrder`, `ListOrders`)
- Backward compatibility: additive-only in minor; breaking in major

## Error Semantics

- Use gRPC status codes
- Structured error details (google.rpc.Status)

## Timeouts & Retries

- Clients set deadlines; servers return appropriate status on timeout
- Retries only for idempotent operations

## Idempotency

- Recommended: Idempotency keys for mutating RPCs via metadata
- Service documents idempotency strategy in `spas.json`

## Health

- Implement grpc.health.v1.Health or expose via sidecar health endpoints
