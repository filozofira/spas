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

**Proposed Scenario** *(to be refined in Section 3)*:

Two domains share the same reusable services but compose them differently:

| Domain | Purpose | How it uses shared services |
|--------|---------|----------------------------|
| **Public E-Commerce** | Customers browse & order products | `OrderCreated` → `orders-requested` → triggers fulfillment |
| **B2B Subscription** | Businesses subscribe to recurring product deliveries | `OrderCreated` → `subscriptions-requested` → triggers recurring billing & scheduled fulfillment |

Same `order-service`, same `product-service` — different choreographies, different transformations, different downstream consumers.

---

### 2. Scope Boundaries

**In Scope**:

- _TBD_

**Out of Scope**:

- _TBD_

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
