# Intro

This document is used to communicate agent context and memory across multiple machines.

To do this successfully follow these few rules:

- Use analysis as "Context Anchors" to record decisions:
  - Decision Records in `alignment-decisions-poc`: If you make a verbal decision in chat (e.g., "Let's use Payload for identity"), make the agent write it into alignment-decisions-poc.md.
    - Architecture Diagrams: The Mermaid/Draw.io diagrams in your repo provide massive context to the agent with very few tokens.
- Before you leave: Run a prompt like: "Update TASKS.md with the current status of the DAPR middleware prototype, what we tried, what failed, and exactly what the next step is."
- On the new machine: Your first prompt should be: "Read TASKS.md and analysis/alignment-decisions-poc.md. What is the immediate next task?".

## Current Status (Dec 8, 2025, Final)

- **Architecture:** Validated. DAPR middleware blocker confirmed and resolved.
- **Structure:** Monorepo decision logged (ADR-019).
- **Methodology:** Selected `spec-kit` for component development.
- **DAPR Middleware Validation:** ✓ **COMPLETE & CONFIRMED**
  - Tested with DAPR 1.16.3 (same error as initial test)
  - Finding: DAPR's HTTP middleware component type is NOT registered
  - Error: "HTTP middleware middleware.http.transformation/v1 has not been registered"
  - **Decision: Sidecar Adapter Pattern (LOCKED)**
  - Custom middleware container (Go, working) proven effective
  - Prototype: `prototypes/dapr-middleware/` ready for reference
  - No blocking issues remain for PoC initialization

## Next Steps

### 1. ✓ LOCKED: Architecture Decision: Sidecar Adapter Pattern

**Decision Made:**

Use **Sidecar Adapter Container** pattern for event transformation:
- Custom middleware container (language-agnostic, Go for PoC)
- DAPR sidecar routes to middleware on `:8080`
- Middleware transforms payloads, forwards to service on `:8081`
- Transformation logic defined in `choreography.yaml` (future enhancement)
- Benefits: Clear separation, testable, reusable across frameworks
- Proven in prototype: `prototypes/dapr-middleware/`

### 2. ✓ READY: Monorepo Initialization (Priority: High, Next)

**Goal:** Set up the physical folder structure for the PoC.
**Actions:**

- Create `src/sdk` (.NET SDK)
- Create `src/cli` (CLI Tool)
- Create `src/repository` (Repository Service)
- Create `src/sidecar` (Middleware templates)
- Create `examples/e-commerce` (End-to-End PoC)

### 3. Component Development (via Spec-Kit)

**Goal:** Build components iteratively using the specs as the source of truth.
**Sequence:**

1. **SDK:** Build `spas.json` authoring & serialization (.NET)
2. **Repository:** Build simple file-based storage & API (REST)
3. **CLI:** Build `spas-service pack` and `publish` (Go or C#)
4. **Middleware Template:** Scaffold Go middleware container
5. **E2E Example:** Order → Stock → Payment flow
