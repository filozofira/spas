# SPAS PoC Implementation Handoff Guide

**Purpose:** Enable agents to continue PoC implementation across machines without losing context.

---

## Agent Handoff Update (Dec 17, 2025)

This section documents the latest actions, any issues encountered, and the exact next steps so another agent can resume seamlessly.

### What Was Done (Dec 17, 2025) - E2E Choreography Debugging Complete

**Branch:** `fix_issues_found_during_example_choreography` (ready for PR)

- **SDK camelCase Schema Fix**: 
  - `SchemaGenerator.cs` was generating PascalCase property names while runtime serialization used camelCase
  - Added `SystemTextJsonSchemaGeneratorSettings` with `JsonNamingPolicy.CamelCase`
  - Updated tests to expect camelCase
  - Documented in ADR-040

- **E2E Choreography Flow Fixed and Verified**:
  - Full round-trip working: POST /orders → order-created → inventory-service → stock-reserved → order confirmed
  - Zipkin traces showing complete W3C Trace Context propagation

- **Issues Fixed During E2E Testing**:
  1. **Docker "invalid reference format"**: Newline character in inventory-service `spas.json` runtime.repository field
  2. **JSONata single-element array bug**: `items.{...}` returns object for 1-element arrays - fixed with `$append([], items.{...})` pattern
  3. **Wrong endpoint routing**: order-service config routed `stock-reserved` to `/incoming` instead of `/events/stock-reserved`
  4. **Transform field mapping**: Fixed `inbound-stock-reserved.jsonata` to map `reservations` → `reservedItems`, `timestamp` → `reservedAt`

- **Files Changed (Dec 17):**
  - `components/sdk/dotnet/src/Spas.Sdk/SchemaGenerator.cs` - camelCase schema generation
  - `components/sdk/dotnet/test/Spas.Sdk.Tests/SchemaGeneratorTests.cs` - Updated expectations
  - `components/sdk/dotnet/test/Spas.Sdk.Tests/MetadataEndpointIntegrationTests.cs` - Updated expectations
  - `examples/ecommerce/public/transformations/inventory-service/inbound-order-created.jsonata` - Array fix + required fields
  - `examples/ecommerce/public/transformations/order-service/inbound-stock-reserved.jsonata` - Field mapping fix
  - `examples/ecommerce/public/config.order-service.json` - Endpoint routing fix
  - `principles/appendix/28-decision-log.md` - Added ADR-040 (camelCase schema generation)
  - `specs/005-spas-compose-cli/COMPLETION.md` - Added Known Limitations section
  - `components/cli/spas-compose/src/sidecar-config-generator/templates.ts` - Agent prompt with JSONata array pattern

- **Documentation Added**:
  - **ADR-040**: Schema property naming uses camelCase to match System.Text.Json runtime
  - **Known Limitation 1**: `invokeEndpoint` defaults to `/incoming`, services with event-specific endpoints need manual override
  - **Known Limitation 2**: JSONata `array.{...}` returns object for single-element arrays - use `$append([], ...)` pattern

- **Tests Verified**:
  - SDK tests: All passing
  - CLI tests: 172 passing

### What Failed / Lessons Learned

1. **SDK schema generation MUST match runtime serialization policy** - JsonSchema.Net defaults to property names, but System.Text.Json uses camelCase by default
2. **JSONata `array.{...}` is NOT safe for arrays** - Always use `$append([], array.{...})` to preserve array type
3. **Services may expose event-specific endpoints** - Don't assume all events go to `/incoming`
4. **Transform field names must match target DTO exactly** - camelCase property names in JSON

### Precise Next Steps (Pick and execute IN ORDER)

1. **Merge current branch** — `fix_issues_found_during_example_choreography` has all E2E fixes ready for PR

2. **Review completed specs** — Specs 009-012 completed all FG05-FG09 bug fixes:
   - Spec 009: Image references, sidecar config generation, port configurations, init --output
   - Spec 010: Sidecar transform file loading
   - Spec 011: SDK sidecar host derivation
   - Spec 012: CloudEvents type construction refactor

3. **Phase 3: B2B Subscription Choreography** — Proves service reuse across domains
   - Use same order-service/inventory-service in different domain context
   - Create async-first choreography workflow
   - Verify services work without code changes

4. **Consider remaining grooming features** — See [GROOMING.md](./GROOMING.md) for FG01-FG04

### Key Files for Context

