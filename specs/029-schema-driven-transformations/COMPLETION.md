# Enhancement: Schema-Driven Transformation Generation

**Feature Branch**: `029-schema-driven-transformations`  
**Created**: 2026-01-02  
**Completed**: 2026-01-02  
**Status**: ✅ Complete  

## Problem Statement

During testing of the basket-checkout flow, the AI agent correctly deduced the choreography flow but generated trivial identity transformations (`$.data`) instead of proper field mappings. The agent explained:

> "Because I stopped at a minimal, schema‑agnostic default. Given only the spas.json contracts, I inferred that event payloads already contain all order details... Without actually inspecting the concrete request/response and event schemas under `schemas/endpoints` and `schemas/events`, any non‑trivial JSONata mapping would have been a guess."

**Root Cause**: The agent prompt instructed schema reading in Phase 1 only superficially ("Note schemas for payloads and responses") and Phase 3 (Generate) jumped directly to creating transformation files without an explicit schema-reading step. A cautious agent correctly avoided fabricating field mappings without concrete evidence.

## Solution

Enhanced the agent prompt workflow in `workflow-phases.eta` with explicit schema-driven transformation requirements:

### Change 1: Strengthened Phase 1 (Analyze)

Added explicit instruction to read schema files during service analysis:

```diff
 1. **Read Service Contracts**
    - Read `spas.json` for all services in `{domainRoot}/{DOMAIN}/services/`
    - Identify available events (published) and endpoints (subscribed)
-   - Note schemas for payloads and responses
+   - Read at least one schema file per service to understand concrete field structures:
+     - Event schemas: `services/<service>/schemas/events/<event-type>.schema.json`
+     - Endpoint schemas: `services/<service>/schemas/endpoints/<endpoint>.schema.json`
+   - Note field names, types, and `required` arrays from schemas
```

### Change 2: Added Pre-Generation Schema Reading Step (Phase 3)

Inserted a mandatory schema reading step before transformation file creation:

```markdown
1. **Read Source and Target Schemas (REQUIRED)**
   - For each event-to-endpoint mapping identified in Phase 2:
     a. Read the **source event schema** from `services/<publisher>/schemas/events/<event-type>.schema.json`
     b. Read the **target endpoint schema** from `services/<subscriber>/schemas/endpoints/<endpoint>.schema.json`
   - Identify the concrete field names, types, and required fields from both schemas
   - Document the field mapping before writing JSONata:
     ```
     Source (order-created)    →  Target (create-fulfillment-request)
     ────────────────────────────────────────────────────────────────
     orderId                   →  orderId
     items[].productId         →  lineItems[].sku
     items[].quantity          →  lineItems[].qty
     customerId                →  customerId (required)
     ```
   - If schemas are missing, report this explicitly and ask for guidance
```

### Change 3: Added Derived Fields Detection (Phase 3)

Inserted step to identify and document fields requiring conditional logic:

```markdown
2. **Identify Derived Fields (REQUIRED)**
   - After documenting field mappings, identify target fields with NO direct source:
     - Fields requiring **conditional logic** (e.g., presence-based derivation)
     - Fields requiring **enum mapping** (e.g., source value → target enum)
     - Fields requiring **default values** (source optional, target required)
   - Document derivation logic explicitly
   - If derivation logic is unclear, ASK the user before generating
   
   **Common Derivation Patterns:**
   | Pattern | Example | JSONata |
   |---------|---------|---------|
   | Presence-based | If address exists → SHIPPING | `$exists(shippingAddress) ? "SHIPPING" : "PICKUP"` |
   | Enum mapping | "express" → "HIGH" | `type = "express" ? "HIGH" : "NORMAL"` |
   | Fallback default | Missing → default | `field ? field : "default"` |
```

### Change 4: Added Schema-Driven Mapping Requirements

Added explicit prohibition of identity transforms:

