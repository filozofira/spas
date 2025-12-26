# SPAS SDK Conventions

Shared conventions across all SPAS SDK implementations (.NET, Java, Python, Go, etc.).

## Event Naming

All SDKs normalize event names to **kebab-case** in `spas.json` for cross-language interoperability.

| Language Convention | Normalized in spas.json |
|---------------------|-------------------------|
| `OrderCreated` (PascalCase) | `order-created` |
| `ORDER_FULFILLED` (SCREAMING_SNAKE) | `order-fulfilled` |
| `payment_processed` (snake_case) | `payment-processed` |

**CloudEvents `type` format**: `com.{service-name}.{event-name-kebab}`

Example: `com.order-service.order-created`

## Schema References

SDKs use **schemaRef** (URI reference) instead of embedding full schemas in `spas.json`.

Valid schemaRef patterns:
- Relative: `schemas/endpoints/create-order.schema.json`
- Absolute: `https://example.com/schemas/order-created.schema.json`
- Fragment: `#/definitions/OrderCreated` (for shared schema files)

**Why**: Keeps metadata compact and avoids duplication when schemas are reused.

## Description Guidelines

Descriptions are **optional** but strongly recommended for AI-assisted choreography.

**Rules**:
- Plain text only (no Markdown formatting)
- May include newlines for readability
- Intent-focused: purpose + key inputs + side effects

**Good examples**:
- Service: `"Manages order lifecycle from creation through fulfillment; publishes OrderCreated and OrderFulfilled events"`
- Command: `"Creates a new order using customer address and line items; reserves inventory and emits OrderCreated"`
- Query: `"Returns order details by orderId including current status and line items"`
- Event: `"Emitted when an order is successfully created and inventory reserved; triggers fulfillment workflow"`

**Bad examples**:
- `"CreateOrder"` (just restates the name)
- `"Does stuff"` (too vague)
- `"Creates an order (maybe)"` (ambiguous)

See [specs/017-metadata-descriptions](../../specs/017-metadata-descriptions/) for full guidelines.

## Schema Version

All SDKs produce `spas.json` with:
- `schemaVersion: "design-time-metadata-v1"`

Runtime metadata (container image, resources, environment) is added by Repository/CLI, not SDKs.

## SDK vs Sidecar Boundaries

**SDK responsibilities**:
- Generate `spas.json` with service identity, contracts, security, consistency, network metadata
- Publish events to sidecar via HTTP POST with headers (traceparent, x-service-name, x-event-type, etc.)
- Provide context propagation (trace, correlation, identity)
- Support offline design-time metadata archive generation

**Sidecar responsibilities**:
- Wrap events in CloudEvents 1.0 envelope
- Route events to topics based on event type configuration
- Subscribe to topics and invoke service endpoints
- Handle JSONata transformations

**Repository responsibilities**:
- Transform design-time metadata to runtime metadata
- Add Docker image digests, tags, repository URLs
- Schema validation against design-time-metadata-v1

## Trace Context

All SDKs propagate W3C Trace Context via:
- Inbound: Extract `traceparent` / `tracestate` headers from HTTP requests
- Outbound: Add `traceparent` header to sidecar publish calls

Format: `traceparent: 00-{trace-id}-{span-id}-{flags}`

See [principles/protocol/07-communication-model.md](../../principles/protocol/07-communication-model.md) for details.

## Identity Propagation (PoC)

**Current approach** (PoC only):
- `x-user-id`: User identity
- `x-tenant-id`: Tenant identity
- `x-correlation-id`: Request correlation ID

**Production** (future):
- mTLS + SPIFFE workload identities
- See SDK-specific SECURITY.md for migration path

## Consistency Guarantees

Commands and queries declare consistency expectations:

**Commands**:
- `ACID`: Strong consistency (default for commands)
- `EVENTUAL`: Eventual consistency

**Queries**:
- `STRONG`: Read-your-writes guarantee (default for queries)
- `EVENTUAL`: Stale reads acceptable

SDKs should provide builder APIs or attributes to set these explicitly.

## Backwards Compatibility

When adding new SDK features:
- **Metadata schema changes**: Require coordination with Repository (schema validation must accept new fields)
- **Event header changes**: Document in communication model principles first
- **Breaking changes**: Follow [principles/governance/23-versioning-strategy.md](../../principles/governance/23-versioning-strategy.md)

## Testing Conventions

Each SDK should validate:
- Metadata generation produces valid design-time-metadata-v1 JSON
- Event publishing sends correct headers to sidecar
- Trace context propagates through publish calls
- Offline archive generation produces a valid ZIP archive (`spas.json` at root + referenced schemas)

Use SDK-native test frameworks (xUnit for .NET, JUnit for Java, pytest for Python, etc.).
