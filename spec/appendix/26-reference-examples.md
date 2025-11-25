# Reference Examples

## Order Service in Telecom vs Retail

- Same bounded context and internal schemas
- Different domain events and topics
- Different `choreography.yaml` bindings

## Example Choreography (snippet)

```yaml
services:
  - id: order-service
    version: 1.0.0
routing:
  order.placed.v1: retail.orders.order-placed
mappings:
  inbound:
    retail.orders.order-placed: internal.OrderPlaced
  outbound:
    internal.OrderConfirmed: retail.orders.order-confirmed
```

## Related Documents

- [Adaptation Protocol](../protocol-specification/10-adaptation-protocol.md)
- [CLI Specification](../tooling/17-cli-specification.md)
- [Glossary](27-glossary.md)
