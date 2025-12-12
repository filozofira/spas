# SPAS PoC Implementation Handoff Guide

**Purpose:** Enable agents to continue PoC implementation across machines without losing context.

## 🚀 Agent Handoff Prompt (Use This First)

When an agent starts work on another machine, use this prompt:

```text
You are continuing SPAS (Self-contained, Portable, Adaptable Services)
framework PoC implementation. Read these context files first:

1. ./TASKS.md (this file) - Project status, decisions, and next steps
2. ./README.md - SPAS framework overview and current achievements
3. ./principles/INDEX.md - Complete specification navigation
4. ./principles/appendix/28-decision-log.md - Architecture decisions (ADRs)
5. ./principles/02-architecture-overview.md - High-level system design
6. ./prototypes/spas-sidecar-prototype/README.md - Prototype documentation

Once read, answer: "What is the immediate next task and what implementation
artifacts from the spec should guide it?"
```

## 📋 Key Rules for Multi-Machine Continuity

1. **Before leaving a machine:** Document exactly what was done, what failed, and precise next steps in this file.
2. **On new machine:** Always read this file + principles/appendix/28-decision-log.md first.
3. **Architecture diagrams:** Mermaid diagrams in principles/ and prototypes/ provide massive context with minimal tokens.
4. **Specification is source-of-truth:** All implementation drives from principles/, cross-referenced via ./principles/INDEX.md.
5. **Track decisions:** New architectural decisions get recorded in principles/appendix/28-decision-log.md as ADRs.

## Current Status (Dec 12, 2025 - UPDATED)

- **Architecture:** ✅ COMPLETE. Specs finalized with "HTTP-only PoC", "Identity in Payload", architecture diagrams.
- **Documentation:** ✅ CONSOLIDATED. Reduced 1,000+ lines of redundancy; clean specification navigation.
- **SPAS Sidecar Prototype:** ✅ PRODUCTION-READY
  - Bidirectional event transformation (order-service ↔ fulfillment-service)
  - CloudEvents 1.0 + W3C Trace Context propagation
  - Full end-to-end trace correlation verified (same trace ID through entire flow)
  - Zipkin distributed tracing with correlated spans
  - Located: `prototypes/spas-sidecar-prototype/`
  - Ready for integration into `src/sidecar/` as framework component
- **.NET SDK Development:** ✅ PHASE 3 COMPLETE (User Story 1 + Refactoring)
  - Location: `components/sdk/.net/`
  - Foundation: ISpasClock, SpasTrace, SpasContext, JSON, Logging (Phase 2) ✅
  - Metadata Composition: Builders, Composer, Validator, Diagnostics (Phase 3) ✅
  - Auto-Discovery: Attribute-based contract discovery system ✅
  - All 40 unit tests passing ✅
  - SampleService generates complete spas.json with auto-discovered contracts ✅
  - **IMPORTANT:** See "SDK Implementation Details" section below for critical decisions
- **Next Phase:** User Story 2 (Dev Metadata Endpoint) OR continue with Event Publishing (User Story 3)

## Recommended Folder Structure for PoC Implementation

