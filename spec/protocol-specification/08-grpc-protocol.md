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

- Recommended: Idempotency keys for mutating RPCs via metadata (`idempotency-key` header or request field)
- Service declares global strategy in `spas.json` (`idempotency.strategy`) and MAY define per-endpoint override (`endpoints[].idempotencyKeyField`)
- Future: sidecar/mesh MAY perform replay suppression using declared keys

## Health

- Service implements `grpc.health.v1.Health` or exposes HTTP health endpoints consumed by platform; sidecar health documented separately.

## Related Documents

- [Communication Model](07-communication-model.md)
- [Sidecar Contract](../component-specification/10-sidecar-contract.md)
- [Service Contract](../service-specification/04-service-contract.md)
