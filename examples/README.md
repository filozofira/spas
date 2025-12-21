# SPAS Examples

End-to-end demonstrations of the SPAS framework in realistic scenarios.

See [Domains](./domains/README.md)

---

## Planned: Fulfillment Service (Java)

> **IN PROGRESS**: A Java-based fulfillment service is being developed to extend the ecommerce choreography. See [FULFILLMENT-SERVICE-DESIGN.md](FULFILLMENT-SERVICE-DESIGN.md) for the complete design.

**Purpose**: Demonstrate the Java SPAS SDK in a real-world choreography scenario

**Key Features**:
- Built with Java SPAS SDK (`components/sdk/java`)
- Extends ecommerce domain with order fulfillment flow
- Subscribes to `order-confirmed` events
- Publishes `shipment-created` and `fulfillment-completed` events
- Demonstrates trace context propagation across mixed .NET/Java services

_This note will be removed once the service is implemented._