```text
spas/                                  # Root repository
├── principles/                        # ✅ COMPLETE - Specification (source-of-truth)
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
│   │   ├── 11-repository-spec.md
│   │   ├── 12-sdk-specification.md
│   │   ├── 13-cli-specification.md
│   │   └── 14-domain-choreography.md
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
│       ├── spas-sidecar/              # Sidecar component prototype to reuse or at least use inspiration from
│       ├── order-service/
│       ├── fulfillment-service/
│       └── [Order/Fulfillment clients]
│
├── components/                        # 🔨 TO BUILD - PoC framework components (to evolve to production-ready in future)
│   ├── sdk/                           # SDKs for multiple languages
│   │   ├── .net/                      # .NET SDK for SPAS service development
│   │   │   ├── src/                   # Contains source code for .Net SDKs
│   │   │   ├── test/                  # Unit test code for .Net SDKs
│   │   │   ├── SPAS.SDK.sln           # SDK .Net solution file
│   │   │   └── README.md              # SDK documentation (keyed to principles/12-sdk-specification.md)
│   │   ├── go/                        # Go SDK (future)
│   │   ├── java/                      # Java SDK (future)
│   │   └── README.md                  # Multi-language SDK guide
│   │
│   ├── cli/                           # CLI Tool for service packaging & composition
│   │   ├── spas-service/              # spas-service root
│   │   │   ├── src/                   # source for spas-service cli
│   │   │   ├── test/                  # test for spas-service
│   │   ├── spas-compose/              # spas-compose root
│   │   │   ├── src/                   # source for spas-compose cli
│   │   │   ├── test/                  # test for spas-compose
│   │   └── README.md                  # CLI documentation (keyed to principles/13-cli-specification.md)
│   │
│   ├── repository/                    # SPAS Repository Service (metadata + schema storage)
│   │   ├── src/                       # SPAS Repository service source code
│   │   ├── test/                      # SPAS Repository test
│   │   └── README.md                  # Repository API docs (keyed to principles/11-repository-spec.md)
│   │
│   └── sidecar/                       # SPAS Sidecar (from prototype to Poc and to evolve to production-ready in future)
│       ├── src/                       # JavaScript/Node.js (or migrate to .NET if needed)
│       ├── config/
│       │   ├── default.config.json    # Default configuration template
│       └── Dockerfile
│       ├── README.md                  # Integration guide
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

## Implementation Sequence & Spec Cross-References

### Phase 1: SDK Development (.NET) — ✅ IN PROGRESS

**Goal:** Enable services to author `spas.json` metadata and publish events.

**Spec Cross-Reference:** `principles/component-specification/12-sdk-specification.md` (source-of-truth)

**Status:** Phase 3 (User Story 1) complete. See detailed progress in `specs/001-dotnet-spas-sdk/tasks.md`

**Completed:**
- ✅ Phase 1: Project setup (15 projects, solution file, gitignore)
- ✅ Phase 2: Foundational infrastructure (ISpasClock, SpasTrace, SpasContext, JSON, Logging, Config)
- ✅ Phase 3: User Story 1 - Metadata composition with attribute-based auto-discovery
  - Builders: ServiceIdentityBuilder, ContractsBuilder, SecurityBuilder, HealthBuilder
  - Composition: SpasComposer (Compose, ComposeToFile)
  - Validation: SchemaValidator, Diagnostics helpers
  - Auto-Discovery: SpasCommandAttribute, SpasQueryAttribute, SpasEventAttribute
  - Discovery: MetadataDiscovery (events), WebApplicationDiscoveryExtensions (endpoints)
  - 40 unit tests passing
  - SampleService demonstrates end-to-end auto-discovery

**Next User Stories:**
- [ ] Phase 4: User Story 2 - Dev metadata endpoint `/_spas/metadata` (see below for decision)
- [ ] Phase 5: User Story 3 - Event publishing with trace context
- [ ] Phase 6: User Story 4 - Tracelog middleware

**Outputs:**

- `components/sdk/.net/` with 7 SDK packages + 7 test projects + SampleService ✅
- Design decisions documented in `specs/001-dotnet-spas-sdk/tasks.md` ✅
- Example: SampleService demonstrates attribute-based metadata authoring ✅

---

### Phase 2: Repository Service

**Goal:** Store service metadata & schemas; enable service discovery.

**Spec Cross-Reference:** `principles/component-specification/11-repository-spec.md` (source-of-truth)

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

**Spec Cross-Reference:** `principles/component-specification/13-cli-specification.md` (source-of-truth)

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

- `principles/02-architecture-overview.md` (architecture)
- `principles/service-specification/04-service-contract.md` (service contracts)
- `principles/component-specification/14-domain-choreography.md` (adaptation rules)

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
Consult: principles/component-specification/12-sdk-specification.md
Specifically: "SDK Specification > Responsibilities" section
  ↓
Implement API to match spec examples
  ↓
Cross-check: principles/service-specification/04-service-contract.md
(events[] published definitions)
  ↓
Validate: Examples match principles/appendix/26-reference-examples.md
```

### 2. When Building CLI Commands

