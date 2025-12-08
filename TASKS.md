# Intro

This document is used to communicate agent context and memory across multiple machines.

To do this successfully follow these few rules:

- Use analysis as "Context Anchors" to record decisions:
  - Decision Records in `alignment-decisions-poc`: If you make a verbal decision in chat (e.g., "Let's use Payload for identity"), make the agent write it into alignment-decisions-poc.md.
    - Architecture Diagrams: The Mermaid/Draw.io diagrams in your repo provide massive context to the agent with very few tokens.
- Before you leave: Run a prompt like: "Update TASKS.md with the current status of the DAPR middleware prototype, what we tried, what failed, and exactly what the next step is."
- On the new machine: Your first prompt should be: "Read TASKS.md and analysis/alignment-decisions-poc.md. What is the immediate next task?".

## Current Status (Dec 8, 2025 - Updated)

- **Architecture:** Aligned. Specs updated to reflect "HTTP-only PoC" and "Identity in Payload".
- **Structure:** Monorepo decision logged (ADR-019).
- **Methodology:** Selected `spec-kit` for component development.
- **SPAS Sidecar Prototype:** Complete and working. **Implementation:** Custom Node.js sidecar component.
  - Successfully handles message transformation for both publishers and subscribers.
  - CloudEvents 1.0 wrapper with W3C Trace Context for distributed tracing.
  - Full Zipkin integration with correlated traces across service boundaries.
  - Each service has dedicated sidecar instance handling transformation + pub/sub.
  - **Architecture:** Service → Sidecar (transform) → Redis → Sidecar (transform) → Service.
  - **Previous Finding:** DAPR HTTP middleware doesn't intercept pub/sub messages, leading to custom sidecar approach.

## Next Steps

### 1. Transformation Strategy - COMPLETE: SPAS Sidecar Component ✅

**Implementation:** Custom **SPAS Sidecar** pattern implemented and validated.

**What was built:**

- Generic Node.js sidecar component (`spas-sidecar`) with:
  - Configurable transformation functions (input/output)
  - Redis pub/sub integration
  - CloudEvents 1.0 message wrapping
  - W3C Trace Context propagation
  - Zipkin distributed tracing with correlated traces
  - HTTP endpoints for service integration

**Architecture Validated:**

- Each service gets dedicated sidecar instance
- order-service → order-service-sidecar → Redis → fulfillment-service-sidecar → fulfillment-service
- Transformations executed transparently without service knowledge
- Full end-to-end observability with Zipkin

**Location:** `prototypes/spas-sidecar-prototype/`

**Status:** Prototype complete, all traces correlating correctly, ready for framework integration.

### 2. Monorepo Initialization (Deferred until Adapter PoC Complete)

- Create `src/sdk` (.NET SDK)
- Create `src/cli` (CLI Tool)
- Create `src/repository` (Repository Service)
- Create `src/sidecar` (DAPR Configs)
- Create `examples/e-commerce` (End-to-End PoC)

### 3. Component Development (via Spec-Kit)

**Goal:** Build components iteratively using the specs as the source of truth.
**Sequence:**

1. **SDK:** Build `spas.json` authoring & serialization.
2. **Repository:** Build simple file-based storage & API.
3. **CLI:** Build `spas-service pack` and `publish`.
