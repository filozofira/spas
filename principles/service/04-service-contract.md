# Service Contract

Specifies required interfaces and behaviors for a SPAS service.

## Service API (gRPC / HTTP)

> **PoC Note:** While the target architecture is gRPC-first, the PoC implementation uses HTTP with JSON payloads. The semantic structure (Commands vs Queries) remains identical.

- Contract-first (Proto or OpenAPI); package versions (e.g., `orders.v1`) govern API evolution
- Method naming: Commands use imperative verbs; Queries use `Get/List`
- Errors: gRPC status or HTTP Problem Details + structured details
- Deadlines: Clients set; services MUST honor
- Streaming: Allowed (gRPC only); backpressure handled by HTTP/2 flow control and client-side cancellation. Long-lived streams SHOULD be query/notification oriented, not commands.

> PoC vs Production
>
> - PoC: HTTP transport; Validation and error model recommendations
> - Production: gRPC transport; Validation required; error details schema defined

## Event Contracts

- Published events: Domain facts with versioned types (`<domain>.<boundedContext>.<eventName>.v<major>`) aligned to CloudEvents `type`
- Subscribed events: Sidecar invokes designated handler (gRPC or HTTP); service implements idempotent processing (PoC responsibility)
- Envelope: CloudEvents JSON; required attributes: `id`, `source`, `type`, `specversion`, `time`; extensions: `correlationid`, `traceparent`, optional `causationid`
- Schema evolution: additive-only; new fields optional; incompatible removal requires new major event type version
- **Event naming**: Event names in `spas.json` use kebab-case format (e.g., `order-created`) regardless of implementation language. SDKs normalize native conventions (PascalCase, snake_case) to kebab-case for cross-language interoperability.

## Consistency & Idempotency

- Commands MUST be ACID; Queries MAY be eventual
- Service declares idempotency strategy (PoC: documentation only) via `spas.json` (`idempotency.strategy`: NONE|KEY|NATURAL|CUSTOM)
- Per-command override MAY specify idempotency key field
- Future: sidecar/mesh MAY enforce replay suppression based on declared strategy

## Health & Readiness

- Service implements gRPC health or HTTP endpoints; sidecar exposes its own health separately (`../component/10-sidecar-contract.md`)
- Readiness indicates critical dependency availability (databases, caches, external APIs) and should fail closed if dependencies unavailable

## Related Documents

- [Service Model](03-service-model.md)
- [gRPC Protocol](../protocol/08-grpc-protocol.md)
- [Event Protocol](../protocol/09-event-protocol.md)