```text
Feature: "spas-service pack"
  ↓
Consult: principles/component-specification/13-cli-specification.md
Specifically: "Commands > PoC Core" section
  ↓
Understand input: principles/service-specification/06-service-metadata.md
(spas.json schema structure)
  ↓
Understand output: principles/infrastructure/15-package-format.md
(what "pack" should produce)
  ↓
Validate: Examples from principles/appendix/26-reference-examples.md
```

### 3. When Building Repository API

```text
Feature: "GET /services/{name}/{version}"
  ↓
Consult: principles/component-specification/11-repository-spec.md
Specifically: "API Endpoints (baseline)"
  ↓
Check schema: principles/service-specification/06-service-metadata.md
  ↓
Review: governance/24-compliance-checklist.md
(what validation repository must perform)
```

## Key Specification Touchstones

| Component              | Spec Reference                                                                                        | Purpose                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| SDK                    | [13-sdk-specification.md](principles/component-specification/13-sdk-specification.md)                 | Service development library              |
| Repository             | [12-repository-spec.md](principles/component-specification/12-repository-spec.md)                     | Metadata storage & discovery             |
| CLI                    | [14-cli-specification.md](principles/component-specification/14-cli-specification.md)                 | Packaging & composition tooling          |
| Sidecar                | [10-sidecar-contract.md](principles/component-specification/10-sidecar-contract.md)                   | Runtime transformation & event I/O       |
| Service Contracts      | [04-service-contract.md](principles/service-specification/04-service-contract.md)                     | What services expose                     |
| Service Metadata       | [06-service-metadata.md](principles/service-specification/06-service-metadata.md)                     | spas.json schema                         |
| Message Transformation | [11-transformation-middleware.md](principles/component-specification/11-transformation-middleware.md) | Adaptation & mapping                     |
| Communication Protocol | [07-communication-model.md](principles/protocol-specification/07-communication-model.md)              | How services talk (HTTP PoC → gRPC prod) |
| Event Protocol         | [09-event-protocol.md](principles/protocol-specification/09-event-protocol.md)                        | CloudEvents + W3C Trace Context          |
| Architecture Decisions | [28-decision-log.md](principles/appendix/28-decision-log.md)                                          | Why SPAS looks like this                 |

## PoC Constraints & Simplifications

1. **HTTP-only** (not gRPC) — simplifies PoC, spec marks gRPC as production feature
2. **Repository storage layer** — decision deferred to Phase 2 execution (options: file-based, embedded database, or production-ready)
3. **Metadata-only policy** — security policies declared but not enforced in PoC
4. **Local identity** — "Identity in Payload" (JWT/claims embedded in request)
5. **No service mesh** — SPAS sidecar runs independently; no Istio/Linkerd
6. **Redis Streams** (not Kafka) — simpler for local dev, sufficient for PoC traces
7. **Zipkin tracing** — not production-grade observability, but demonstrates concepts

All marked in principles as `PoC` vs `Production` using admonition blocks (see principles/02-architecture-overview.md).

## Notes for Cross-Machine Handoff

**Document to read first on new machine:**

1. This file (TASKS.md) — status + next step
2. `specs/001-dotnet-spas-sdk/tasks.md` — detailed SDK implementation status
3. `specs/001-dotnet-spas-sdk/plan.md` — SDK architecture and design decisions
4. principles/INDEX.md — navigation to all specs
5. principles/02-architecture-overview.md — architecture overview
6. principles/appendix/28-decision-log.md — design decisions
7. README.md — framework overview
8. prototypes/spas-sidecar-prototype/README.md — what sidecar does

**Last successful state (Dec 12, 2025):**

- Specification complete and internally consistent ✅
- Prototype fully operational with verified trace correlation ✅
- Documentation consolidated and cleaned up ✅
- .NET SDK Phase 3 (User Story 1) complete with auto-discovery ✅
- All 40 unit tests passing ✅

**Exact next step:**
→ **DECISION REQUIRED:** Choose next SDK user story to implement:
  - Option A: User Story 2 (Dev metadata endpoint `/_spas/metadata`) - enables CLI integration
  - Option B: User Story 3 (Event publishing with trace context) - enables async messaging
  - Option C: Implement build-time metadata generation (MSBuild task) - production pattern
