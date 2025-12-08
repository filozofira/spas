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
- **DAPR Middleware Prototype:** Complete. **Finding:** Dapr HTTP pipeline middleware (`middleware.http.httpendpoint`) does not intercept pubsub messages.
  - Messages flow end-to-end (publisher → sidecar → subscriber) successfully.
  - Middleware endpoint is configured and reachable but **never gets called**.
  - Likely cause: Dapr's HTTP pipeline only applies to north-south (app invoke) traffic, not east-west (pubsub delivery). Pubsub routing bypasses the HTTP pipeline.
  - **Impact:** Cannot use Dapr's built-in middleware for transformation on inbound pubsub events (discovery contradicts our earlier PoC plan).

## Next Steps

### 1. Transformation Strategy Decision (Priority: High - Blocker) - DECIDED: Adapter Container

**Decision:** Pursue **Sidecar-Adjacent Adapter Container** pattern.

**Why:** Keeps services agnostic to domain-specific transformations; aligns with "sidecar" philosophy; external adapter can be reused/evolved independently.

**Implementation Plan:**

1. Create `prototypes/dapr-middleware/adapter` container:
   - Subscribes directly to Redis pubsub (topic: `orders-raw` or similar).
   - Applies transformation rules (read from a config file or API).
   - Publishes transformed message to `orders` topic.
   - Subscriber listens on `orders` (transformed).

2. Publisher still sends to `orders-raw`.

3. Test:
   - Publisher sends original event.
   - Adapter intercepts, transforms (adds `transformed_inbound: true`), republishes to `orders`.
   - Subscriber receives transformed event and logs it.

4. Outcome: Validates the adapter pattern works for PoC; service receives transformed payload without knowing it happened.

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
