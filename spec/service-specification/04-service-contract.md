# Service Contract

Specifies required interfaces and behaviors for a SPAS service.

## gRPC API

- Proto-first; package versions (e.g., `orders.v1`) govern API evolution
- Method naming: Commands use imperative verbs; Queries use `Get/List`
- Errors: gRPC status + structured details (problem detail message type recommended)
- Deadlines: Clients set; services MUST honor
- Streaming: Allowed; backpressure handled by HTTP/2 flow control and client-side cancellation. Long-lived streams SHOULD be query/notification oriented, not commands.

> PoC vs Production
>
> - PoC: Validation and error model recommendations
> - Production: Validation required; error details schema defined

## Event Contracts

- Published events: Domain facts with versioned types (`<domain>.<boundedContext>.<eventName>.v<major>`) aligned to CloudEvents `type`
- Subscribed events: Sidecar invokes designated gRPC handler; service implements idempotent processing (PoC responsibility)
- Envelope: CloudEvents JSON; required attributes: `id`, `source`, `type`, `specversion`, `time`; extensions: `correlationid`, `traceparent`, optional `causationid`
- Schema evolution: additive-only; new fields optional; incompatible removal requires new major event type version

## Consistency & Idempotency

- Commands MUST be ACID; Queries MAY be eventual
- Service declares idempotency strategy (PoC: documentation only) via `spas.json` (`idempotency.strategy`: NONE|KEY|NATURAL|CUSTOM)
- Per-command override MAY specify idempotency key field
- Future: sidecar/mesh MAY enforce replay suppression based on declared strategy

## Health & Readiness

- Service implements gRPC health or HTTP endpoints; sidecar exposes its own health separately (`11-sidecar-contract.md`)
- Readiness indicates critical dependency availability (databases, caches, external APIs) and should fail closed if dependencies unavailable

## Related Documents

- [Service Model](03-service-model.md)
- [gRPC Protocol](../protocol-specification/08-grpc-protocol.md)
- [Event Protocol](../protocol-specification/09-event-protocol.md)
