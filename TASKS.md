# SPAS PoC Implementation Handoff Guide

**Purpose:** Enable agents to continue PoC implementation across machines without losing context.

---

## Agent Handoff Update (Dec 14, 2025)

This section documents the latest actions, any issues encountered, and the exact next steps so another agent can resume seamlessly.

### What Was Done (spas-compose CLI Implementation, Phases 1-6 Complete)

- **Feature [005-spas-compose-cli](./specs/005-spas-compose-cli/)** — ✅ Phases 1-6 Complete
- **Branch**: `005-spas-compose-cli`
- **Status**: Phase 7 (Polish) remaining

**Implementation Progress**:

| Phase   | Status      | Description                                             |
| ------- | ----------- | ------------------------------------------------------- |
| Phase 1 | ✅ Complete | Project setup (T001-T005)                               |
| Phase 2 | ✅ Complete | Foundational infrastructure (T006-T011)                 |
| Phase 3 | ✅ Complete | US1 - Init Domain Workspace (T012-T018)                 |
| Phase 4 | ✅ Complete | US2 - Pull Service Metadata (T019-T026)                 |
| Phase 5 | ✅ Complete | US3 - Deploy Choreography to Docker Compose (T027-T040) |
| Phase 6 | ✅ Complete | US4 - AI-Assisted Choreography Composition (T041-T047)  |
| Phase 7 | ⏸️ Pending  | Polish & Cross-Cutting Concerns (T048-T053)             |

**Test Status**: 67 tests passing

**Available Commands**:

- `spas-compose init <name>` - Create domain workspace with agent prompt
- `spas-compose services pull <name> <version>` - Pull service metadata from Repository
- `spas-compose choreography deploy --docker` - Generate Docker Compose deployment

**Key Implementation Notes**:

- Agent prompt (`.github/agents/spas-compose.agent.md` + `.github/prompts/spas-compose.prompt.md`) created dynamically by `init` command
- Schema archive structure preserved: `schemas/endpoints/` and `schemas/events/` subdirectories
- JSONata validation using `jsonata` package for transformation syntax checking

> **E2E Verification Note**: Full end-to-end testing of `services pull` and AI composition
> requires SPAS Repository running with registered services. Unit tests pass but
> integration with live Repository deferred until Repository service is operational.

**Planning Artifacts Created**:

| Document                                                                                              | Purpose                                                                     |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [plan.md](./specs/005-spas-compose-cli/plan.md)                                                       | Tech stack (Node.js 20 + TypeScript), constitution check, project structure |
| [data-model.md](./specs/005-spas-compose-cli/data-model.md)                                           | Domain Workspace, Choreography, Transformation, Pulled Service entities     |
| [contracts/cli-commands.md](./specs/005-spas-compose-cli/contracts/cli-commands.md)                   | Full CLI interface with arguments, options, exit codes, output formats      |
| [contracts/choreography-schema.yaml](./specs/005-spas-compose-cli/contracts/choreography-schema.yaml) | JSON Schema for choreography.yaml validation                                |
| [contracts/agent-prompt.md](./specs/005-spas-compose-cli/contracts/agent-prompt.md)                   | /spas.compose agent prompt responsibilities and workflow                    |
| [quickstart.md](./specs/005-spas-compose-cli/quickstart.md)                                           | Developer workflow: init → pull → compose → deploy                          |
| [tasks.md](./specs/005-spas-compose-cli/tasks.md)                                                     | 53 implementation tasks organized by user story                             |

**Key Design Decisions (ADRs 036-038)**:

- JSONata for transformation files (language-agnostic for future sidecar migration)
- AI-in-the-loop composition via `/spas.compose` agent prompt
- Single `choreography.yaml` with named flows

**Task Summary**:

- Total: 53 tasks, 17 parallel opportunities
- User Stories: US1 (init), US2 (pull), US3 (deploy), US4 (AI composition)
- Estimated effort: ~10 hours

**Code Reuse Decision**: Copy spas-service CLI's repository-client.ts pattern with `// TODO: Extract to @spas/cli-common post-PoC` comment (documented in T011).

