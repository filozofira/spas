# SPAS PoC Implementation Handoff Guide

**Purpose:** Enable agents to continue PoC implementation across machines without losing context.

---

## Agent Handoff Update (Dec 14, 2025)

This section documents the latest actions, any issues encountered, and the exact next steps so another agent can resume seamlessly.

### What Was Done (Sidecar Specification Drafted)

- **All CLI Features Complete** — Both `spas-service` and `spas-compose` CLIs implemented
- **Branch**: `main` (all feature branches merged)
- **Status**: Sidecar spec drafted, ready for `/speckit.specify`

**Session Actions**:

1. Drafted complete sidecar specification (see below)
2. **Technology Decision**: Node.js for PoC (leverage prototype), Go migration path for Production
3. Identified two work items:
   - **006-spas-sidecar**: Sidecar runtime with dynamic JSONata loading
   - **005-spas-compose enhancement**: Add `SidecarConfigGenerator` to generate `config.{service}.json`
4. Clarified separation of concerns:
   - AI agent creates `.jsonata` transformation files (already works)
   - `spas-compose choreography deploy` generates sidecar configs (TO BE ADDED)
   - Sidecar loads configs + transformations at runtime (TO BE IMPLEMENTED)

### What Failed or Required Adjustment

- Nothing failed in this session
- SDK SampleService `dotnet run` still exits with code 1 (pre-existing issue, not addressed)
- Clarified: User Story for CLI config generation belongs in spas-compose, not sidecar spec

### Precise Next Steps (Pick and execute IN ORDER)

1. **Enhance spas-compose CLI** (005-spas-compose-cli patch) — Add `SidecarConfigGenerator` to `spas-compose choreography deploy`:
   - Parse `choreography.yaml` flows and topic mappings
   - Generate `config.{service}.json` for each participating service
   - Output alongside `docker-compose.yaml` (single command produces all artifacts)
   - Update existing tests to verify config generation

2. **Create Sidecar Specification** — Run `/speckit.specify` with spec text below to create `specs/006-spas-sidecar/`

3. **Implement Sidecar** — Run `/speckit.tasks` then `/speckit.implement` for 006-spas-sidecar

### spas-compose Enhancement Details (Step 1)

**What to add**: `SidecarConfigGenerator` class in `components/cli/spas-compose/src/services/`

**Input**: `choreography.yaml` with structure:
```yaml
flows:
  order-to-fulfillment:
    participants: [order-service, fulfillment-service]
    steps:
      - from: order-service
        publish: orders-requested
        transform: transformations/order-service/outbound-order.jsonata
      - subscribe: orders-requested
        to: fulfillment-service
        transform: transformations/fulfillment-service/inbound-order.jsonata
        endpoint: /incoming
```

**Output**: Per-service config files:
```json
// config.order-service.json
{
  "inbound": [],
  "outbound": [
    { "topic": "orders-requested", "transform": "transformations/outbound-order.jsonata" }
  ]
}

// config.fulfillment-service.json
{
  "inbound": [
    { "kind": "event", "topic": "orders-requested", "transform": "transformations/inbound-order.jsonata", "invokeEndpoint": "/incoming" }
  ],
  "outbound": []
}
```

**Integration**: Call from `choreography-deploy.ts` after generating docker-compose.yaml

### Sidecar Spec Summary (for `/speckit.specify` - Step 2)

**Technology**: Node.js (PoC), Go migration path (Production)

**User Stories (Priority Order)**:

| # | Story | Priority | Description |
|---|-------|----------|-------------|
| 1 | Dynamic JSONata Transformation Loading | P1 | Load `.jsonata` files from mounted volumes — **foundational** |
| 2 | Event Publishing via Sidecar | P1 | `/publish/{topic}` with CloudEvents + tracing |
| 3 | Event Consumption via Sidecar | P1 | Redis subscription → service HTTP delivery |
| 4 | Command Invocation via Sidecar | P1 | `/invoke/{command}` request-response pattern |
| 5 | Health and Readiness Endpoints | P2 | `/health` and `/ready` for orchestration |
| 6 | Zipkin Distributed Tracing | P2 | Span reporting with parent-child relationships |

**Key Implementation Notes**:
- Migrate from `prototypes/spas-sidecar-prototype/spas-sidecar/`
- Replace hardcoded `transform.js` with dynamic JSONata loading
- Config schema already uses `inbound/outbound` structure
- Add `/health` and `/ready` endpoints
- Target: 30+ unit tests

**Dependencies**:
- Requires spas-compose enhancement (SidecarConfigGenerator) for integration testing
- Sidecar runtime can be developed in parallel with config generator

### Completed Features Summary

