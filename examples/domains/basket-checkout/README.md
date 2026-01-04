# basket-checkout

## Choreography Flows

### Flow: Basket Management

**Description**: Customer manages shopping basket items (terminal events for audit/analytics)

```mermaid
---
title: Basket Management
---
flowchart LR
    Start([Customer]) --> BS[basket-service]
    BS -->|basket-created| End1([Basket Ready])
    BS -->|item-added| End2([Item Added])
    BS -->|item-removed| End3([Item Removed])
```

### Flow: Order Fulfillment

**Description**: Complete checkout flow from basket through shipment creation

```mermaid
---
title: Order Fulfillment
---
flowchart LR
    Start([Customer]) --> BS[basket-service]
    BS -->|checkout-initiated| OS[order-service]
    OS -->|order-created| IS[inventory-service]
    IS -->|stock-reserved| OS2[order-service]
    IS -->|stock-depleted| BS2[basket-service]
    OS2 -->|order-confirmed| FS[fulfillment-service]
    OS2 -->|order-confirmed| BS3[basket-service]
    FS -->|shipment-created| OS3[order-service]
    OS3 --> End([Order Shipped])
```

### Flow: Shipment Tracking

**Description**: Update order status as shipment progresses through fulfillment lifecycle

```mermaid
---
title: Shipment Tracking
---
flowchart LR
    Start([Carrier/Warehouse]) --> FS[fulfillment-service]
    FS -->|shipment-status-changed| OS[order-service]
    OS --> End([Status Updated])
```

### Flow: Order Cancellation

**Description**: Compensating flow to release reserved inventory when order cancelled

```mermaid
---
title: Order Cancellation
---
flowchart LR
    Start([Customer/System]) --> OS[order-service]
    OS -->|order-cancelled| IS[inventory-service]
    IS -->|stock-released| End([Inventory Released])
```

### Flow: Product Management

**Description**: Initialize inventory tracking when new products added to catalog

```mermaid
---
title: Product Management
---
flowchart LR
    Start([Admin]) --> PS[product-service]
    PS -->|product-added| IS[inventory-service]
    IS -->|inventory-item-added| End([Inventory Initialized])
```

---

**SPAS Domain Workspace**

This workspace contains choreography configuration for composing SPAS services into a domain context.

## Structure

```
basket-checkout/
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
/spas.compose DOMAIN:basket-checkout Analyze order-service and fulfillment-service contracts.
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
