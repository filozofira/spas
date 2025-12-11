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

## SPAS Service metadata (Simplified for PoC)

```yaml
# Example: payment-service/spas-metadata.yaml
apiVersion: "spas.io/v1alpha1"
kind: "Service"
metadata:
  name: "payment-service"
  version: "1.2.0"
  description: "Handles payment processing and refunds"
  capabilities: ["process-payment", "refund-payment"]

spec:   
  inbound:
    endpoints:
      - path: "/complete-payment"
        method: "POST"
        eventType: "OrderCreated"
        schema: "schemas/order_created_v1.json"
  
  outbound:
    events:
      - eventType: "PaymentCompleted" 
        schema: "schemas/payment_completed_v1.json"

deployment:
  image:
    repository: "acme/payment-service"
    tag: "1.2.0"

security:
  level: "high"
  dataClassification: "pii"
  network:
    enclosure: "strict"
    allowedEgress: ["api.stripe.com:443"]
```

## Related Documents

- [Domain Choreography](../component-specification/14-domain-choreography.md)
- [CLI Specification](../component-specification/13-cli-specification.md)
- [Glossary](27-glossary.md)