### What Failed or Required Adjustment

- Nothing failed in this session
- SDK SampleService `dotnet run` still exits with code 1 (pre-existing issue, not addressed)
- Archive structure alignment: Updated `pull-service.ts` to preserve `schemas/endpoints/` and `schemas/events/` subdirectories

### Precise Next Steps (Pick and execute)

1. **Complete Phase 7 (Polish)**: Execute remaining tasks T048-T053

   - Update README.md with full command reference
   - Add --verbose flag support
   - Run lint/format checks
   - Test npm link installation

2. **E2E Integration Testing** (requires Repository):

   - Start Repository: `cd components/repository && docker compose up`
   - Register test services via spas-service CLI
   - Test full workflow: `spas-compose init` → `services pull` → `choreography deploy`

3. **AI Composition Testing** (requires services):
   - Pull real services into domain workspace
   - Test `/spas.compose` agent prompt with VS Code Copilot

### Completed Features Summary

| Feature            | Spec                                                                    | Status               | Tests |
| ------------------ | ----------------------------------------------------------------------- | -------------------- | ----- |
| .NET SDK           | [001-dotnet-spas-sdk](./specs/001-dotnet-spas-sdk/)                     | ✅ Complete          | 88/88 |
| Schema Alignment   | [002-metadata-schema-alignment](./specs/002-metadata-schema-alignment/) | ✅ Complete          | —     |
| Repository Service | [003-repository-service](./specs/003-repository-service/)               | ✅ Complete          | 35/35 |
| spas-service CLI   | [004-spas-service-cli](./specs/004-spas-service-cli/)                   | ✅ Complete          | 48/48 |
| spas-compose CLI   | [005-spas-compose-cli](./specs/005-spas-compose-cli/)                   | ⏳ Phase 7 Pending   | 67/67 |

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

### Phase 3: CLI Tool

**Goal:** Enable service packaging and composition workflow.

**Spec Cross-Reference:** `principles/component/13-cli.md` (source-of-truth)

**Implementation Plan:** To be determined during this phase.

- Define command structure and argument patterns (service vs. compose commands)
- Plan SDK integration points (metadata authoring, validation)
- Design workflow sequence (init → pack → publish → pull → generate)
- Plan integration with Repository Service API
- Plan integration with Sidecar configuration generation

**Prioritized Commands for Phase 3:**

- Service management: init, metadata get, pack, publish, pull
- Composition: init, services pull, choreography deploy (AI-assisted via `/spas.compose` prompt)

**Outputs:**

- `src/cli/` tool (ready to ship as NuGet package or standalone)
- Integration tests showing full workflow (init → pack → publish → pull → generate)
- CLI usage guide and examples

---

### Phase 4: E-Commerce End-to-End PoC

**Goal:** Demonstrate full SPAS framework in realistic multi-service scenario.

**Spec Cross-Reference:**

- `principles/02-architecture-overview.md` (architecture)
- `principles/service/04-service-contract.md` (service contracts)
- `principles/component/14-domain-choreography.md` (adaptation rules)

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
├── components/                        # 🔨 TO BUILD - PoC framework components (to evolve to production-ready in future)
│   ├── sdk/                           # SDKs for multiple languages
│   │   ├── dotnet/                    # .NET SDK for SPAS service development
│   │   │   ├── src/                   # Contains source code for .NET SDKs
│   │   │   ├── test/                  # Unit test code for .NET SDKs
│   │   │   ├── SPAS.SDK.sln           # SDK .NET solution file
│   │   │   └── README.md              # SDK documentation (keyed to principles/12-sdk.md)
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
│   │   └── README.md                  # CLI documentation (keyed to principles/13-cli.md)
│   │
│   ├── repository/                    # SPAS Repository Service (metadata + schema storage)
│   │   ├── src/                       # SPAS Repository service source code
│   │   ├── test/                      # SPAS Repository test
│   │   └── README.md                  # Repository API docs (keyed to principles/11-repository.md)
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
