# order-fulfillment

## Happy Path: Successful Order Fulfillment

```mermaid
flowchart LR
    Start([Customer]) --> OS[order-service]
    OS -->|order-created| IS[inventory-service]
    IS -->|stock-reserved| OS
    OS -->|order-confirmed| FS[fulfillment-service]
    FS -->|shipment-created| OS
    FS -->|shipment-status-changed| OS
    OS --> End([Order Complete])
```

## Error Path: Stock Depleted

```mermaid
flowchart LR
    Start([Customer]) --> OS[order-service]
    OS -->|order-created| IS[inventory-service]
    IS -->|stock-depleted| End([Notify Customer])
```

## Terminal Events

The following events are published for audit, logging, and future integration but have no consumers in this choreography:

- **order-cancelled** (order-service) - Published when an order is cancelled
- **stock-released** (inventory-service) - Emitted when reserved stock is released back to available inventory
- **inventory-item-added** (inventory-service) - Emitted when inventory tracking is initialized for a new item

**SPAS Domain Workspace**

This workspace contains choreography configuration for composing SPAS services into a domain context.

## Structure

```
order-fulfillment/
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

### 1. Pull Services

Download service metadata from SPAS Repository:

```bash
spas-compose services pull <service-name> <version>
```

**Example:**

```bash
spas-compose services pull order-service 1.0.0
spas-compose services pull fulfillment-service 1.0.0
```

### 2. Compose Choreography

Use the `/spas.compose` agent prompt to analyze service contracts and generate choreography:

```
/spas.compose DOMAIN:order-fulfillment Analyze order-service and fulfillment-service contracts.
Propose topic mappings and generate transformations.
```

The agent will:
- Parse service contracts from `services/*/spas.json`
- Propose event mappings and topic routes
- Generate JSONata transformation files
- Update `choreography.yaml`

### 3. Build

Build Docker Compose deployment:

```bash
spas-compose choreography build --dry-run   # Validate
spas-compose choreography build --docker    # Generate docker-compose.yaml
```

### 4. Run

Start services:

```bash
docker compose up
```

## Configuration

### Repository URL

Set repository URL via:
- `--repo` flag: `spas-compose services pull order-service 1.0.0 --repo http://repo.example.com`
- Environment: `export SPAS_REPOSITORY_URL=http://repo.example.com`
- Default: `http://localhost:3000`

## Documentation

- [spas-compose CLI](../../components/cli/spas-compose/README.md)
- [SPAS Principles](../../principles/README.md)
- [Domain Choreography](../../principles/component/14-domain-choreography.md)