| Feature            | Spec                                                                    | Status      | Tests |
| ------------------ | ----------------------------------------------------------------------- | ----------- | ----- |
| .NET SDK           | [001-dotnet-spas-sdk](./specs/001-dotnet-spas-sdk/)                     | ✅ Complete | 88/88 |
| Schema Alignment   | [002-metadata-schema-alignment](./specs/002-metadata-schema-alignment/) | ✅ Complete | —     |
| Repository Service | [003-repository-service](./specs/003-repository-service/)               | ✅ Complete | 35/35 |
| spas-service CLI   | [004-spas-service-cli](./specs/004-spas-service-cli/)                   | ✅ Complete | 48/48 |
| spas-compose CLI   | [005-spas-compose-cli](./specs/005-spas-compose-cli/)                   | ✅ Complete | 67/67 |
| SPAS Sidecar       | [006-spas-sidecar](./specs/006-spas-sidecar/) *(to create)*             | 🔜 Next     | —     |

## 📋 Key Rules for Multi-Machine Continuity

1. **Before leaving a machine:** Document exactly what was done, what failed, and precise next steps in this file so agents on other machines can pick up from where you stopped.
2. **On new machine:** Always read this file + principles/appendix/28-decision-log.md first.
3. **Architecture diagrams:** Mermaid diagrams in principles/ and prototypes/ provide massive context with minimal tokens.
4. **Specification is source-of-truth:** All implementation drives from principles/, cross-referenced via ./principles/README.md.
5. **Track decisions:** New architectural decisions get recorded in principles/appendix/28-decision-log.md as ADRs.

### 🚀 Agent Handoff Prompt (Use This First)

When an agent starts work on another machine, use this prompt:

```text
You are continuing SPAS (Self-contained, Portable, Adaptable Services)
framework PoC implementation. Read these context files first:

1. ./TASKS.md (this file) - Project status, decisions, and next steps
2. ./.github/agents/copilot-instructions.md - agent instructions
3. .specify/memory/constitution.md - GitHub SpecKit constitution file generated by copilot
4. ./README.md - SPAS framework overview and current achievements
5. ./principles/README.md - Complete specification navigation
6. ./principles/appendix/28-decision-log.md - Architecture decisions (ADRs)
7. ./principles/02-architecture-overview.md - High-level system design
8. ./specs (all files in subfolders) - contains GitHub SpecKit specifications for features
9. ./prototypes/spas-sidecar-prototype/README.md - Prototype documentation

Once read, answer: "What is the immediate next task and what implementation artifacts from the spec should guide it?"
```

## Remaining Phases

### ~~Phase 3: CLI Tool~~ ✅ COMPLETE

**Status:** Both `spas-service` and `spas-compose` CLIs implemented and tested.

**Deliverables:**

- `spas-service`: init, metadata get, pack, publish, pull (48 tests)
- `spas-compose`: init, services pull, choreography deploy (67 tests)
- AI-assisted composition via `/spas.compose` agent prompt

---

### Phase 4: SPAS Sidecar Development

**Goal:** Promote prototype sidecar to production-quality component with dynamic JSONata loading.

**Spec Cross-Reference:** `principles/component/10-sidecar-contract.md` (source-of-truth)

**Technology Decision: Node.js** (PoC) with Go migration path (Production)

| Criterion | Node.js (PoC) | Go (Production) |
|-----------|---------------|-----------------|
| JSONata Support | Native (`jsonata` npm) | Limited (port required) |
| Docker Image Size | ~150MB | ~10MB |
| Existing Prototype | ✅ Full working code | 🔨 New implementation |

**Two Work Items:**

1. **006-spas-sidecar** — Sidecar runtime implementation:
   - Dynamic JSONata transformation loading (foundational)
   - Event publishing via `/publish/{topic}`
   - Event consumption via Redis subscription
   - Command invocation via `/invoke/{command}`
   - Health/readiness endpoints
   - Zipkin distributed tracing

2. **005-spas-compose enhancement** — Add `SidecarConfigGenerator`:
   - Parse `choreography.yaml` flows and topic mappings
   - Generate `config.{service}.json` for each service
   - Output alongside `docker-compose.yaml`

**Outputs:**

- `components/sidecar/` — Production-quality sidecar component (30+ tests)
- CLI enhancement: `spas-compose` generates sidecar configs automatically
- Docker image ready for E-Commerce PoC

---

### Phase 5: E-Commerce End-to-End PoC

**Goal:** Demonstrate full SPAS framework in realistic multi-service scenario.

**Spec Cross-Reference:**

- `principles/02-architecture-overview.md` (architecture)
- `principles/service/04-service-contract.md` (service contracts)
- `principles/component/14-domain-choreography.md` (adaptation rules)

