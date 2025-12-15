---
description: AI-assisted choreography composition for SPAS domain workspaces
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Analyze pulled service contracts and generate choreography configuration with transformations for the **public** domain workspace.

## Responsibilities

1. **Contract Analysis**: Parse service metadata from `./examples/ecommerce/public/services/*/spas.json`
2. **Event Matching**: Identify semantic matches between published/subscribed events
3. **Choreography Generation**: Propose topic mappings and flow definitions
4. **Transformation Generation**: Create JSONata transformation files
5. **Iterative Refinement**: Confirm with developer, iterate based on feedback

## Workspace Structure

Starts at `./examples/ecommerce`

```
public/
├── choreography.yaml              # Choreography configuration (you modify this)
├── services/                      # Pulled service metadata (read-only)
│   └── <service-name>/
│       ├── spas.json              # Service contract
│       └── schemas/               # Schemas (preserves archive structure)
│           ├── endpoints/         # Endpoint request/response schemas
│           │   └── <endpoint>.schema.json
│           └── events/            # Event payload schemas
│               └── <event-type>.schema.json
└── transformations/               # JSONata files (you create these)
    └── <service-name>/
        ├── inbound-<event>.jsonata
        └── outbound-<event>.jsonata
```

## Workflow

### Step 1: Validate Workspace

Before any operation, verify:
- `./examples/ecommerce/public/choreography.yaml` exists
- `./examples/ecommerce/public/services/` directory exists with at least one service

If invalid:
```
Error: Not in a valid domain workspace.
Run `spas-compose init public` first, then `spas-compose services pull`.
```

### Step 2: Analyze Services

When asked to analyze services:
1. Read `./examples/ecommerce/public/services/<service-name>/spas.json` for each service
2. Extract: `id`, `version`, `boundedContext`, `events.published[]`, `events.subscribed[]`
3. Read schemas from `./examples/ecommerce/public/services/<service-name>/schemas/`

**Output Format:**
```
📦 order-service (1.0.0) - orders bounded context
  Published: OrderCreated, OrderCancelled
  Subscribed: PaymentReceived

📦 fulfillment-service (1.0.0) - fulfillment bounded context  
  Published: FulfillmentCompleted
  Subscribed: OrderCreated ← matches order-service.OrderCreated ✓
```

### Step 3: Propose Choreography

Generate choreography.yaml following schema:
```yaml
version: "1.0"
domain: public

flows:
  <flow-name>:
    description: "<description>"
    participants:
      - <service-name>
    events:
      - source: <publishing-service>
        event: <EventType>
        topic: <topic-name>
        targets:
          - service: <subscribing-service>
            transform: transformations/<service>/inbound-<event>.jsonata
```

**Ask:** "Confirm choreography changes? (yes/no/feedback)"

### Step 4: Generate Transformations

Create JSONata files at `./examples/ecommerce/public/transformations/<service>/*.jsonata`:
```jsonata
/* inbound-order-created.jsonata */
/* Transforms OrderCreated (order-service) → FulfillmentRequest (fulfillment-service) */
{
  "orderId": orderId,
  "items": items.{ "sku": productId, "qty": quantity },
  "priority": priority = "express" ? "high" : "normal"
}
```

**Ask:** "Confirm transformation? (yes/no/feedback)"

### Step 5: Next Steps

After completion, suggest:
```
✓ Choreography complete

Next steps:
  • Validate: spas-compose choreography build --dry-run
  • Build: spas-compose choreography build --docker  
  • Run: docker compose up
```

## Constraints

| Constraint | Behavior |
|------------|----------|
| **Read-only services/** | NEVER modify files in `./examples/ecommerce/public/services/` |
| **Preserve existing flows** | When adding flows, preserve all existing flows |
| **Valid JSONata** | All .jsonata files must have valid syntax |
| **Confirm before write** | ALWAYS wait for explicit confirmation |
| **Kebab-case naming** | Topics and file names use lowercase-hyphenated format |

## Error Handling

| Error | Response |
|-------|----------|
| No choreography.yaml | "Error: Workspace not initialized. Run `spas-compose init` first." |
| No services pulled | "Error: No services found. Run `spas-compose services pull` first." |
| Service not found | "Error: Service '<name>' not found in services/ directory." |
| Schema mismatch | "Warning: Cannot auto-generate transformation. Manual mapping required." |

## Example Prompts

```
/spas.compose Analyze order-service and fulfillment-service

/spas.compose Generate transformation for OrderCreated to fulfillment-service

/spas.compose Review choreography.yaml and identify missing transformations

/spas.compose Add notification-service to order-fulfillment flow
```

## Sidecar Configuration Mapping

The choreography.yaml flows generate sidecar configuration files. Use the schema at `./examples/ecommerce/public/.spas/schemas/sidecar-config-v1.schema.json` to understand the mapping:

| Choreography Field | Sidecar Config Path | Description |
|-------------------|---------------------|-------------|
| `flows.*.events[].topic` | `inbound[].topic` | Topic name for event subscription |
| `flows.*.events[].targets[].transform` | `inbound[].transform` | JSONata file path |
| `flows.*.events[].targets[].service` | (routing) | Determines which config file |
| Service endpoint from spas.json | `inbound[].invokeEndpoint` | HTTP path on target service |
| `flows.*.events[].source` + event | `outbound[].topic` + `eventType` | Publishing config |

**InboundEntry kinds:**
- `kind: "event"` - Pub/sub subscription (requires `topic`)
- `kind: "command"` - Request-response (requires `command`)

## References

- [./examples/ecommerce/public/.spas/schemas/sidecar-config-v1.schema.json](./examples/ecommerce/public/.spas/schemas/sidecar-config-v1.schema.json)
- [specs/005-spas-compose-cli/](specs/005-spas-compose-cli/)
- [principles/component/14-domain-choreography.md](principles/component/14-domain-choreography.md)
- [ADR-037: AI-in-the-loop composition](principles/appendix/28-decision-log.md)
