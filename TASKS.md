# Intro

This document is used to communicate agent context and memory across multiple machines.

To do this successfully follow these few rules:

- Use analysis as "Context Anchors" to record decisions:
  - Decision Records in `alignment-decisions-poc`: If you make a verbal decision in chat (e.g., "Let's use Payload for identity"), make the agent write it into alignment-decisions-poc.md.
    - Architecture Diagrams: The Mermaid/Draw.io diagrams in your repo provide massive context to the agent with very few tokens.
- Before you leave: Run a prompt like: "Update TASKS.md with the current status of the DAPR middleware prototype, what we tried, what failed, and exactly what the next step is."
- On the new machine: Your first prompt should be: "Read TASKS.md and analysis/alignment-decisions-poc.md. What is the immediate next task?".

## Current Status (Dec 8, 2025)

- **Architecture:** Aligned. Specs updated to reflect "HTTP-only PoC" and "Identity in Payload".
- **Structure:** Monorepo decision logged (ADR-019).
- **Methodology:** Selected `spec-kit` for component development.
- **Immediate Blocker:** Need to verify DAPR HTTP Middleware capability to intercept and transform events *after* subscription routing but *before* service invocation.

## Next Steps

### 1. Prototype: DAPR Middleware Risk (Priority: High)

**Goal:** Prove DAPR Custom HTTP Middleware can intercept inbound Pub/Sub events and modify the payload before the app receives it, as well as outbound messages and modify the payload before they are dispatched to event topic.
**Location:** `prototypes/dapr-middleware`
**Plan:**

1. Initialize `spec-kit` in `prototypes/dapr-middleware`.
2. Create a minimal DAPR setup:
   - **Publisher:** Simple script/app to send a CloudEvent.
   - **Subscriber:** DAPR sidecar + Dummy App (e.g., simple HTTP echo server).
   - **Middleware:** Go/Python/Node middleware to intercept inbound POST requests and outbound publish requests.
3. **The Test:**
   - **Inbound:** Middleware intercepts event delivered to app, injects `{"transformed_inbound": true}`. App asserts receipt.
   - **Outbound:** App calls DAPR publish. Middleware intercepts request to DAPR, injects `{"transformed_outbound": true}`. Subscriber asserts receipt of modified payload.
4. **Success Criteria:** App receives modified inbound payload; Subscriber receives modified outbound payload.
5. **Failure Plan:** If middleware runs *before* routing (and thus can't distinguish topics easily) or cannot modify body, we must pivot to "Sidecar Adapter Container" pattern.

### 2. Monorepo Initialization

**Goal:** Set up the physical folder structure for the PoC.
**Actions:**

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
