# SPAS Examples

End-to-end demonstrations of the SPAS framework in realistic scenarios.

---

## E-Commerce Domain Example

**Status**: ✅ Phase 1 Complete | 🚧 Phase 2 In Progress  
**Branch**: `example/phase1`

This example demonstrates the complete SPAS framework in a multi-service e-commerce domain.

---

## Current Status (December 15, 2025)

### ✅ Phase 1: Core Services + Repository Integration - COMPLETE

**What's Done:**

- **6 Services Built & Containerized:**

  - `order-service` (.NET + SPAS SDK) - Published to Repository ✓
  - `inventory-service` (.NET + SPAS SDK) - Published to Repository ✓
  - `product-service` (.NET + SPAS SDK) - Published to Repository ✓
  - `fulfillment-service` (Node.js stub)
  - `subscription-service` (Node.js stub)
  - `api-gateway` (Node.js)

- **Docker Images:**

  - All services tagged as `spas-examples/*:1.0.0`
  - Images available in Docker Desktop with full SHA256 digests
  - Runtime metadata documented below for Repository republishing

- **Repository Integration:**

  - All SPAS services successfully published to Repository (<http://localhost:3000>)
  - **Critical Bug Fixed:** SDK schema generation updated from draft-04 to draft-07 (per ADR-039)
  - Schema validation passing in Repository

- **Verification:**
  - All 6 services start and respond successfully in Docker
  - Ports: order (5000), inventory (5001), product (5002), fulfillment (5003), subscription (5004), gateway (8080)
  - docker-compose.yml created in `examples/`

**Files Changed:**

- `components/sdk/dotnet/src/Spas.Sdk.Metadata/Schema/SchemaGenerator.cs` - Fixed draft-07 schema generation + test return type fix (Dec 15)
- `components/cli/spas-service/src/commands/publish.ts` - Fixed runtime metadata not being passed in normal publish mode (Dec 15)
- `components/cli/spas-service/src/services/publish-service.ts` - Updated publish() to accept runtime metadata (Dec 15)
- `examples/services/order-service/` - Complete service implementation
- `examples/services/inventory-service/` - Complete service implementation
- `examples/services/product-service/` - Complete service implementation
- `examples/stubs/fulfillment-service/` - Node.js stub
- `examples/stubs/subscription-service/` - Node.js stub
- `examples/gateways/api-gateway/` - Node.js gateway
- `examples/docker-compose.yml` - All services orchestration

### 🚧 Phase 2: E-Commerce Public Choreography - NEXT

**What's Needed:**

1. Use `spas-compose init` to create E-Commerce domain
2. Create `choreography.yaml` for public e-commerce flow
3. Generate sidecar configurations via `spas-compose choreography build`
4. Create domain-specific `docker-compose.yaml` in `examples/domains/ecommerce/public/`
5. Verify end-to-end flow: Client → Gateway → Order → Inventory → Fulfillment
6. Confirm Zipkin trace visualization shows W3C Trace Context propagation

**Reference:**

- Design: See "Event Flows" section below for E-Commerce sequence diagram
- CLI: `specs/005-spas-compose-cli/` for compose command reference
- Choreography: `principles/component/14-domain-choreography.md`

---

## Design Decisions

### 1. High-Level Requirements

**Goal**: What does this example prove about SPAS?

| #   | Requirement                                                                                                                                                                    | Priority      | Rationale                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------- |
| 1   | **Service reuse across domains** — Same services (e.g., order-service, product-service) deployed to multiple domain contexts with different choreographies and transformations | **Mandatory** | Core SPAS value proposition: services don't change when deployed to different domains |
| 2   | **Repository as service catalogue** — Demonstrate Repository API for service discovery and metadata browsing                                                                   | Optional      | Shows Repository is more than storage; enables service marketplace patterns           |
| 3   | **End-to-end observability** — Single W3C Trace ID flows through entire event chain, visible in Zipkin                                                                         | Recommended   | Proves choreography doesn't break distributed tracing                                 |
| 4   | **Single-command deployment workflow** — From `spas-compose init` to `docker compose up` with minimal manual steps                                                             | Recommended   | Validates toolchain integration and developer experience                              |

**Scenario Summary**:

Two domains share the same reusable services but compose them differently:

| Domain                | Purpose                                              | How it uses shared services                                                                     |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Public E-Commerce** | Customers browse & order products                    | `OrderCreated` → `orders-requested` → triggers fulfillment                                      |
| **B2B Subscription**  | Businesses subscribe to recurring product deliveries | `OrderCreated` → `subscriptions-requested` → triggers recurring billing & scheduled fulfillment |

Same `order-service`, same `product-service` — different choreographies, different transformations, different downstream consumers.

---

### 2. Scope Boundaries

**In Scope**:

| Category                   | Items                                                                          |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Shared Services**        | 2 reusable SPAS services with SDK integration (extensible to more)             |
| **Stub Services**          | 2 mock/stub downstream services (replaceable with real SPAS services later)    |
| **Domain Contexts**        | 2 domains with separate choreography.yaml demonstrating different compositions |
| **Choreography Artifacts** | Topic mappings, JSONata transformations, sidecar configs for each domain       |
| **Deployment**             | Docker Compose for each domain (infrastructure: Redis, Zipkin, sidecars)       |
| **Observability**          | Zipkin trace visualization showing cross-service correlation                   |
| **State Inspection**       | REST endpoints on each service to view in-memory state (e.g., `GET /orders`)   |
| **Documentation**          | README walkthroughs for each domain showing the full workflow                  |
| **Repository Integration** | Services published to Repository; domains pull from Repository                 |

**Out of Scope**:

| Category                         | Rationale                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Real business logic**          | Services use minimal in-memory state; focus is on SPAS integration, not e-commerce implementation |
| **Persistent storage**           | In-memory only; restart = clean state _(SQLite as optional future enhancement)_                   |
| **UI/Frontend**                  | No web interface; state inspection via REST endpoints and curl/Postman                            |
| **Authentication/Authorization** | Identity in payload (PoC pattern); no real auth implementation                                    |
| **Kubernetes deployment**        | Docker Compose only; K8s is production concern                                                    |
| **Contract testing**             | Deferred from PoC per constitution                                                                |
| **Multiple languages**           | All services in one language initially _(future extensibility for SDK demos in Java/Node)_        |
| **Performance testing**          | Focus is correctness, not scale                                                                   |

---

### 3. Service Portfolio

**SPAS Services (Shared/Reusable)**:

| Service               | Responsibility              | Publishes                        | Subscribes                                                |
| --------------------- | --------------------------- | -------------------------------- | --------------------------------------------------------- |
| **order-service**     | Order lifecycle management  | `OrderCreated`, `OrderConfirmed` | E-Commerce: HTTP via sidecar; B2B: `OrderRequested` event |
| **inventory-service** | Stock tracking, reservation | `StockReserved`, `StockDepleted` | `OrderCreated`                                            |
| **product-service**   | Product catalogue (browse)  | _(future: `ProductCreated`)_     | _(Phase 1: none)_                                         |

**Stub Services (Domain-Specific)**:

| Service                  | Domain     | Responsibility                    | Publishes               | Subscribes      |
| ------------------------ | ---------- | --------------------------------- | ----------------------- | --------------- |
| **fulfillment-service**  | E-Commerce | Logistics mock (pick, pack, ship) | `FulfillmentCompleted`  | `StockReserved` |
| **subscription-service** | B2B        | Recurring order mock              | `SubscriptionActivated` | `OrderCreated`  |

**Gateway (External to SPAS)**:

| Gateway         | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| **api-gateway** | Single codebase; sync vs async behavior determined by domain's sidecar-config.json |

| Domain     | Sidecar Mode     | Behavior                                                      |
| ---------- | ---------------- | ------------------------------------------------------------- |
| E-Commerce | HTTP proxy       | Gateway-sidecar → order-sidecar (HTTP); sync response         |
| B2B        | Event publishing | Gateway-sidecar → Redis → order-sidecar; returns 202 Accepted |

**Event Flows**:

**E-Commerce Domain (Sync Edge via Sidecar HTTP Proxy → Async Internal)**:

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant GW-Sidecar as gateway-sidecar
    participant Order-Sidecar as order-sidecar
    participant OrderService as order-service
    participant Redis
    participant Inv-Sidecar as inventory-sidecar
    participant InventoryService as inventory-service
    participant Fulfillment as fulfillment-stub

    Client->>Gateway: POST /orders
    Gateway->>GW-Sidecar: HTTP
    GW-Sidecar->>Order-Sidecar: HTTP (sync)
    Order-Sidecar->>OrderService: HTTP
    OrderService-->>Order-Sidecar: 201 Created
    Order-Sidecar-->>GW-Sidecar: response
    GW-Sidecar-->>Gateway: response
    Gateway-->>Client: 201 Created

    Order-Sidecar->>Redis: publish OrderCreated
    Redis->>Inv-Sidecar: OrderCreated
    Inv-Sidecar->>InventoryService: deliver event
    InventoryService-->>Inv-Sidecar: StockReserved
    Inv-Sidecar->>Redis: publish StockReserved
    Redis->>Fulfillment: StockReserved
    Fulfillment->>Redis: publish FulfillmentCompleted
```

**B2B Subscription Domain (Async Edge → Async Internal)**:

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant GW-Sidecar as gateway-sidecar
    participant Redis
    participant Order-Sidecar as order-sidecar
    participant OrderService as order-service
    participant Inv-Sidecar as inventory-sidecar
    participant InventoryService as inventory-service
    participant Subscription as subscription-stub

    Client->>Gateway: POST /orders
    Gateway->>GW-Sidecar: HTTP
    GW-Sidecar->>Redis: publish OrderRequested
    GW-Sidecar-->>Gateway: accepted
    Gateway-->>Client: 202 Accepted

    Redis->>Order-Sidecar: OrderRequested
    Order-Sidecar->>OrderService: deliver event
    OrderService-->>Order-Sidecar: OrderCreated
    Order-Sidecar->>Redis: publish OrderCreated

    Redis->>Inv-Sidecar: OrderCreated
    Inv-Sidecar->>InventoryService: deliver event
    InventoryService-->>Inv-Sidecar: StockReserved
    Inv-Sidecar->>Redis: publish StockReserved

    Redis->>Subscription: StockReserved
    Subscription->>Redis: publish SubscriptionActivated
```

**Query Pattern** (both domains):

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant GW-Sidecar as gateway-sidecar
    participant Prod-Sidecar as product-sidecar
    participant ProductService as product-service

    Client->>Gateway: GET /products
    Gateway->>GW-Sidecar: HTTP
    GW-Sidecar->>Prod-Sidecar: HTTP (sync)
    Prod-Sidecar->>ProductService: HTTP
    ProductService-->>Prod-Sidecar: products[]
    Prod-Sidecar-->>GW-Sidecar: response
    GW-Sidecar-->>Gateway: response
    Gateway-->>Client: 200 OK
```

**Design Decisions**:

| Decision                 | Choice                                     | Rationale                                                           |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| Gateway per domain       | Yes                                        | Domains represent different organizations; separate infrastructure  |
| Gateway technology       | Custom Node.js (Express/Fastify)           | Aligns with sidecar (both Node.js); can share event publishing code |
| Sync vs Async edge       | E-Commerce sync (HTTP), B2B async (events) | Demonstrates both patterns; same services handle both               |
| Sidecar-to-sidecar HTTP  | E-Commerce uses HTTP between sidecars      | Principles-compliant; gateway never talks directly to service       |
| inventory-service naming | inventory-service (not stock-service)      | Industry-standard naming; avoids "stock" ambiguity                  |

**Evolution Paths**:

| Enhancement                   | Description                                      | When          |
| ----------------------------- | ------------------------------------------------ | ------------- |
| Product sync to order-service | Choreography syncs products for validation       | After Phase 1 |
| Admin sub-domain (E-Commerce) | Product management CRUD                          | Future        |
| Request-reply in B2B          | Gateway waits for response event via correlation | Future        |
| Product browsing via CLI      | CLI → Gateway → product-service                  | Future        |

---

### 4. Technology Decisions

| Decision                    | Choice                     | Rationale                                                      |
| --------------------------- | -------------------------- | -------------------------------------------------------------- |
| **Service Language**        | .NET (C#)                  | SDK exists; validates SDK integration end-to-end               |
| **Gateway Language**        | Node.js (Express)          | Aligns with sidecar; can reuse event publishing patterns       |
| **Stub Language**           | Node.js                    | Lightweight; no SDK needed; fast to implement                  |
| **Business Logic Depth**    | Minimal in-memory state    | Focus is SPAS integration, not e-commerce logic                |
| **State Inspection**        | REST endpoints per service | `GET /orders`, `GET /products`, `GET /inventory` for debugging |
| **Event Transport**         | Redis Streams              | Already proven in prototype; CloudEvents format                |
| **Tracing**                 | Zipkin                     | W3C Trace Context propagation; visual trace inspection         |
| **Container Orchestration** | Docker Compose             | Per-domain compose files; no K8s in PoC                        |

---

### 5. Folder Structure

```text
examples/
├── README.md                              # Design decisions (this file)
│
├── services/                              # Shared SPAS services (.NET + SDK)
│   ├── order-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── spas.yaml                      # Service manifest
│   ├── inventory-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── spas.yaml
│   └── product-service/
│       ├── src/
│       ├── Dockerfile
│       └── spas.yaml
│
├── stubs/                                 # Domain-specific stubs (Node.js)
│   ├── fulfillment-service/
│   │   ├── index.js
│   │   └── Dockerfile
│   └── subscription-service/
│       ├── index.js
│       └── Dockerfile
│
├── gateways/                              # Custom gateway (Node.js)
│   └── api-gateway/                       # Single codebase; behavior via sidecar config
│       ├── index.js
│       └── Dockerfile
│
└── domains/                               # Domain deployments
    ├── ecommerce/                         # E-commerce organization
    │   ├── public/                        # Phase 1: customer-facing
    │   │   ├── choreography.yaml
    │   │   ├── sidecar-config.json        # HTTP proxy mode for gateway
    │   │   ├── docker-compose.yaml
    │   │   └── README.md                  # Domain walkthrough
    │   └── admin/                         # Future: product management
    │       └── (placeholder)
    │
    └── b2b/                               # B2B organization
        └── subscription/                  # Phase 1: recurring orders
            ├── choreography.yaml
            ├── sidecar-config.json        # Event publishing mode for gateway
            ├── docker-compose.yaml
            └── README.md                  # Domain walkthrough
```

**Notes**:

- `services/` contains reusable SPAS services; published to Repository
- `stubs/` contains domain-specific mocks; not published to Repository
- `gateways/` single api-gateway codebase; sync vs async determined by sidecar config
- `domains/` groups sub-domains by organization; each has its own choreography and sidecar config

---

### 6. Development Phases

| Phase | Description                            | Deliverables                                                                                                                                          |
| ----- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Core services + Repository integration | api-gateway, order-service, inventory-service, fulfillment-stub, subscription-stub; publish SPAS services to Repository; verify each starts in Docker |
| **2** | E-Commerce public                      | `spas-compose init` → `choreography build` → docker-compose.yaml; full end-to-end flow                                                                |
| **3** | B2B subscription domain                | Same CLI workflow, different choreography; proves service reuse                                                                                       |
| **4** | Documentation & polish                 | README walkthroughs, Zipkin trace screenshots, demo script                                                                                            |
| **5** | Product service (optional)             | Depends on time; decide after Phase 4                                                                                                                 |

**Phase 1 Details** (Services + Repository):

```mermaid
flowchart LR
    subgraph "Phase 1: Build & Publish"
        GW[api-gateway]
        O[order-service]
        I[inventory-service]
        FS[fulfillment-stub]
        SS[subscription-stub]
        R[(Repository)]
    end

    O -->|publish| R
    I -->|publish| R
    GW -.->|verify starts| Docker
    O -.->|verify starts| Docker
    I -.->|verify starts| Docker
    FS -.->|verify starts| Docker
    SS -.->|verify starts| Docker
```

**Phase 1 Verification Criteria**:

- [x] Each service/stub starts in Docker Desktop without errors
- [x] SPAS services (order, inventory, product) are SPAS-compliant (spas.json valid)
- [x] SPAS services published to Repository via `spas-service publish`

**Phase 1 Docker Images** (built and tagged):

For republishing services with runtime metadata:

```powershell
# order-service
spas-service publish http://localhost:5000 --repo http://localhost:3000 `
  --image-digest "your_sha256" `
  --image-repository "spas-examples/order-service" `
  --image-tag "1.0.0"

# inventory-service
spas-service publish http://localhost:5001 --repo http://localhost:3000 `
  --image-digest "your_sha256" `
  --image-repository "spas-examples/inventory-service" `
  --image-tag "1.0.0"

# product-service
spas-service publish http://localhost:5002 --repo http://localhost:3000 `
  --image-digest "your_sha256" `
  --image-repository "spas-examples/product-service" `
  --image-tag "1.0.0"
```

**Note:** Stub services (fulfillment-service, subscription-service) and api-gateway are not SPAS services and are not published to Repository.

**Phase 2 Details**:

> ⚠️ **CLI Smoke Test**: Phase 2 serves as integration verification for `spas-compose` CLI.
> If issues are found, fix CLI before proceeding. Per specs 005/008, all CLI tasks are marked complete.

---

### 7. Success Criteria

**Mandatory** (must pass for PoC success):

- [ ] **Reuse proven**: Same order-service and inventory-service deployed to both E-Commerce and B2B domains without code changes
- [ ] **Choreography differentiation**: Different `choreography.yaml` routes events to different downstream consumers
- [ ] **End-to-end trace**: Single W3C Trace ID visible in Zipkin across all services in a request flow
- [ ] **Docker Compose up**: Each domain starts with `docker compose up` and handles requests

**Recommended** (validates toolchain):

- [ ] **Repository publish**: Services published to Repository with manifests
- [ ] **CLI workflow**: `spas-compose init` + `choreography build` generates working artifacts
- [ ] **State inspection**: REST endpoints return in-memory state for debugging

**Demo Scenarios**:

| #   | Scenario                    | Expected Outcome                                                        |
| --- | --------------------------- | ----------------------------------------------------------------------- |
| 1   | POST order in E-Commerce    | Sync 201 response; Zipkin shows trace through inventory → fulfillment   |
| 2   | POST order in B2B           | Async 202 response; Zipkin shows trace through inventory → subscription |
| 3   | GET products (both domains) | Sync response with product list                                         |
| 4   | Restart and re-order        | State cleared; new order created (in-memory proof)                      |

---

## Related Documents

- [TASKS.md](../TASKS.md) — Phase 5 overview
- [principles/02-architecture-overview.md](../principles/02-architecture-overview.md) — System architecture
- [principles/component/14-domain-choreography.md](../principles/component/14-domain-choreography.md) — Choreography patterns
- [prototypes/spas-sidecar-prototype/README.md](../prototypes/spas-sidecar-prototype/README.md) — Working prototype reference
