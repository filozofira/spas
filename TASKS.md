# Intro

This document is used to communicate agent context and memory across multiple machines.

To do this successfully follow these few rules:

- Use analysis as "Context Anchors" to record decisions:
  - Decision Records in `alignment-decisions-poc`: If you make a verbal decision in chat (e.g., "Let's use Payload for identity"), make the agent write it into alignment-decisions-poc.md.
    - Architecture Diagrams: The Mermaid/Draw.io diagrams in your repo provide massive context to the agent with very few tokens.
- Before you leave: Run a prompt like: "Update TASKS.md with the current status of the DAPR middleware prototype, what we tried, what failed, and exactly what the next step is."
- On the new machine: Your first prompt should be: "Read TASKS.md and analysis/alignment-decisions-poc.md. What is the immediate next task?".

## Current Status (Dec 8, 2025, Late Evening)

- **Architecture:** Aligned pending middleware validation results.
- **Structure:** Monorepo decision logged (ADR-019).
- **Methodology:** Selected `spec-kit` for component development.
- **DAPR Middleware Risk:** ⚠️ **ARCHITECTURE BLOCKER IDENTIFIED**
  - Attempted real DAPR integration (sidecar + Redis + pub/sub)
  - **Finding:** DAPR's built-in HTTP middleware component type (`middleware.http.transformation`) is NOT registered in daprd
  - **Error:** "HTTP middleware middleware.http.transformation/v1 has not been registered"
  - **Implication:** Cannot use DAPR's native middleware for transformations in PoC
  - **Resolution:** Must pivot to **Sidecar Adapter Pattern** - custom HTTP middleware container that sits between DAPR and service
  - **Prototype location:** `prototypes/dapr-middleware` (validates that middleware CAN work, but NOT as DAPR component)

## Next Steps

### 1. Architecture Decision: Sidecar Adapter Pattern (Priority: CRITICAL)

**Decision Required:**

Given that DAPR's built-in HTTP middleware is not available, we have two paths:

**Option A: Sidecar Adapter Container (Recommended)**
- Run custom middleware container (already proved it works!)
- DAPR sidecar forwards events to middleware on :8080
- Middleware transforms and calls service on :8081
- Adds one container per service, but transformation logic is clear and reusable
- Middleware can be language-agnostic (Go, Node, Python, etc.)
- Example: Our `dapr-middleware.go` already does this correctly

**Option B: SDK-Level Transformation Wrapper**
- Move all transformation logic into SPAS SDK
- SDK wraps message handlers at app startup
- Simpler deployment (no extra container), but less flexible
- Harder to share transformation definitions across services
- SDK must support all frameworks

**Recommendation:** Option A (Sidecar Adapter) - cleaner separation, more testable, aligns with "choreography via configuration"

### 2. Revised Prototype: Validate Sidecar Adapter Pattern

**Goal:** Confirm the existing middleware architecture works end-to-end with DAPR pub/sub routing
**Changes needed:**
- Remove invalid DAPR middleware component declaration
- Keep custom middleware sidecar container
- DAPR routes to middleware (not directly to service)
- Test full event flow: Publisher → DAPR → Middleware → Service

### 3. Update Architecture Spec

Once Sidecar Adapter validation succeeds:
- Document middleware placement in `spec/infrastructure`
- Update `spec/service-specification` with middleware interception points
- Define choreography.yaml transformation schema
- Update CLI docs for middleware scaffolding

### 4. Monorepo Initialization (Unblocked)

After middleware decision, proceed with:
- Create `src/sdk` (.NET SDK)
- Create `src/cli` (CLI Tool)
- Create `src/repository` (Repository Service)
- Create `examples/e-commerce` (End-to-End PoC)
