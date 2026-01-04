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

### Neutral Identifiers for Reusable Services

Services designed for reuse across domains SHOULD accept neutral identifiers rather than domain-specific ones:

- Use `referenceId` (caller's correlation ID) instead of `orderId`, `rentalId`, `customerId`, etc.
- Domain context is provided by choreography transformations, not embedded in the contract
- This enables the same service contract to serve Orders, Rentals, Subscriptions, etc.

**Example:**

```json
// Domain-agnostic contract (preferred for utility services)
{
  "referenceId": "ord-123",      // Caller provides their domain ID
  "items": [...],
  "shippingAddress": {...}
}
```

### Entity Naming in Contracts

When defining request/response DTOs for utility services, use neutral entity terminology:

**Domain-Coupled (Avoid):**
```json
{
  "productId": "prod-456",    // Assumes commerce domain
  "quantity": 10,
  "orderId": "ord-123"        // Assumes order context
}
```

**Domain-Agnostic (Preferred):**
```json
{
  "itemId": "item-456",       // Generic: product, license, supply, asset
  "quantity": 10,
  "referenceId": "ord-123"    // Opaque: order, rental, subscription
}
```

**JSON Schema Example:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ReserveItemsRequest",
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string",
      "description": "Generic item identifier (product/license/supply/asset)"
    },
    "quantity": {
      "type": "integer",
      "minimum": 1
    },
    "referenceId": {
      "type": "string",
      "description": "Opaque caller context (order/rental/subscription ID)"
    }
  },
  "required": ["itemId", "quantity", "referenceId"]
}
```

See [Service Model - Domain-Agnostic Design](03-service-model.md#domain-agnostic-service-design) for guidelines.

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
