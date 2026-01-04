# Service Model

Defines what makes a service “SPAS-compliant”. Clarifies a single service surface (Production: gRPC, PoC: HTTP), autonomy of internal state, and external adaptation responsibilities.

## Bounded Context Alignment

- Exactly one bounded context per service
- Encapsulated domain model (aggregates, entities, invariants)

## Public Contract

- Single service surface (gRPC in Production; HTTP in PoC) used by both north–south (via gateway) and east–west (invoked by sidecar when translating subscribed events or performing service invocation rules)
- Event contracts
  - Published events (outbound domain facts)
  - Subscribed events (sidecar invokes designated gRPC handlers in Production; HTTP handlers in PoC)
- State model summary: framework does not prescribe persistence patterns (e.g. CRUD, CQRS, event sourcing all allowed)

## Adaptation Layer

- Service only exposes HTTP endpoints in PoC or gRPC methods in Production and internal schemas
- Domain Composition (`choreography.yaml`) declares routing + transformation mappings
- Sidecar/mesh applies inbound (domain→internal) and outbound (internal→domain) transformations; service code remains unchanged

## Health & Observability

- Service MUST expose liveness and readiness endpoints (or gRPC health) consumed by platform
- OpenTelemetry traces/metrics/logs emitted by service and sidecar; sidecar may aggregate

## Security

- No direct service-to-service communication; all traffic mediated by sidecars (enforced by network policies and composition rules)
- Services receive invocations from their sidecars only (both event-driven and direct invocation patterns)
- Service MUST accept propagated identity: JWT from edge (North-South) or via event payload (East-West PoC). In Production, sidecar will inject verified identity headers (SPIFFE/SPIRE cert subject or claims).
- Outbound events enriched with identity + correlation metadata
- Data classification declared in metadata (`security.dataClassification`)

## Domain-Agnostic Service Design

Services intended for reuse across multiple domain contexts SHOULD be designed as **domain-agnostic utilities** rather than domain-specific implementations.

### Neutral Identifiers

- Use generic correlation identifiers (`referenceId`) instead of domain-specific ones (`orderId`, `rentalId`, `subscriptionId`)
- The caller provides their domain-specific ID as the `referenceId`; the service treats it as an opaque correlation key
- This enables the same service to participate in Orders, Rentals, Subscriptions, etc. without code changes

### Entity Identifier Neutrality

Entity identifiers (primary keys, entity references) MUST use neutral terminology when designing utility services:

**Neutral Entity Names:**

| Domain-Specific (Avoid) | Domain-Agnostic (Preferred) | Contexts Enabled |
|------------------------|----------------------------|------------------|
| `productId` | `itemId` | Commerce, Healthcare, SaaS, Facilities, Corporate IT |
| `deviceId` | `unitId` | IoT, Equipment, Vehicles, Facilities |
| `orderId` (as entity) | `transactionId` | Orders, Rentals, Subscriptions, Bookings |
| `customerId` | `accountId` or `partyId` | B2C, B2B, Internal, Partner |

**Why This Matters:**

An inventory service using `productId` creates semantic confusion when:
- 🏥 Hospital tracks medical supplies (not "products")
- 💼 SaaS platform manages license pools (not "products")
- 🏢 Corporate IT tracks laptops/monitors (not "products")

Using `itemId` makes the service **truly reusable** across all these contexts without code changes.

**Test for Domain Agnosticism:**

If you must rename an entity identifier to fit a new business context, your design is domain-coupled. Good: `itemId` works for products, licenses, supplies, assets without modification.

### Examples

| Domain-Specific (Avoid) | Domain-Agnostic (Preferred) |
|-------------------------|-----------------------------|
| `fulfillment-service` as "order fulfillment" with `orderId` | Generic logistics service with `referenceId` |
| `inventory-service` reserving stock for "orders" | Generic stock management reserving for any `referenceId` |
| `CreateShipmentRequest { orderId, ... }` | `CreateShipmentRequest { referenceId, ... }` |

### Context-Free Operations

Business logic in utility services MUST operate on abstract entity types without domain assumptions:

**Bad (Domain-Coupled):**
```csharp
public async Task<StockReservationResult> ReserveProductStock(string productId, int quantity, string orderId)
{
    // Assumes commerce domain: "products", "orders", "stock"
    var product = await _catalog.GetProductAsync(productId);
    if (product.AvailableStock < quantity)
        return StockReservationResult.InsufficientStock;
    // ...
}
```

**Good (Domain-Agnostic):**
```csharp
public async Task<ReservationResult> ReserveItems(string itemId, int quantity, string referenceId)
{
    // Generic: "items", "reference", "reservation"
    var item = await _store.GetItemAsync(itemId);
    if (item.AvailableQuantity < quantity)
        return ReservationResult.InsufficientQuantity;
    // ...
}
```

The service operates on "items" and "quantities" without knowing if it's managing products, licenses, medical supplies, or equipment.

### When to Apply

- **Utility services** (inventory, fulfillment, notifications, payments): SHOULD be domain-agnostic
- **Domain services** (order-service, subscription-service, rental-service): Own their domain; use domain-specific identifiers internally

### Choreography Integration

Domain choreography transformations map domain-specific IDs to the generic `referenceId`:

```jsonata
/* order-confirmed → create-shipment transformation */
{
  "referenceId": orderId,        /* Map domain ID to neutral ID */
  "customerId": customerId,
  "shippingAddress": shippingAddress
}
```

## Compliance Summary

A SPAS-compliant service MUST:

- Align to a single bounded context (declarative; conceptual validation only)
- Provide service definition (gRPC proto or HTTP OpenAPI) and event contracts
- Reference transformation mapping artifacts (external files) used in choreography (instead of "provide schemas for mapping")
- Package as OCI image with health endpoints
- Provide `spas.json` metadata (including contracts and security declarations)

Machine‑verifiable items: Service definition presence, event contract list, image reference, health endpoint declaration, metadata schema validity.
Conceptual items: bounded context alignment.

## Related Documents

- [Service Contract](04-service-contract.md)
- [Service Metadata](06-service-metadata.md)
- [Communication Model](../protocol/07-communication-model.md)
