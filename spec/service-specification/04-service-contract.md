# Service Contract

Specifies required interfaces and behaviors for a SPAS service.

## gRPC API

- Proto-first; package versions (e.g., `orders.v1`) govern API evolution
- Method naming: Commands use imperative verbs; Queries use `Get/List`
- Errors: gRPC status + structured details
- Deadlines: Clients set; services must honor
- Streaming: Allowed with backpressure guidance

> PoC vs Production
>
> - PoC: Validation and error model recommendations
> - Production: Validation required; error details schema defined

## Event Contracts

- Published events: Domain facts with versioned types
- Subscribed events: Handled via sidecar; idempotent consumption
- Envelope headers: `event-id`, `event-type`, `event-version`, `timestamp`, `correlation-id`, `trace-id`
- Schema evolution: additive-only; new fields optional

## Consistency & Idempotency

- Commands MUST be ACID; Queries MAY be eventual
- Service declares idempotency strategy (e.g., idempotency keys, natural keys)
- SDK MAY add helpers in future

## Health & Readiness

- Implement gRPC health or expose via sidecar
- Readiness indicates dependency availability (DB, cache, etc.)