```markdown
**Schema-Driven Mapping (REQUIRED)**:
- NEVER use identity transforms like `$.data` or `$` as placeholders
- Every field in the target schema MUST be explicitly mapped from the source schema
- If a source field name differs from target field name, create explicit mapping
- If a required target field has no source equivalent, flag as error and ask for guidance
```

## Files Modified

| File | Change |
|------|--------|
| [workflow-phases.eta](../../components/cli/spas-compose/src/templates/partials/workflow-phases.eta) | Added schema reading requirements to Phase 1 and Phase 3, prohibited identity transforms, added derived fields detection |
| [init.ts](../../components/cli/spas-compose/src/commands/init.ts) | Fixed git root search to always start from cwd |
| [inbound-order-confirmed.jsonata](../../examples/domains/basket-checkout/transformations/fulfillment-service/inbound-order-confirmed.jsonata) | Fixed deliveryMethod to use conditional logic |

## Bug Fixes

### Fix: Agent Files Placed in Wrong Directory

**Problem**: When running `spas-compose init basket-checkout --output .\domains\`, the `.github` folder was created at `domains\.github` instead of the project root.

**Root Cause**: The `findGitRoot()` search started from the `--output` path instead of the current working directory. If the output path was new or didn't contain a `.git` folder, the git root wasn't found and the fallback placed `.github` at the output directory.

**Fix**: Changed `init.ts` to always search for git root from `process.cwd()`:

```diff
- const searchStart = options.output ? resolve(options.output) : process.cwd();
- const projectRoot = findGitRoot(searchStart);
+ const projectRoot = findGitRoot(process.cwd());
```

**File**: [init.ts](../../components/cli/spas-compose/src/commands/init.ts)

### Fix: Terminal Events Omitted from Choreography

**Problem**: Agents often skip terminal events (events with no downstream consumers) when generating choreography.yaml, causing incomplete flows and missing audit/observability data.

**Root Cause**: The choreography schema example only showed events WITH targets. Agents assumed all events need targets and omitted events like `order-confirmed` or `shipment-delivered`.

**Fix**: Enhanced Phase 2 (Propose) with:
1. Updated schema example showing terminal event with `targets: []`
2. Added explicit step "Identify Terminal Events (REQUIRED)"
3. Updated confirmation gate to report terminal event count

```yaml
# Terminal event - no consumers in this choreography
- source: <final-service>
  event: <terminal-event>
  topic: <topic-name>
  targets: []  # Published for audit/logging/future extension
```

**File**: [workflow-phases.eta](../../components/cli/spas-compose/src/templates/partials/workflow-phases.eta)

### Fix: Complexity-Based Diagram Selection

**Problem**: Single diagram style doesn't work for all choreographies. Simple flows get cluttered with complex notation, while complex flows become unreadable in a single diagram.

**Fix**: Added diagram style selection based on complexity:

| Complexity | Criteria | Style |
|------------|----------|-------|
| **Simple** | ≤4 services, linear flow, no branching | Single flowchart |
| **Complex** | >4 services, multiple paths, error handling | Separate diagram per scenario |

For complex flows, agents now generate separate diagrams per scenario (happy path, error path, cancellation) with descriptive headers.

**File**: [workflow-phases.eta](../../components/cli/spas-compose/src/templates/partials/workflow-phases.eta)

## Expected Outcome

- Agent will read concrete schema files before generating transformations
- Field mappings will be based on actual schema structures, not guesses
- Identity transforms (`$.data`) will be avoided
- Missing required fields will be flagged before validation phase
- Terminal events will be included in choreography with `targets: []`
- Diagrams will be appropriately styled based on choreography complexity

## Testing

To verify the fix:
1. Initialize a new domain workspace with `spas-compose init`
2. Pull services with different schema structures
3. Invoke `/spas.compose DOMAIN:<name> Analyze...`
4. Observe that Phase 3 now includes explicit field mapping documentation before JSONata generation
5. Verify terminal events are listed in proposed choreography with `targets: []`
6. For complex flows (>4 services), verify separate diagrams per scenario are generated
