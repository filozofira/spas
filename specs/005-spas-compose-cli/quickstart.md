# Quickstart: spas-compose CLI

Get started with domain choreography composition using spas-compose.

## Prerequisites

- Node.js 20 LTS or later
- SPAS Repository running (default: `http://localhost:3000`)
- Docker and Docker Compose (for deployment)
- Published services in the Repository (via `spas-service publish`)

## Installation

```bash
# From components/cli/spas-compose directory
npm install
npm run build
npm link

# Verify installation
spas-compose --version
```

## Workflow Overview

```
1. Initialize workspace → 2. Pull services → 3. Compose (AI) → 4. Deploy
```

---

## Step 1: Initialize Domain Workspace

Create a new domain folder with the required structure:

```bash
spas-compose init e-commerce
cd e-commerce
```

This creates:
```
e-commerce/
├── README.md                    # Workflow instructions
├── choreography.yaml            # Empty choreography config
├── services/                    # For pulled service metadata
└── transformations/          # For JSONata files
```

An agent prompt file is also created at `.github/agents/spas-compose.md` (at project root).

---

## Step 2: Pull Service Metadata

Download service contracts from the Repository:

```bash
# Pull each service you want to compose
spas-compose services pull order-service 1.0.0
spas-compose services pull fulfillment-service 1.0.0
spas-compose services pull notification-service 1.0.0

# Custom repository URL
spas-compose services pull order-service 1.0.0 --repo http://repo.example.com:3000
```

After pulling, your workspace has:
```
e-commerce/
├── services/
│   ├── order-service/
│   │   ├── spas.json
│   │   └── schemas/
│   │       └── events/
│   │           ├── OrderCreated.schema.json
│   │           └── OrderUpdated.schema.json
│   ├── fulfillment-service/
│   │   ├── spas.json
│   │   └── schemas/
│   │       └── events/
│   │           └── FulfillmentCompleted.schema.json
│   └── notification-service/
│       └── ...
```

---

## Step 3: Compose Choreography (AI-Assisted)

Use the AI agent to analyze service contracts and generate choreography:

```
/spas.compose Analyze contracts for order-service and fulfillment-service.
Create a flow where OrderCreated events trigger fulfillment processing.
```

The AI agent will:
1. Read service metadata from `services/` folder
2. Analyze event schemas and find compatible patterns
3. Propose `choreography.yaml` updates
4. Wait for your confirmation or feedback
5. Generate JSONata transformation files
6. Iterate until you confirm

### Manual Composition

You can also edit `choreography.yaml` manually:

```yaml
version: "1.0"
domain: e-commerce

flows:
  order-fulfillment:
    description: "Route orders to fulfillment"
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: OrderCreated
        topic: orders
        targets:
          - service: fulfillment-service
            transform: transformations/fulfillment-service/inbound-order-created.jsonata
```

And create transformation files:

```jsonata
/* transformations/fulfillment-service/inbound-order-created.jsonata */
{
  "fulfillmentId": $uuid(),
  "orderId": orderId,
  "items": items,
  "shippingAddress": customer.address
}
```

---

## Step 4: Deploy to Docker Compose

Generate the Docker Compose deployment:

```bash
# Validate first (dry run)
spas-compose choreography deploy --docker --dry-run

# Generate docker-compose.yaml
spas-compose choreography deploy --docker
```

This generates a complete `docker-compose.yaml` with:
- Service containers for each participating service
- Sidecar containers with transformation volume mounts
- Redis for event streaming
- Zipkin for distributed tracing

### Run the Deployment

```bash
docker compose up
```

Access points:
- Services: `http://localhost:800X`
- Sidecars: `http://localhost:900X`
- Zipkin UI: `http://localhost:9411`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPAS_REPOSITORY_URL` | `http://localhost:3000` | Repository service URL |
| `SPAS_COMPOSE_VERBOSE` | `false` | Enable verbose output |

---

## Common Issues

### "Service not found in repository"

Ensure the service is published:
```bash
cd /path/to/order-service
spas-service publish --service-host http://localhost:5000
```

### "Repository unreachable"

Check Repository is running:
```bash
curl http://localhost:3000/health
```

### "Invalid JSONata syntax"

Validate your transformation at https://try.jsonata.org/

---

## Next Steps

- Read [data-model.md](./data-model.md) for entity details
- See [contracts/cli-commands.md](./contracts/cli-commands.md) for full command reference
- Review [principles/component/14-domain-choreography.md](../../principles/component/14-domain-choreography.md) for choreography patterns