- **[examples/README.md](./examples/README.md)** — Phase 1 & 2 complete, sequence diagrams, running instructions
- **[GROOMING.md](./GROOMING.md)** — Remaining features to groom (FG01-FG04)
- **[principles/appendix/28-decision-log.md](./principles/appendix/28-decision-log.md)** — ADR-040 for camelCase decision
- **[specs/005-spas-compose-cli/COMPLETION.md](./specs/005-spas-compose-cli/COMPLETION.md)** — Known Limitations section
- **[specs/009-compose-generator-fixes/](./specs/009-compose-generator-fixes/)** — All generator fixes completed
- **[specs/012-cloudevents-type-refactor/](./specs/012-cloudevents-type-refactor/)** — CloudEvents type refactor complete

### Technical Patterns Discovered

```jsonata
// ALWAYS use $append for array preservation in JSONata transforms
{
  "items": $append([], sourceArray.{ "field": $.value })
}
```

```csharp
// SDK schema generation must use camelCase to match runtime
var settings = new SystemTextJsonSchemaGeneratorSettings {
    SerializerOptions = new JsonSerializerOptions { 
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
    }
};
```

## 📋 Key Rules for Multi-Machine Continuity

1. **Before leaving a machine:** Document exactly what was done, what failed, and precise next steps in this file so agents on other machines can pick up from where you stopped.
2. **On new machine:** Always read this file + examples/README.md + principles/appendix/28-decision-log.md first.
3. **Architecture diagrams:** Mermaid diagrams in principles/, prototypes/, and examples/ provide massive context with minimal tokens.
4. **Specification is source-of-truth:** All implementation drives from principles/, cross-referenced via ./principles/README.md.
5. **Track decisions:** New architectural decisions get recorded in principles/appendix/28-decision-log.md as ADRs.

### 🚀 Agent Handoff Prompt (Use This First)

When an agent starts work on another machine, use this prompt:

```text
You are continuing SPAS (Self-contained, Portable, Adaptable Services)
framework PoC implementation. Read these context files first:

1. ./TASKS.md (this file) - Project status, decisions, and next steps
2. ./examples/README.md - Phase 5 E-Commerce example design (CURRENT FOCUS)
3. ./.github/agents/copilot-instructions.md - agent instructions
4. .specify/memory/constitution.md - GitHub SpecKit constitution file generated by copilot
5. ./README.md - SPAS framework overview and current achievements
6. ./principles/README.md - Complete specification navigation
7. ./principles/appendix/28-decision-log.md - Architecture decisions (ADRs)
8. ./principles/02-architecture-overview.md - High-level system design
9. ./specs (all files in subfolders) - contains GitHub SpecKit specifications for features
10. ./prototypes/spas-sidecar-prototype/README.md - Prototype documentation

Once read, answer: "What is the immediate next task and what implementation artifacts from the spec should guide it?"
```

## Remaining Phases

### Phase 5: E-Commerce End-to-End PoC ← CURRENT

**Status:** 🔨 Design Complete — Implementation Phase 1 Ready

**Design Document:** [examples/README.md](./examples/README.md)

**Goal:** Demonstrate full SPAS framework in realistic multi-service scenario with service reuse across domains.

**Implementation Phases:**

| Phase  | Description                                  | Status      |
| ------ | -------------------------------------------- | ----------- |
| Design | Complete design document with all 7 sections | ✅ Complete |
| 1      | Core services + Repository integration       | 🔲 Next     |
| 2      | E-Commerce public choreography               | 🔲 Pending  |
| 3      | B2B subscription choreography                | 🔲 Pending  |
| 4      | Documentation & polish                       | 🔲 Pending  |
| 5      | Product service (optional)                   | 🔲 TBD      |

**Spec Cross-Reference:**

- `examples/README.md` (design decisions, service portfolio, event flows)
- `principles/02-architecture-overview.md` (architecture)
- `principles/service/04-service-contract.md` (service contracts)
- `principles/component/14-domain-choreography.md` (adaptation rules)

**Prerequisites:** Phase 4 (Sidecar) complete ✓

**Outputs:**

- `examples/services/` — SPAS-compliant services (.NET + SDK)
- `examples/stubs/` — Domain-specific stubs (Node.js)
- `examples/gateways/` — Custom API gateway (Node.js)
- `examples/domains/` — Domain deployments with choreography and docker-compose

---

## Reference Links

Permanent documentation for spec cross-referencing and constraints:

| Topic                                   | Location                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Spec navigation & cross-reference guide | [principles/README.md](./principles/README.md)                                     |
| PoC constraints & simplifications       | [principles/02-architecture-overview.md](./principles/02-architecture-overview.md) |
| Architecture decisions (ADRs)           | [principles/appendix/28-decision-log.md](./principles/appendix/28-decision-log.md) |
| Phase 5 folder structure                | [examples/README.md](./examples/README.md)                                         |
| GitHub SpecKit specs                    | [specs/README.md](./specs/README.md)                                               |
| Components                              | [components/README.md](./components/README.md)                                     |
