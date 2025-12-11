# SPAS PoC Implementation Handoff Guide

**Purpose:** Enable agents to continue PoC implementation across machines without losing context.

## 🚀 Agent Handoff Prompt (Use This First)

When an agent starts work on another machine, use this prompt:

```
You are continuing SPAS (Self-contained, Portable, Adaptable Services)
framework PoC implementation. Read these context files first:

1. ./TASKS.md (this file) - Project status, decisions, and next steps
2. ./README.md - SPAS framework overview and current achievements
3. ./spec/INDEX.md - Complete specification navigation
4. ./spec/appendix/28-decision-log.md - Architecture decisions (ADRs)
5. ./spec/02-architecture-overview.md - High-level system design
6. ./prototypes/spas-sidecar-prototype/README.md - Prototype documentation

Once read, answer: "What is the immediate next task and what implementation
artifacts from the spec should guide it?"
```

## 📋 Key Rules for Multi-Machine Continuity

1. **Before leaving a machine:** Document exactly what was done, what failed, and precise next steps in this file.
2. **On new machine:** Always read this file + spec/appendix/28-decision-log.md first.
3. **Architecture diagrams:** Mermaid diagrams in spec/ and prototypes/ provide massive context with minimal tokens.
4. **Specification is source-of-truth:** All implementation drives from spec/, cross-referenced via ./spec/INDEX.md.
5. **Track decisions:** New architectural decisions get recorded in spec/appendix/28-decision-log.md as ADRs.

## Current Status (Dec 11, 2025 - UPDATED)

- **Architecture:** ✅ COMPLETE. Specs finalized with "HTTP-only PoC", "Identity in Payload", architecture diagrams.
- **Documentation:** ✅ CONSOLIDATED. Reduced 1,000+ lines of redundancy; clean specification navigation.
- **SPAS Sidecar Prototype:** ✅ PRODUCTION-READY
  - Bidirectional event transformation (order-service ↔ fulfillment-service)
  - CloudEvents 1.0 + W3C Trace Context propagation
  - Full end-to-end trace correlation verified (same trace ID through entire flow)
  - Zipkin distributed tracing with correlated spans
  - Located: `prototypes/spas-sidecar-prototype/`
  - Ready for integration into `src/sidecar/` as framework component
- **Next Phase:** PoC Implementation (Monorepo structure + component development)

## Recommended Folder Structure for PoC Implementation

