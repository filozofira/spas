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
/spas.compose Analyze order-service and fulfillment-service contracts.
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
