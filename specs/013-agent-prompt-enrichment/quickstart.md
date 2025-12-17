# Quickstart: Agent Prompt Enrichment

**Date**: 2025-12-17 | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## Overview

This guide explains how to test the enriched agent prompt after implementation. It covers generating the prompt, validating its contents, and testing with an AI agent.

---

## Prerequisites

- Node.js 20 LTS installed
- spas-compose CLI built locally
- Access to an AI agent (GitHub Copilot, Claude, etc.)

---

## 1. Build spas-compose CLI

```bash
cd components/cli/spas-compose
npm install
npm run build
```

---

## 2. Initialize a Test Domain

Create a test workspace with the enriched agent prompt:

```bash
# Create test directory
mkdir -p /tmp/spas-test-domain
cd /tmp/spas-test-domain

# Initialize SPAS composition workspace
npx spas-compose init --domain test-domain

# Or with local build:
node /path/to/spas/components/cli/spas-compose/dist/index.js init --domain test-domain
```

---

## 3. Validate Agent Prompt Structure

Check that the generated agent prompt contains all required sections:

```bash
# View the generated agent prompt
cat .github/agents/spas.compose.agent.md

# Check file size (must be < 25KB)
ls -la .github/agents/spas.compose.agent.md
# Or on Windows:
# Get-Item .github/agents/spas.compose.agent.md | Select-Object Length
```

### Required Sections Checklist

- [ ] **Header**: Purpose, File Selection, Domain Selection
- [ ] **Technical Reference**: CloudEvents, Sidecar Config, JSONata, Endpoints, Field Naming
- [ ] **Workflow Phases**: 5 phases with validation checkpoints
- [ ] **Phase 2 Diagram**: Mermaid template included
- [ ] **Phase 2 Confirmation**: "Do you want to proceed?" prompt
- [ ] **Known Pitfalls**: At least 6 documented
- [ ] **Complete Examples**: At least 2 with choreography + config + diagram
- [ ] **Troubleshooting**: Error→Solution mappings
- [ ] **Constraints**: Updated list with rationales
- [ ] **Error Handling**: Guidance for common issues

---

## 4. Test with AI Agent

### Manual Test Scenario

1. Open the test domain in VS Code
2. Open the agent prompt file: `.github/agents/spas.compose.agent.md`
3. Start a conversation with your AI agent
4. Use this test prompt:

```
I need to create a choreography for an e-commerce domain. When an order is 
placed, we need to:
1. Reserve inventory from the inventory-service
2. Process payment through the payment-service
3. Send a confirmation email via the notification-service

Can you help me create the choreographies?
```

### Expected Agent Behavior

1. **Analyze Phase**: Agent should analyze the request and confirm understanding
2. **Propose Phase**: Agent should:
   - Generate a Mermaid sequence diagram
   - Describe the proposed choreographies
   - Ask: "Do you want me to proceed with generating the choreographies?"
3. **Generate Phase**: After approval, generate YAML files
4. **Validate Phase**: Agent should validate generated files
5. **Build Phase**: Agent should suggest running tests

### Validation Points

| Checkpoint | Expected |
|------------|----------|
| Diagram generated | ✅ Mermaid sequence diagram in Propose phase |
| Confirmation asked | ✅ "Do you want to proceed?" before Generate |
| CloudEvents format | ✅ Uses `com.{context}.{event}` format |
| JSONata patterns | ✅ Uses `$append([], ...)` for arrays |
| Endpoint format | ✅ Uses `/proxy/{serviceId}/{path}` |
| Field casing | ✅ All camelCase |

---

## 5. Run Unit Tests

```bash
cd components/cli/spas-compose
npm test

# Run specific template tests
npm test -- --testPathPattern="templates"
```

### Expected Test Coverage

- `generateAgentFile()` returns valid Markdown
- Agent prompt contains all required sections
- File size is under 25KB
- Examples are syntactically valid YAML

---

## 6. Troubleshooting

### Agent Doesn't Follow Phases

**Symptom**: Agent skips Propose phase or doesn't generate diagram
**Check**: Ensure workflow phases section is clearly structured with explicit phase names

### Agent Uses Wrong Patterns

**Symptom**: Agent generates `[item]` instead of `$append([], item)`
**Check**: Ensure JSONata Patterns section is prominent and includes ❌/✅ examples

### File Size Exceeds 25KB

**Symptom**: Generated file is too large
**Fix**: Consolidate examples, reduce duplication, use bullet points instead of prose

---

## 7. Success Criteria Validation

| Criterion | How to Verify |
|-----------|---------------|
| SC-001: No SPAS references needed | Test with fresh AI agent, observe no external lookups |
| SC-002: Phased workflow followed | All 5 phases executed in order |
| SC-003: Diagram in Propose | Mermaid diagram visible before confirmation |
| SC-004: Known pitfalls avoided | Agent uses correct patterns (no `[item]`, correct casing) |
| SC-005: File < 25KB | `ls -la` shows size under 25,600 bytes |

---

## Next Steps

After successful validation:

1. Commit changes to `013-agent-prompt-enrichment` branch
2. Run full CLI test suite
3. Create PR for review
4. Update COMPLETION.md after merge
