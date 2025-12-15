# SPAS PoC Implementation Handoff Guide

**Purpose:** Enable agents to continue PoC implementation across machines without losing context.

---

## Agent Handoff Update (Dec 16, 2025)

This section documents the latest actions, any issues encountered, and the exact next steps so another agent can resume seamlessly.

### What Was Done (Phase 2 Complete)

- **Phase 2: E-Commerce Public Choreography - COMPLETE** (Dec 16, 2025)

  - Initialized E-Commerce domain workspace with `spas-compose init public`
  - Pulled services from Repository with `spas-compose services pull`
  - **Bug Fixed**: `spas-compose services pull` failed with "Failed to parse service archive" - was using `JSON.parse()` on ZIP binary
    - Added `adm-zip` dependency to spas-compose
    - Rewrote `parseServiceArchive()` in `repository-client.ts`
  - Created `choreography.yaml` with round-trip flow: OrderCreated → StockReserved → Order Confirmed
  - Generated sidecar configs via `spas-compose choreography build --docker`
  - Manually fixed multiple generator bugs (documented as FG05-FG08)
  - Added `StockReserved` handler to order-service for order confirmation
  - Verified end-to-end event flow working
  - Zipkin traces showing W3C Trace Context propagation

- **Files Changed/Created (Phase 2):**

  - `components/cli/spas-compose/src/services/repository-client.ts` - Fixed ZIP parsing with adm-zip
  - `components/cli/spas-compose/package.json` - Added adm-zip dependency
  - `examples/domains/ecommerce/public/choreography.yaml` - Event flow definition
  - `examples/domains/ecommerce/public/docker-compose.yaml` - Domain deployment (manually fixed)
  - `examples/domains/ecommerce/public/config.order-service.json` - Sidecar config
  - `examples/domains/ecommerce/public/config.inventory-service.json` - Sidecar config
  - `examples/domains/ecommerce/public/transformations/` - JSONata transform files
  - `examples/services/order-service/Program.cs` - Added StockReserved handler
  - `examples/README.md` - Updated with Phase 2 completion, new sequence diagram
  - `README.md` - Added FG05-FG08 bug documentation

- **Bugs Documented for Future Fix (README.md Feature Grooming):**
  - **FG05**: spas-compose should use `image:` from runtime metadata, not `build:`
  - **FG06**: Sidecar config generation incomplete (5 issues: missing eventType, wrong eventType format, incorrect invokeEndpoint, wrong transform path, sidecar doesn't load transform files)
  - **FG07**: Incorrect port configurations (service ports 8080, sidecar `SIDECAR_PORT` env var not `PORT`)
  - **FG08**: SDK should derive sidecar host from SERVICE_NAME convention

### Precise Next Steps (Pick and execute IN ORDER)

1. **Fix spas-compose bugs (FG05-FG07)** — Make tooling generate correct configs:

   - FG05: Use `image:` from runtime metadata instead of `build:`
   - FG06: Fix sidecar config generation (eventType format, invokeEndpoint, transform loading)
   - FG07: Fix port configurations (8080 for services, SIDECAR_PORT env var)
   - Optionally: FG08 (SDK sidecar host derivation)

2. **Phase 3: B2B Subscription Choreography** — Same services, different choreography:
   - Proves service reuse across domains (core SPAS value proposition)
   - Use `spas-compose init` for B2B domain
   - Create async-first choreography (OrderRequested → OrderCreated → subscription flow)
   - Verify same order-service/inventory-service work in different domain context

### Key Files for Context

- **[examples/README.md](./examples/README.md)** — Phase 1 & 2 complete, sequence diagrams, running instructions
- **[README.md](./README.md)** — Feature Grooming section with FG05-FG08 bugs to fix
- **[examples/domains/ecommerce/public/](./examples/domains/ecommerce/public/)** — Working Phase 2 deployment

## 📋 Key Rules for Multi-Machine Continuity

1. **Before leaving a machine:** Document exactly what was done, what failed, and precise next steps in this file so agents on other machines can pick up from where you stopped.
2. **On new machine:** Always read this file + examples/README.md + principles/appendix/28-decision-log.md first.
3. **Architecture diagrams:** Mermaid diagrams in principles/, prototypes/, and examples/ provide massive context with minimal tokens.
4. **Specification is source-of-truth:** All implementation drives from principles/, cross-referenced via ./principles/README.md.
5. **Track decisions:** New architectural decisions get recorded in principles/appendix/28-decision-log.md as ADRs.

### 🚀 Agent Handoff Prompt (Use This First)

When an agent starts work on another machine, use this prompt:

```text
You are continuing SPAS (Self-contained, Portable, Adaptable Services)
framework PoC implementation. Read these context files first:

1. ./TASKS.md (this file) - Project status, decisions, and next steps
2. ./examples/README.md - Phase 5 E-Commerce example design (CURRENT FOCUS)
3. ./.github/agents/copilot-instructions.md - agent instructions
4. .specify/memory/constitution.md - GitHub SpecKit constitution file generated by copilot
5. ./README.md - SPAS framework overview and current achievements
6. ./principles/README.md - Complete specification navigation
7. ./principles/appendix/28-decision-log.md - Architecture decisions (ADRs)
8. ./principles/02-architecture-overview.md - High-level system design
9. ./specs (all files in subfolders) - contains GitHub SpecKit specifications for features
10. ./prototypes/spas-sidecar-prototype/README.md - Prototype documentation

Once read, answer: "What is the immediate next task and what implementation artifacts from the spec should guide it?"
```

## Remaining Phases

### Phase 5: E-Commerce End-to-End PoC ← CURRENT

**Status:** 🔨 Design Complete — Implementation Phase 1 Ready

**Design Document:** [examples/README.md](./examples/README.md)

**Goal:** Demonstrate full SPAS framework in realistic multi-service scenario with service reuse across domains.

**Implementation Phases:**

| Phase  | Description                                  | Status      |
| ------ | -------------------------------------------- | ----------- |
| Design | Complete design document with all 7 sections | ✅ Complete |
| 1      | Core services + Repository integration       | 🔲 Next     |
| 2      | E-Commerce public choreography               | 🔲 Pending  |
| 3      | B2B subscription choreography                | 🔲 Pending  |
| 4      | Documentation & polish                       | 🔲 Pending  |
| 5      | Product service (optional)                   | 🔲 TBD      |

**Spec Cross-Reference:**

- `examples/README.md` (design decisions, service portfolio, event flows)
- `principles/02-architecture-overview.md` (architecture)
- `principles/service/04-service-contract.md` (service contracts)
- `principles/component/14-domain-choreography.md` (adaptation rules)

**Prerequisites:** Phase 4 (Sidecar) complete ✓

**Outputs:**

- `examples/services/` — SPAS-compliant services (.NET + SDK)
- `examples/stubs/` — Domain-specific stubs (Node.js)
- `examples/gateways/` — Custom API gateway (Node.js)
- `examples/domains/` — Domain deployments with choreography and docker-compose

---

## Reference Links

Permanent documentation for spec cross-referencing and constraints:

| Topic                                   | Location                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Spec navigation & cross-reference guide | [principles/README.md](./principles/README.md)                                     |
| PoC constraints & simplifications       | [principles/02-architecture-overview.md](./principles/02-architecture-overview.md) |
| Architecture decisions (ADRs)           | [principles/appendix/28-decision-log.md](./principles/appendix/28-decision-log.md) |
| Phase 5 folder structure                | [examples/README.md](./examples/README.md)                                         |
| GitHub SpecKit specs                    | [specs/README.md](./specs/README.md)                                               |
| Components                              | [components/README.md](./components/README.md)                                     |