→ Reference `specs/001-dotnet-spas-sdk/tasks.md` for detailed task breakdown

**Common gotchas:**

- Spec is the source-of-truth; implement to match spec examples (not the other way around)
- "PoC vs Production" markers in principles indicate what's simplified for PoC
- Architecture decisions (ADRs) in 28-decision-log.md explain "why" for each design choice
- Cross-reference using principles/INDEX.md for navigation (includes "by audience" sections)
- SDK attribute-based discovery uses reflection to avoid ASP.NET Core runtime dependencies

## SDK Implementation Details (Critical for Continuation)

### Architectural Decision: Attribute-Based Auto-Discovery

**Problem Identified:** Original Phase 3 implementation required developers to define contracts twice:
1. In actual endpoint code (`MapPost`, `MapGet`)
2. In manual `ContractsBuilder` registration

This violated DRY principles and created drift risk.

**Solution:** Attribute-based auto-discovery system (implemented Dec 12, 2025)

**Key Files:**
- `components/sdk/.net/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs`
  - `SpasCommandAttribute`, `SpasQueryAttribute`, `SpasEventAttribute`
- `components/sdk/.net/src/Spas.Sdk.Metadata/Discovery/MetadataDiscovery.cs`
  - Discovers events from assemblies via reflection
- `components/sdk/.net/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs`
  - Discovers endpoints from ASP.NET Core routing using reflection
  - Avoids direct ASP.NET Core runtime dependencies in SDK

**Usage Pattern:**
```csharp
// 1. Register SDK services
builder.Services.AddSpasMetadata(options => {
    options.AssembliesToScan.Add(typeof(Program).Assembly);
});

// 2. Define endpoints with attributes
app.MapPost("/commands/create-order", handler)
   .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0"));

[SpasEvent("OrderCreated", "1.0")]
public record OrderCreatedEvent(...);

// 3. Auto-discover all contracts
var contracts = app.DiscoverSpasMetadata();

// 4. Compose spas.json
var composer = new SpasComposer();
composer.ComposeToFile(path, identity, contracts, security, health);
```

### ComposeToFile Pattern Discussion

**Current State:** `SpasComposer.ComposeToFile()` called in `SampleService/Program.cs` on every startup

**Question Raised:** Is this only for testing?

**Answer:** YES - for demonstration/PoC only. Production should NOT generate metadata at runtime.

**Production Patterns (choose one for User Story 2):**

1. **Dev Endpoint Pattern** (User Story 2):
   - Expose `/_spas/metadata` endpoint in Development only
   - CLI calls `GET /_spas/metadata` to retrieve composed metadata
   - Disabled in Production environment
   - **Pros:** Easy dev experience, no build-time overhead
   - **Cons:** Requires running service to get metadata

2. **Build-Time Generation Pattern**:
   - MSBuild task generates spas.json during `dotnet publish`
   - Metadata included in build output
   - No runtime overhead
   - **Pros:** Production-ready, no runtime permissions needed
   - **Cons:** More complex build integration

3. **CLI-Driven Pattern** (requires endpoint or build-time gen):
   - `spas-service metadata get` retrieves from dev endpoint or build output
   - `spas-service pack` packages metadata + schemas
   - `spas-service publish` pushes to repository
   - **Pros:** Matches SPAS specification workflow
   - **Cons:** Requires #1 or #2 implemented first

**Recommendation:** Implement User Story 2 (dev endpoint) next to enable CLI integration workflow.

**References:**
- Spec: `principles/component-specification/12-sdk-specification.md` (Design-time metadata endpoint)
- Spec: `principles/service-specification/06-service-metadata.md` (Metadata endpoints)
- Tasks: `specs/001-dotnet-spas-sdk/tasks.md` Phase 4 (User Story 2 tasks T039-T044)

## Recent Status (Dec 12, 2025)

**.NET SDK Phase 3 completed:**

- Attribute-based auto-discovery system implemented (fixes DRY violation)
- 40 unit tests passing
- SampleService demonstrates end-to-end metadata composition
- Documented ComposeToFile pattern as demo-only (not production pattern)
- Identified next decision: User Story 2 (dev endpoint) vs build-time generation

**Previous Status (Dec 11, 2025):**

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