```text
spas/                                  # Root repository
├── spec/                              # ✅ COMPLETE - Specification (source-of-truth)
│   ├── INDEX.md                       # Navigation entry point
│   ├── 01-core-principles.md
│   ├── 02-architecture-overview.md
│   ├── service-specification/
│   │   ├── 03-service-model.md
│   │   ├── 04-service-contract.md
│   │   ├── 05-service-lifecycle.md
│   │   └── 06-service-metadata.md     # spas.json schema
│   ├── component-specification/
│   │   ├── 10-sidecar-contract.md
│   │   ├── 11-transformation-middleware.md
│   │   ├── 12-repository-spec.md
│   │   ├── 13-sdk-specification.md
│   │   └── 14-cli-specification.md
│   ├── protocol-specification/
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
│       ├── spas-sidecar/              # Reusable sidecar component
│       ├── order-service/
│       ├── fulfillment-service/
│       └── [Order/Fulfillment clients]
│
├── src/                               # 🔨 TO BUILD - Production framework components
│   ├── sdk/                           # SDKs for multiple languages
│   │   ├── .net/                      # .NET SDK for SPAS service development
│   │   │   ├── src/
│   │   │   │   ├── Metadata/          # spas.json authoring & serialization
│   │   │   │   ├── Transport/         # gRPC/HTTP client abstractions
│   │   │   │   ├── Events/            # Event publishing API
│   │   │   │   ├── Security/          # Logic to get identity either from event payload or request headers. 
│   │   │   │   ├── Health/            # Health check utilities
│   │   │   │   └── SPAS.SDK.csproj
│   │   │   ├── tests/
│   │   │   │   └── SPAS.SDK.Test.csproj
│   │   │   ├── SPAS.SDK.sln           # SDK .Net solution file
│   │   │   └── README.md              # SDK documentation (keyed to spec/13-sdk-specification.md)
│   │   ├── go/                        # Go SDK (future)
│   │   ├── java/                      # Java SDK (future)
│   │   └── README.md                  # Multi-language SDK guide
│   │
│   ├── cli/                           # CLI Tool for service packaging & composition
│   │   ├── SPAS.CLI.csproj
│   │   ├── src/                       # Language is to be determined during the implementation.
│   │   │   ├── spas-service/          # source for spas-service cli with init, pack, publish, pull, metadata get etc. commands   
│   │   │   ├── spas-compose/          # source for spas-compose cli with context init, services pull, choreography init, etc. commands
│   │   ├── tests/                     # 
│   │   └── README.md                  # CLI documentation (keyed to spec/14-cli-specification.md)
│   │
│   ├── repository/                    # Repository Service (metadata + schema storage)
│   │   ├── SPAS.Repository.csproj
│   │   ├── src/
│   │   │   ├── Api/                   # REST endpoints
│   │   │   │   ├── ServiceController.cs  # GET /services, POST /services/{name}/{version}
│   │   │   │   └── SchemaController.cs   # Schema registry endpoints
│   │   │   ├── Storage/               # File-based storage (PoC)
│   │   │   └── Validation/            # Metadata validation
│   │   ├── tests/
│   │   └── README.md                  # Repository API docs (keyed to spec/12-repository-spec.md)
│   │
│   └── sidecar/                       # SPAS Sidecar (from prototype, production-ready)
│       ├── README.md                  # Integration guide
│       ├── src/                       # JavaScript/Node.js (or migrate to .NET if needed)
│       │   ├── index.js               # Main sidecar runtime
│       │   ├── transformation/        # Message transformation pipeline
│       │   ├── messaging/             # Redis Streams integration
│       │   └── tracing/               # Zipkin/OpenTelemetry integration
│       ├── config/
│       │   ├── default.config.json    # Default configuration template
│       │   └── examples/              # Example configurations per pattern
│       └── Dockerfile
│
├── examples/                          # 🔨 TO BUILD - End-to-end PoC demonstrations
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
│   │   │   ├── choreography.yaml      # Domain composition (routing + topic mappings)
│   │   │   ├── transformations/       # Mapping files for topic adaptation
│   │   │   └── schemas/               # Canonical schemas for e-commerce domain
│   │   └── tests/
│   │       ├── contract-tests/        # Pact-style contract testing
│   │       └── integration-tests/     # End-to-end scenario tests
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

## Implementation Sequence & Spec Cross-References

### Phase 1: SDK Development

**Goal:** Enable services to author `spas.json` metadata and publish events.

**Spec Cross-Reference:** `spec/component-specification/13-sdk-specification.md` (source-of-truth)

**Implementation Plan:** To be determined during this phase.

- Assess language priorities (start with .NET; add Go/Java/Python as needed)
- Design SDK API surface (metadata authoring, event publishing, health checks)
- Plan SDK module structure across `src/sdk/{language}/` folders
- Define integration patterns (DI containers, configuration, observability)

**Outputs:**

- `src/sdk/.net/` with NuGet package ready (Phase 1.1)
- Example: `examples/simple-sync/` services using SDK
- SDK design document for future language implementations

---

### Phase 2: Repository Service

**Goal:** Store service metadata & schemas; enable service discovery.

**Spec Cross-Reference:** `spec/component-specification/12-repository-spec.md` (source-of-truth)

**Implementation Plan:** To be determined during this phase.

- Evaluate storage layer options (file-based, database, or hybrid)
- Design REST API endpoints per spec (GET /services, POST publish, GET schemas)
- Plan metadata validation strategy against spec schema
- Define schema registry integration approach
- Plan integration points with CLI (pull/publish commands)

**Decision Point:** Storage layer choice (file-based PoC vs. production-ready) deferred until Phase 2 execution.

**Outputs:**

- `src/repository/` service (ready to containerize)
- Storage layer implementation (choice TBD)
- Example repository populated with e-commerce services

---

### Phase 3: CLI Tool

**Goal:** Enable service packaging and composition workflow.

**Spec Cross-Reference:** `spec/component-specification/14-cli-specification.md` (source-of-truth)

**Implementation Plan:** To be determined during this phase.

- Define command structure and argument patterns (service vs. compose commands)
- Plan SDK integration points (metadata authoring, validation)
- Design workflow sequence (init → pack → publish → pull → generate)
- Plan integration with Repository Service API
- Plan integration with Sidecar configuration generation

**Prioritized Commands for Phase 3:**

- Service management: init, metadata get, pack, publish, pull
- Composition: context init, services pull, choreography init, choreography generate

**Outputs:**

- `src/cli/` tool (ready to ship as NuGet package or standalone)
- Integration tests showing full workflow (init → pack → publish → pull → generate)
- CLI usage guide and examples

---

### Phase 4: E-Commerce End-to-End PoC

**Goal:** Demonstrate full SPAS framework in realistic multi-service scenario.

**Spec Cross-Reference:**

- `spec/02-architecture-overview.md` (architecture)
- `spec/service-specification/04-service-contract.md` (service contracts)
- `spec/component-specification/11-transformation-middleware.md` (adaptation rules)

**Implementation Plan:** To be determined during this phase.

- Define service portfolio (order, fulfillment, shipping, notification, etc.)
- Plan domain composition and choreography (event flows, topic mappings)
- Plan transformation mappings for cross-service event adaptation
- Design Docker Compose orchestration with all components (services, sidecar, Redis, Zipkin)
- Plan testing strategy (contract tests, integration scenarios)
- Plan documentation and walkthrough guides

**Scope:** Integrate all Phase 1-3 components into realistic multi-service domain.

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
Consult: spec/component-specification/13-sdk-specification.md
Specifically: "SDK Specification > Responsibilities" section
  ↓
Implement API to match spec examples
  ↓
Cross-check: spec/service-specification/04-service-contract.md
(events[] published definitions)
  ↓
Validate: Examples match spec/appendix/26-reference-examples.md
```

