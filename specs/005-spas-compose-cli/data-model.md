# Data Model: spas-compose CLI

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

The spas-compose CLI operates on four key entities: Domain Workspace, Choreography, Transformation, and Pulled Service. These entities exist as local filesystem structures with specific conventions.

---

## Entities

### Domain Workspace

The root folder created by `spas-compose init` containing all composition artifacts.

```text
<domain-name>/
├── README.md                           # Workflow instructions, command reference
├── choreography.yaml                   # Choreography configuration
├── services/                           # Pulled service metadata
│   └── <service-name>/
│       ├── spas.json
│       └── schemas/
└── choreography/
    └── transformations/                # JSONata transformation files
        └── <service-name>/
            ├── inbound-<event>.jsonata
            └── outbound-<event>.jsonata
```

**Fields**:

| Field          | Type            | Required | Description                                     |
| -------------- | --------------- | -------- | ----------------------------------------------- |
| `name`         | string          | Yes      | Domain name (folder name), lowercase-hyphenated |
| `path`         | string          | Yes      | Absolute filesystem path                        |
| `services`     | PulledService[] | No       | List of pulled services                         |
| `choreography` | Choreography    | No       | Loaded choreography configuration               |

**Validation Rules**:

- Name must match pattern `^[a-z][a-z0-9-]*[a-z0-9]$`
- Path must be writable
- README.md must exist for valid workspace

---

### Choreography

YAML configuration defining service interactions, event routing, and transformation references.

```yaml
# choreography.yaml
version: "1.0"
domain: e-commerce

flows:
  order-fulfillment:
    description: "Order to fulfillment processing flow"
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

  fulfillment-notification:
    description: "Fulfillment completion notification"
    participants:
      - fulfillment-service
      - notification-service
    events:
      - source: fulfillment-service
        event: FulfillmentCompleted
        topic: fulfillment
        targets:
          - service: notification-service
            transform: transformations/notification-service/inbound-fulfillment-completed.jsonata

infrastructure:
  redis:
    enabled: true
  zipkin:
    enabled: true
```

**Fields**:

| Field            | Type              | Required | Description                      |
| ---------------- | ----------------- | -------- | -------------------------------- |
| `version`        | string            | Yes      | Schema version (currently "1.0") |
| `domain`         | string            | Yes      | Domain context name              |
| `flows`          | Map<string, Flow> | Yes      | Named choreography flows         |
| `infrastructure` | Infrastructure    | No       | Infrastructure configuration     |

**Flow Fields**:

| Field          | Type         | Required | Description                         |
| -------------- | ------------ | -------- | ----------------------------------- |
| `description`  | string       | No       | Human-readable flow description     |
| `participants` | string[]     | Yes      | Service names participating in flow |
| `events`       | EventRoute[] | Yes      | Event routing definitions           |

**EventRoute Fields**:

| Field     | Type     | Required | Description             |
| --------- | -------- | -------- | ----------------------- |
| `source`  | string   | Yes      | Publishing service name |
| `event`   | string   | Yes      | Event type name         |
| `topic`   | string   | Yes      | Message topic name      |
| `targets` | Target[] | Yes      | Subscribing services    |

**Target Fields**:

| Field       | Type   | Required | Description                                                 |
| ----------- | ------ | -------- | ----------------------------------------------------------- |
| `service`   | string | Yes      | Subscribing service name                                    |
| `transform` | string | No       | Path to JSONata transformation file (relative to workspace) |

**Validation Rules**:

- All `participants` must have corresponding pulled service in `services/` folder
- All `transform` paths must reference existing `.jsonata` files
- `source` and `targets[].service` must be listed in `participants`

---

### Transformation

JSONata expression file that transforms event payloads between service internal schemas and domain schemas.

```jsonata
/* inbound-order-created.jsonata */
/* Transforms OrderCreated (domain) → FulfillmentRequest (internal) */
{
  "fulfillmentId": $uuid(),
  "orderId": orderId,
  "items": items.{
    "sku": productId,
    "quantity": quantity,
    "warehouse": "default"
  },
  "shippingAddress": {
    "line1": customer.address.street,
    "city": customer.address.city,
    "postalCode": customer.address.zip
  },
  "priority": priority = "express" ? "high" : "normal"
}
```

**Fields**:

| Field         | Type                    | Required | Description                       |
| ------------- | ----------------------- | -------- | --------------------------------- |
| `path`        | string                  | Yes      | Relative path from workspace root |
| `serviceName` | string                  | Yes      | Target service (from folder name) |
| `direction`   | "inbound" \| "outbound" | Yes      | Transform direction               |
| `eventType`   | string                  | Yes      | Event type being transformed      |
| `expression`  | string                  | Yes      | JSONata expression content        |

**Naming Convention**:

- Inbound: `inbound-<event-type-kebab>.jsonata`
- Outbound: `outbound-<event-type-kebab>.jsonata`

**Validation Rules**:

- Must be syntactically valid JSONata
- File must exist at referenced path
- Located in `transformations/<service-name>/`

---

### Pulled Service

Local copy of service metadata and schemas downloaded from SPAS Repository.

```text
services/<service-name>/
├── spas.json                   # Full service metadata
└── schemas/
    ├── OrderCreated.schema.json
    ├── OrderUpdated.schema.json
    └── ...
```

**spas.json Structure** (subset relevant to composition):

```json
{
  "id": "order-service",
  "version": "1.0.0",
  "boundedContext": "orders",
  "events": {
    "published": [
      {
        "name": "OrderCreated",
        "schema": "schemas/OrderCreated.schema.json"
      }
    ],
    "subscribed": [
      {
        "name": "PaymentReceived",
        "schema": "schemas/PaymentReceived.schema.json"
      }
    ]
  }
}
```

**Fields**:

| Field      | Type            | Required | Description                 |
| ---------- | --------------- | -------- | --------------------------- |
| `name`     | string          | Yes      | Service name (folder name)  |
| `version`  | string          | Yes      | Semver version pulled       |
| `metadata` | ServiceMetadata | Yes      | Parsed spas.json content    |
| `schemas`  | Schema[]        | No       | Event/message schemas       |
| `pulledAt` | Date            | Yes      | When the service was pulled |

**Validation Rules**:

- `spas.json` must be valid against `runtime-metadata-v1.schema.json`
- Service name must match `id` field in spas.json
- All referenced schemas must exist in `schemas/` folder

---

## State Transitions

### Domain Workspace Lifecycle

```
[empty directory]
       │
       ▼ spas-compose init
[initialized workspace]
       │ README.md, choreography.yaml (empty)
       │
       ▼ spas-compose services pull (1..n)
[services pulled]
       │ services/<name>/spas.json + schemas/
       │
       ▼ /spas.compose (AI agent)
[choreography composed]
       │ choreography.yaml (flows), transformations/*.jsonata
       │
       ▼ spas-compose choreography deploy --docker
[deployment generated]
         docker-compose.yaml ready to run
```

---

## References

- [spec.md](./spec.md) — Functional requirements and acceptance scenarios
- [principles/component/14-domain-choreography.md](../../principles/component/14-domain-choreography.md) — Choreography patterns
- [components/repository/schemas/runtime-metadata-v1.schema.json](../../components/repository/schemas/runtime-metadata-v1.schema.json) — Service metadata schema