**Prerequisites:** Phase 4 (Sidecar) must be complete.

**Implementation Plan:**

- Define service portfolio (order, fulfillment, shipping, notification, etc.)
- Plan domain composition and choreography (event flows, topic mappings)
- Plan transformation mappings for cross-service event adaptation
- Design Docker Compose orchestration with all components (services, sidecar, Redis, Zipkin)
- Plan testing strategy (contract tests, integration scenarios)
- Plan documentation and walkthrough guides

**Scope:** Integrate all Phase 1-4 components into realistic multi-service domain.

**Outputs:**

- `examples/e-commerce/` — production-quality reference implementation
- Complete runnable system demonstrating all SPAS PoC concepts
- Documentation and onboarding guides

---

## How to Cross-Reference Specs During Implementation

### 1. When Building SDK Features

```text
Feature requested: "Event publishing API"
  ↓
Consult: principles/component/12-sdk.md
Specifically: "SDK Specification > Responsibilities" section
  ↓
Implement API to match spec examples
  ↓
Cross-check: principles/service/04-service-contract.md
(events[] published definitions)
  ↓
Validate: Examples match principles/appendix/26-reference-examples.md
```

### 2. When Building Repository API

```text
Feature: "GET /services/{name}/{version}"
  ↓
Consult: principles/component/11-repository.md
Specifically: "API Endpoints (baseline)"
  ↓
Check schema: principles/service/06-service-metadata.md
  ↓
Review: governance/24-compliance-checklist.md
(what validation repository must perform)
```

### 3. When Building CLI Commands

```text
Feature: "spas-service pack"
  ↓
Consult: principles/component/13-cli.md
Specifically: "Commands > PoC Core" section
  ↓
Understand input: principles/service/06-service-metadata.md
(spas.json schema structure)
  ↓
Understand output: principles/infrastructure/15-package-format.md
(what "pack" should produce)
  ↓
Validate: Examples from principles/appendix/26-reference-examples.md
```

## How to Cross-Reference GitHub SpecKit Specs During Implementation

Update [README.md](./specs/README.md) Specs section by adding your feature at the end of list.

## How to Cross-Reference Components During Implementation

Update [README.md](./components/README.md) Components section by adding your feature at the end of list.

## Key Specification Touchstones

| Component              | Spec Reference                                                              | Purpose                                  |
| ---------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| SDK                    | [12-sdk.md](principles/component/12-sdk.md)                                 | Service development library              |
| Repository             | [11-repository.md](principles/component/11-repository.md)                   | Metadata storage & discovery             |
| CLI                    | [13-cli.md](principles/component/13-cli.md)                                 | Packaging & composition tooling          |
| Sidecar                | [10-sidecar-contract.md](principles/component/10-sidecar-contract.md)       | Runtime transformation & event I/O       |
| Service Contracts      | [04-service-contract.md](principles/service/04-service-contract.md)         | What services expose                     |
| Service Metadata       | [06-service-metadata.md](principles/service/06-service-metadata.md)         | spas.json schema                         |
| Message Transformation | [14-domain-choreography.md](principles/component/14-domain-choreography.md) | Adaptation & mapping                     |
| Communication Protocol | [07-communication-model.md](principles/protocol/07-communication-model.md)  | How services talk (HTTP PoC → gRPC prod) |
| Event Protocol         | [09-event-protocol.md](principles/protocol/09-event-protocol.md)            | CloudEvents + W3C Trace Context          |
| Architecture Decisions | [28-decision-log.md](principles/appendix/28-decision-log.md)                | Why SPAS looks like this                 |

## PoC Constraints & Simplifications

1. **HTTP-only** (not gRPC) — simplifies PoC, spec marks gRPC as production feature
2. **Repository storage layer** — SQLite (PoC) with IStorageProvider abstraction for migration to PostgreSQL + S3 (Production)
3. **Metadata-only policy** — security policies declared but not enforced in PoC
4. **Local identity** — "Identity in Payload" (JWT/claims embedded in request)
5. **No service mesh** — SPAS sidecar runs independently; no Istio/Linkerd
6. **Redis Streams** (not Kafka) — simpler for local dev, sufficient for PoC traces
7. **Zipkin tracing** — not production-grade observability, but demonstrates concepts

All marked in principles as `PoC` vs `Production` using admonition blocks (see principles/02-architecture-overview.md).

## Recommended Folder Structure for PoC Implementation