### 2. When Building CLI Commands

```text
Feature: "spas-service pack"
  ↓
Consult: spec/component-specification/14-cli-specification.md
Specifically: "Commands > PoC Core" section
  ↓
Understand input: spec/service-specification/06-service-metadata.md
(spas.json schema structure)
  ↓
Understand output: spec/infrastructure/15-package-format.md
(what "pack" should produce)
  ↓
Validate: Examples from spec/appendix/26-reference-examples.md
```

### 3. When Building Repository API

```text
Feature: "GET /services/{name}/{version}"
  ↓
Consult: spec/component-specification/12-repository-spec.md
Specifically: "API Endpoints (baseline)"
  ↓
Check schema: spec/service-specification/06-service-metadata.md
  ↓
Review: governance/24-compliance-checklist.md
(what validation repository must perform)
```

## Key Specification Touchstones

| Component              | Spec Reference                                                                                  | Purpose                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| SDK                    | [13-sdk-specification.md](spec/component-specification/13-sdk-specification.md)                 | Service development library              |
| Repository             | [12-repository-spec.md](spec/component-specification/12-repository-spec.md)                     | Metadata storage & discovery             |
| CLI                    | [14-cli-specification.md](spec/component-specification/14-cli-specification.md)                 | Packaging & composition tooling          |
| Sidecar                | [10-sidecar-contract.md](spec/component-specification/10-sidecar-contract.md)                   | Runtime transformation & event I/O       |
| Service Contracts      | [04-service-contract.md](spec/service-specification/04-service-contract.md)                     | What services expose                     |
| Service Metadata       | [06-service-metadata.md](spec/service-specification/06-service-metadata.md)                     | spas.json schema                         |
| Message Transformation | [11-transformation-middleware.md](spec/component-specification/11-transformation-middleware.md) | Adaptation & mapping                     |
| Communication Protocol | [07-communication-model.md](spec/protocol-specification/07-communication-model.md)              | How services talk (HTTP PoC → gRPC prod) |
| Event Protocol         | [09-event-protocol.md](spec/protocol-specification/09-event-protocol.md)                        | CloudEvents + W3C Trace Context          |
| Architecture Decisions | [28-decision-log.md](spec/appendix/28-decision-log.md)                                          | Why SPAS looks like this                 |

## PoC Constraints & Simplifications

1. **HTTP-only** (not gRPC) — simplifies PoC, spec marks gRPC as production feature
2. **Repository storage layer** — decision deferred to Phase 2 execution (options: file-based, embedded database, or production-ready)
3. **Metadata-only policy** — security policies declared but not enforced in PoC
4. **Local identity** — "Identity in Payload" (JWT/claims embedded in request)
5. **No service mesh** — SPAS sidecar runs independently; no Istio/Linkerd
6. **Redis Streams** (not Kafka) — simpler for local dev, sufficient for PoC traces
7. **Zipkin tracing** — not production-grade observability, but demonstrates concepts

All marked in spec as `PoC` vs `Production` using admonition blocks (see spec/02-architecture-overview.md).

## Notes for Cross-Machine Handoff

**Document to read first on new machine:**

1. This file (TASKS.md) — status + next step
2. spec/INDEX.md — navigation to all specs
3. spec/02-architecture-overview.md — architecture overview
4. spec/appendix/28-decision-log.md — design decisions
5. README.md — framework overview
6. prototypes/spas-sidecar-prototype/README.md — what sidecar does

**Last successful state (Dec 11, 2025):**

- Specification complete and internally consistent
- Prototype fully operational with verified trace correlation
- Documentation consolidated and cleaned up
- Ready to begin monorepo setup + component development

**Exact next step:**
→ Create `src/` folder structure (as shown above) and begin SDK development Phase 1
→ Reference spec/component-specification/13-sdk-specification.md as implementation guide

**Common gotchas:**

- Spec is the source-of-truth; implement to match spec examples (not the other way around)
- "PoC vs Production" markers in spec indicate what's simplified for PoC
- Architecture decisions (ADRs) in 28-decision-log.md explain "why" for each design choice
- Cross-reference using spec/INDEX.md for navigation (includes "by audience" sections)

## Recent Status (Dec 11, 2025)

**Documentation cleanup completed:**

- Consolidated ARCHITECTURE.md → README.md (sidecar prototype)
- Consolidated SPAS-PROTOTYPE-SUMMARY.md → README.md (removed 300 lines duplication)
- Simplified STRUCTURE.md → INDEX.md (clean navigation)
- Organized DECISIONS-NEEDED.md → 28-decision-log.md (14 ADRs + 6 pending clarifications)
- Moved Redis config to environment variables (12-factor compliance)
- **Result:** 1,000+ lines of redundancy eliminated, clean specification navigation

**Architecture documentation enhanced:**

- Added 4 Mermaid diagrams to sidecar prototype (System Architecture, Message Flow, Trace Correlation, Sidecar Pattern)
- All diagrams interactive + professional quality
- Cross-referenced with specification

---

**Last updated:** December 11, 2025  
**By:** GitHub Copilot  
**Status:** Ready for Phase 1 (SDK Development)
