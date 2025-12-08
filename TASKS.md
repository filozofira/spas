# Intro

This document is used to communicate agent context and memory across multiple machines.

To do this successfully follow these few rules:

- Use analysis as "Context Anchors" to record decisions:
  - Decision Records in `alignment-decisions-poc`: If you make a verbal decision in chat (e.g., "Let's use Payload for identity"), make the agent write it into alignment-decisions-poc.md.
    - Architecture Diagrams: The Mermaid/Draw.io diagrams in your repo provide massive context to the agent with very few tokens.
- Before you leave: Run a prompt documenting the current status, what was tried, what failed, and exactly what the next step is.
- On the new machine: Your first prompt should be: "Read TASKS.md and analysis/alignment-decisions-poc.md. What is the immediate next task?".

## Current Status (Dec 8, 2025 - UPDATED)

- **Architecture:** Aligned. Specs updated to reflect "HTTP-only PoC" and "Identity in Payload".
- **Structure:** Monorepo decision logged (ADR-019).
- **Methodology:** Selected `spec-kit` for component development.
- **SPAS Sidecar Prototype:** ✅ COMPLETE AND FULLY OPERATIONAL
  - Successfully handles bidirectional message transformation for publishers and subscribers
  - CloudEvents 1.0 wrapper with W3C Trace Context for distributed tracing
  - **Full end-to-end trace correlation verified** - same trace ID propagates through entire event lifecycle
  - Zipkin integration with correlated spans across all service boundaries
  - Each service has dedicated sidecar instance handling transformation + pub/sub
  - **Architecture:** Service → Sidecar (transform) → Redis → Sidecar (transform) → Service
  - **Bidirectional Flow:** order-service ↔ fulfillment-service with event correlation
  - **Status:** Prototype complete, all traces correlating correctly, ready for framework integration

## Next Steps

### 1. Transformation Strategy - ✅ COMPLETE: SPAS Sidecar Component

**Implementation:** Custom **SPAS Sidecar** pattern implemented and fully validated.

**What was built:**

- Generic Node.js sidecar component (`spas-sidecar`) with:
  - Configurable transformation functions (input/output)
  - Redis Stream integration (pub/sub messaging)
  - CloudEvents 1.0 message wrapping
  - W3C Trace Context propagation
  - Zipkin distributed tracing with fully correlated traces
  - HTTP endpoints for service integration

**Architecture Validated:**

- Bidirectional message flow: order-service ↔ fulfillment-service
- order-service publishes orders with W3C traceparent
- fulfillment-service-sidecar receives, transforms, invokes fulfillment-service
- fulfillment-service publishes fulfillment events with **same trace ID**
- order-service-sidecar receives, transforms, invokes order-service
- **Complete trace correlation**: Same trace ID appears at all stages
  - Stage 1: order-service publishes with trace ID X
  - Stage 2: fulfillment-service processes with trace ID X
  - Stage 3: order-service receives response with trace ID X ✅
- Transformations executed transparently without service knowledge
- Full end-to-end observability with Zipkin showing all spans

**Trace Flow Verified:**

```
order-service (publishes) 
  → order-service-sidecar (transforms, publishes to Redis)
    → fulfillment-service-sidecar (subscribes, transforms, invokes)
      → fulfillment-service (processes, publishes response)
        → fulfillment-service-sidecar (transforms, publishes to Redis)
          → order-service-sidecar (subscribes, transforms, invokes)
            → order-service (receives with SAME trace ID ✅)
```

**Location:** `prototypes/spas-sidecar-prototype/`

**Status:** Prototype complete, bidirectional event correlation working, ready for framework integration as production component.

### 2. Monorepo Initialization

- Create `src/sdk` (.NET SDK)
- Create `src/cli` (CLI Tool)
- Create `src/repository` (Repository Service)
- ~~Create `src/sidecar` (DAPR Configs)~~ **DROPPED:** SPAS sidecar already implemented in `prototypes/spas-sidecar-prototype/`. To be integrated as framework component in `src/sidecar` with production-ready features.
- Create `examples/e-commerce` (End-to-End PoC)

### 3. Component Development (via Spec-Kit)

**Goal:** Build components iteratively using the specs as the source of truth.
**Sequence:**

1. **SDK:** Build `spas.json` authoring & serialization.
2. **Repository:** Build simple file-based storage & API.
3. **CLI:** Build `spas-service pack` and `publish`.