```text
spas/                                  # Root repository
├── principles/                        # ✅ COMPLETE - Specification (source-of-truth)
│   ├── INDEX.md                       # Navigation entry point
│   ├── 01-core-principles.md
│   ├── 02-architecture-overview.md
│   ├── service/
│   │   ├── 03-service-model.md
│   │   ├── 04-service-contract.md
│   │   ├── 05-service-lifecycle.md
│   │   └── 06-service-metadata.md     # spas.json schema
│   ├── component/
│   │   ├── 10-sidecar-contract.md
│   │   ├── 11-repository.md
│   │   ├── 12-sdk.md
│   │   ├── 13-cli.md
│   │   └── 14-domain-choreography.md
│   ├── protocol/
│   │   ├── 07-communication-model.md
│   │   ├── 08-grpc-protocol.md        # (Production; PoC uses HTTP)
│   │   └── 09-event-protocol.md
│   ├── security/
│   ├── infrastructure/
│   ├── governance/
│   ├── appendix/
│   │   ├── 27-glossary.md
│   │   └── 28-decision-log.md         # Architecture Decision Records (ADRs)
│   └── README.md
│
├── prototypes/                        # ✅ COMPLETE - Proof-of-concept implementations
│   └── spas-sidecar-prototype/
│       ├── README.md                  # Complete sidecar documentation
│       ├── docker-compose.yml         # Full working example
│       ├── spas-sidecar/              # Sidecar component prototype to reuse or at least use inspiration from
│       ├── order-service/
│       ├── fulfillment-service/
│       └── [Order/Fulfillment clients]
│
├── components/                        # PoC framework components
│   ├── sdk/                           # ✅ COMPLETE - SDKs for multiple languages
│   │   ├── dotnet/                    # .NET SDK for SPAS service development
│   │   │   ├── src/                   # Contains source code for .NET SDKs
│   │   │   ├── test/                  # Unit test code for .NET SDKs
│   │   │   ├── SPAS.SDK.sln           # SDK .NET solution file
│   │   │   └── README.md              # SDK documentation (keyed to principles/12-sdk.md)
│   │   ├── go/                        # Go SDK (future)
│   │   ├── java/                      # Java SDK (future)
│   │   └── README.md                  # Multi-language SDK guide
│   │
│   ├── cli/                           # ✅ COMPLETE - CLI Tools for service packaging & composition
│   │   ├── spas-service/              # spas-service CLI (48 tests)
│   │   │   ├── src/                   # source for spas-service cli
│   │   │   ├── test/                  # test for spas-service
│   │   ├── spas-compose/              # spas-compose CLI (67 tests)
│   │   │   ├── src/                   # source for spas-compose cli
│   │   │   ├── test/                  # test for spas-compose
│   │   └── README.md                  # CLI documentation (keyed to principles/13-cli.md)
│   │
│   ├── repository/                    # ✅ COMPLETE - SPAS Repository Service (35 tests)
│   │   ├── src/                       # SPAS Repository service source code
│   │   ├── test/                      # SPAS Repository test
│   │   └── README.md                  # Repository API docs (keyed to principles/11-repository.md)
│   │
│   └── sidecar/                       # 🔨 PHASE 4 - SPAS Sidecar (Go or Node.js TBD)
│       ├── src/                       # Sidecar source code
│       ├── config/
│       │   ├── default.config.json    # Default configuration template
│       └── Dockerfile
│       ├── README.md                  # Integration guide (keyed to principles/10-sidecar-contract.md)
│
├── examples/                          # 🔨 PHASE 5 - End-to-end PoC demonstrations
│   ├── e-commerce/                    # E-commerce domain PoC
│   │   ├── README.md                  # Domain walkthrough
│   │   ├── docker-compose.yml         # Local deployment
│   │   ├── services/
│   │   │   ├── order-service/         # Evolved from prototype
│   │   │   │   ├── spas.json          # Service metadata (example)
│   │   │   │   ├── src/
│   │   │   │   └── metadata/          # Decomposed metadata structure
│   │   │   ├── fulfillment-service/
│   │   │   ├── shipping-service/      # NEW - additional service
│   │   │   └── notification-service/  # NEW - additional service
│   │   ├── choreography/
│   │   │   ├── choreography.yaml      # Domain composition (named flows + routing)
│   │   │   ├── transformations/       # JSONata files organized by service
│   │   │   │   ├── order-service/     # .jsonata files for order-service sidecar
│   │   │   │   └── fulfillment-service/
│   │   │   └── schemas/               # Canonical schemas for e-commerce domain
│   │   └── test/
│   │       ├── contract-test/        # Pact-style contract testing
│   │       └── integration-test/     # End-to-end scenario test
│   │
│   └── simple-sync/                   # Minimal synchronous example
│       └── [Two services + choreography]
│
├── TASKS.md                           # This file - multi-machine continuity
├── README.md                          # Framework overview
├── LICENSE
└── .github/
    └── workflows/                     # CI/CD (future)
```
