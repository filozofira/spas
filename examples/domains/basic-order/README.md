# basic-order

**SPAS Domain Workspace**

This workspace contains choreography configuration for composing SPAS services into a domain context.

## Choreography Flow

```mermaid
flowchart LR
    OS[order-service] -->|order-created| IS[inventory-service]
    IS -->|stock-reserved| OS
    OS -->|order-confirmed| END((done))
```

**Flow Description:**
1. **order-created** (order-service) → reserve-stock (inventory-service)
   - When a new order is created, it signals downstream services to reserve stock
2. **stock-reserved** (inventory-service) → confirm-order (order-service)
   - After inventory reservation succeeds, the order is confirmed
3. **order-confirmed** (order-service) → terminal event
   - Order confirmation triggers fulfillment (future service integration)

## Structure

```
basic-order/
├── README.md                    # This file
├── choreography.yaml            # Choreography configuration
├── services/                    # Pulled service metadata
├── transformations/             # JSONata transformation files
└── .spas/
    └── schemas/                 # JSON Schemas for validation/AI
        ├── choreography-v1.schema.json
        ├── runtime-metadata-v1.schema.json
        └── sidecar-config-v1.schema.json
```

## Workflow

Follow the standard workflow in [spas-compose CLI](../../../components/cli/spas-compose/README.md).

Typical services for this domain:

- order-service 1.0.0
- inventory-service 1.0.0

## Configuration

Repository configuration (including `SPAS_REPOSITORY_URL` and `--repo`) is documented in [spas-compose CLI](../../../components/cli/spas-compose/README.md).

## Documentation

See also: [spas-compose CLI](../../../components/cli/spas-compose/README.md) and [Domain Choreography](../../../principles/component/14-domain-choreography.md).
