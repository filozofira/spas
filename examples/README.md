# SPAS Examples

End-to-end demonstrations of the SPAS framework in realistic scenarios.

---

## E-Commerce Domain Example

**Status**: 🔨 Design Phase  
**Branch**: `phase5-example-design`

This example demonstrates the complete SPAS framework in a multi-service e-commerce domain.

---

## Design Decisions

### 1. High-Level Requirements

**Goal**: What does this example prove about SPAS?

| # | Requirement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | **Service reuse across domains** — Same services (e.g., order-service, product-service) deployed to multiple domain contexts with different choreographies and transformations | **Mandatory** | Core SPAS value proposition: services don't change when deployed to different domains |
| 2 | **Repository as service catalogue** — Demonstrate Repository API for service discovery and metadata browsing | Optional | Shows Repository is more than storage; enables service marketplace patterns |
| 3 | **End-to-end observability** — Single W3C Trace ID flows through entire event chain, visible in Zipkin | Recommended | Proves choreography doesn't break distributed tracing |
| 4 | **Single-command deployment workflow** — From `spas-compose init` to `docker compose up` with minimal manual steps | Recommended | Validates toolchain integration and developer experience |

**Scenario Summary**:

Two domains share the same reusable services but compose them differently:

| Domain | Purpose | How it uses shared services |
|--------|---------|----------------------------|
| **Public E-Commerce** | Customers browse & order products | `OrderCreated` → `orders-requested` → triggers fulfillment |
| **B2B Subscription** | Businesses subscribe to recurring product deliveries | `OrderCreated` → `subscriptions-requested` → triggers recurring billing & scheduled fulfillment |

Same `order-service`, same `product-service` — different choreographies, different transformations, different downstream consumers.

---

### 2. Scope Boundaries

**In Scope**:

| Category | Items |
|----------|-------|
| **Shared Services** | 2 reusable SPAS services with SDK integration (extensible to more) |
| **Stub Services** | 2 mock/stub downstream services (replaceable with real SPAS services later) |
| **Domain Contexts** | 2 domains with separate choreography.yaml demonstrating different compositions |
| **Choreography Artifacts** | Topic mappings, JSONata transformations, sidecar configs for each domain |
| **Deployment** | Docker Compose for each domain (infrastructure: Redis, Zipkin, sidecars) |
| **Observability** | Zipkin trace visualization showing cross-service correlation |
| **State Inspection** | REST endpoints on each service to view in-memory state (e.g., `GET /orders`) |
| **Documentation** | README walkthroughs for each domain showing the full workflow |
| **Repository Integration** | Services published to Repository; domains pull from Repository |

**Out of Scope**:

| Category | Rationale |
|----------|-----------|
| **Real business logic** | Services use minimal in-memory state; focus is on SPAS integration, not e-commerce implementation |
| **Persistent storage** | In-memory only; restart = clean state *(SQLite as optional future enhancement)* |
| **UI/Frontend** | No web interface; state inspection via REST endpoints and curl/Postman |
| **Authentication/Authorization** | Identity in payload (PoC pattern); no real auth implementation |
| **Kubernetes deployment** | Docker Compose only; K8s is production concern |
| **Contract testing** | Deferred from PoC per constitution |
| **Multiple languages** | All services in one language initially *(future extensibility for SDK demos in Java/Node)* |
| **Performance testing** | Focus is correctness, not scale |

---

### 3. Service Portfolio

**Services**:

| Service | Bounded Context | Publishes | Subscribes |
| ------- | --------------- | --------- | ---------- |
| _TBD_   | _TBD_           | _TBD_     | _TBD_      |

**Event Flows**:

- _TBD_

---

### 4. Technology Decisions

| Decision             | Choice | Rationale |
| -------------------- | ------ | --------- |
| Service Language     | _TBD_  | _TBD_     |
| Business Logic Depth | _TBD_  | _TBD_     |

---

### 5. Folder Structure

```text
examples/
└── e-commerce/
    └── TBD
```text

---

### 6. Development Phases

| Phase | Description | Deliverables |
| ----- | ----------- | ------------ |
| 1     | _TBD_       | _TBD_        |

---

### 7. Success Criteria

- [ ] _TBD_

---

## Related Documents

- [TASKS.md](../TASKS.md) — Phase 5 overview
- [principles/02-architecture-overview.md](../principles/02-architecture-overview.md) — System architecture
- [principles/component/14-domain-choreography.md](../principles/component/14-domain-choreography.md) — Choreography patterns
- [prototypes/spas-sidecar-prototype/README.md](../prototypes/spas-sidecar-prototype/README.md) — Working prototype reference
