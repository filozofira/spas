# subscription-order

**SPAS Domain Workspace**

This workspace contains choreography configuration for composing SPAS services into a domain context.

## Choreography

```mermaid
flowchart TD
    START((Start)) --> sub
    
    sub[subscription-service]
    ord[order-service]
    inv[inventory-service]
    
    sub -->|1. subscription-created| ord
    ord -->|2. order-created| inv
    inv -->|3. stock-reserved| ord
    ord -->|4. order-confirmed| sub
    
    sub --> END((End))
```

## Structure

```
subscription-order/
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

- subscription-service 1.0.0
- order-service 1.0.0
- inventory-service 1.0.0

## Configuration

Repository configuration (including `SPAS_REPOSITORY_URL` and `--repo`) is documented in [spas-compose CLI](../../../components/cli/spas-compose/README.md).

## Documentation

See also: [spas-compose CLI](../../../components/cli/spas-compose/README.md) and [Domain Choreography](../../../principles/component/14-domain-choreography.md).
