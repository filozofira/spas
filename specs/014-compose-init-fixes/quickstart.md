# Quickstart: spas-compose init Scaffolding Fixes

**Phase**: 1 - Design & Contracts  
**Date**: December 19, 2025

## Purpose

Quick testing workflow to verify all four bug fixes.

---

## Prerequisites

- Node.js >= 20.0.0
- SPAS repository cloned (for development)
- Fresh directory outside SPAS repository (for external project testing)

---

## Build CLI

```bash
cd components/cli/spas-compose
npm install
npm run build
```

---

## Test 1: Runtime Metadata Schema Generation (P1)

**Verify**: All three schemas are scaffolded in external project

```bash
# Create test directory outside SPAS repository
mkdir -p /tmp/spas-test
cd /tmp/spas-test

# Run spas-compose init
spas-compose init my-domain

# Verify all three schemas exist
ls -la my-domain/.spas/schemas/
# Expected output:
#   sidecar-config-v1.schema.json
#   choreography-v1.schema.json
#   runtime-metadata-v1.schema.json

# Verify runtime metadata schema is valid JSON
cat my-domain/.spas/schemas/runtime-metadata-v1.schema.json | jq .

# Verify schema content
cat my-domain/.spas/schemas/runtime-metadata-v1.schema.json | \
  jq '."$schema", .title, .properties.schemaVersion.const'
# Expected:
#   "http://json-schema.org/draft-07/schema#"
#   "SPAS Runtime Metadata"
#   "runtime-metadata-v1"
```

**Success Criteria**:
- ✅ All three schema files exist in `.spas/schemas/`
- ✅ `runtime-metadata-v1.schema.json` is valid JSON
- ✅ Schema contains correct $schema, title, and schemaVersion fields

---

## Test 2: README Structure Documentation (P2)

**Verify**: README lists all three schemas

```bash
# View Structure section
cat my-domain/README.md | sed -n '/## Structure/,/## Workflow/p'

# Check for all three schemas
grep -c "sidecar-config-v1.schema.json" my-domain/README.md  # Should be 1
grep -c "choreography-v1.schema.json" my-domain/README.md   # Should be 1
grep -c "runtime-metadata-v1.schema.json" my-domain/README.md # Should be 1
```

**Success Criteria**:
- ✅ README Structure section shows `.spas/schemas/` directory
- ✅ All three schema files are listed
- ✅ Schema files in proper tree structure format

---

## Test 3: Agent Prompt Diagram Guidance (P2)

**Verify**: Agent prompt uses choreography diagram terminology

```bash
# Check Phase 3 section
cat .github/agents/spas.compose.agent.md | sed -n '/Phase 3: Propose/,/Phase 4/p'

# Verify terminology
grep -c "Choreography Diagram" .github/agents/spas.compose.agent.md  # Should be >= 1
grep -c "Sequence Diagram" .github/agents/spas.compose.agent.md      # Should be 0
grep -c "mermaid flowchart" .github/agents/spas.compose.agent.md     # Should be >= 1
grep -c "README.md" .github/agents/spas.compose.agent.md | head -5   # Should mention adding diagram
```

**Success Criteria**:
- ✅ Phase 3 says "Choreography Diagram" (not "Sequence Diagram")
- ✅ Specifies "mermaid flowchart" format
- ✅ Instructs to add diagram to workspace README.md
- ✅ References subgraph pattern

---

## Test 4: Build Command Documentation (P2)

**Verify**: Agent prompt documents correct build commands

```bash
# Check Actions section
cat .github/agents/spas.compose.agent.md | sed -n '/## Actions/,/## Technical Reference/p'

# Verify commands
grep "spas-compose choreography build --docker --dry-run" .github/agents/spas.compose.agent.md
grep "spas-compose choreography build --docker --dev" .github/agents/spas.compose.agent.md
grep "spas-compose choreography build --docker" .github/agents/spas.compose.agent.md | \
  grep -v "dry-run" | grep -v "dev"
```

**Success Criteria**:
- ✅ Dry-run command includes `--docker --dry-run`
- ✅ Dev build command includes `--docker --dev`
- ✅ Prod build command includes `--docker` (no other flags)
- ✅ All three variations are distinct and documented

---

## Test 5: SPAS Repository Compatibility

**Verify**: Works identically inside SPAS repository

```bash
# Run from SPAS repository root
cd /path/to/spas
spas-compose init test-internal

# Verify all schemas generated (not copied)
ls -la test-internal/.spas/schemas/
# Expected: All three schemas exist

# Clean up
rm -rf test-internal
```

**Success Criteria**:
- ✅ All three schemas generated even inside SPAS repo
- ✅ No attempt to copy from file system
- ✅ Identical behavior to external project

---

## Test 6: Force Overwrite

**Verify**: `--force` flag overwrites existing schemas

```bash
cd /tmp/spas-test

# Corrupt a schema file
echo "invalid json" > my-domain/.spas/schemas/runtime-metadata-v1.schema.json

# Re-run with --force
spas-compose init my-domain --force

# Verify schema is valid again
cat my-domain/.spas/schemas/runtime-metadata-v1.schema.json | jq .
```

**Success Criteria**:
- ✅ Corrupted schema is replaced with valid schema
- ✅ All three schemas regenerated
- ✅ No errors during overwrite

---

## Unit Test Execution

```bash
cd components/cli/spas-compose

# Run all tests
npm test

# Run specific template tests
npm test -- templates.test.ts

# Run with coverage
npm run test:coverage
```

**Success Criteria**:
- ✅ All existing tests pass
- ✅ New `generateRuntimeMetadataSchema()` test passes
- ✅ Updated `generateWorkspaceReadme()` test passes
- ✅ Updated `generateAgentFile()` tests pass
- ✅ Coverage >= 80% for templates.ts

---

## Integration Test

```bash
cd components/cli/spas-compose

# Run integration test
npm test -- --testNamePattern="init creates all three schemas"
```

**Success Criteria**:
- ✅ Test creates temporary workspace
- ✅ Verifies all three schemas exist
- ✅ Validates runtime metadata schema JSON structure

---

## Cleanup

```bash
# Remove test directory
rm -rf /tmp/spas-test
```

---

## Expected Outcomes

After all tests pass:

1. **External Project Usage**: Developers can run `spas-compose init` anywhere and get all three schemas
2. **Documentation Accuracy**: README Structure section matches actual scaffolded files
3. **AI Agent Guidance**: `/spas.compose` agent generates correct choreography diagrams
4. **Command Execution**: Developers can successfully run all documented build commands

---

## Troubleshooting

**Issue**: Schema file missing in external project  
**Solution**: Verify `generateRuntimeMetadataSchema()` function exists and is called in `workspace-service.ts`

**Issue**: README shows wrong schema list  
**Solution**: Check `generateWorkspaceReadme()` Structure section template

**Issue**: Agent prompt still says "Sequence Diagram"  
**Solution**: Verify `generateAgentFile()` Phase 3 section updated

**Issue**: Build commands missing `--docker` flag  
**Solution**: Check `generateAgentFile()` Actions section template
