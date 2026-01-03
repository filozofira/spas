# Quickstart: .NET SDK and Principles Documentation Cleanup

**Date**: 2026-01-03  
**Feature**: [spec.md](./spec.md)  
**Branch**: `032-dotnet-docs-cleanup`

## Prerequisites

- Git repository access (already on feature branch)
- .NET 10.0 SDK installed
- PowerShell or Bash for scripting
- Text editor (VS Code recommended)
- grep or ripgrep for searching

## Quick Overview

This cleanup feature has three distinct parts:

1. **SDK Cleanup**: Remove empty `Spas.Sdk.Testing` project, correct `Spas.Sdk.Inbound` documentation
2. **Principles Audit**: Verify all ~30 principle docs match actual implementations across all components
3. **Appendix Cleanup**: Remove outdated examples file, renumber remaining appendix files

## Part 1: SDK Cleanup (Priority: P1)

### Step 1: Remove Spas.Sdk.Testing

```powershell
# From repository root
cd components/sdk/dotnet

# Remove the empty project
Remove-Item -Recurse -Force src/Spas.Sdk.Testing
Remove-Item -Recurse -Force test/Spas.Sdk.Testing.Tests

# Update solution file
code SPAS.SDK.slnx  # Remove references to Spas.Sdk.Testing projects
```

### Step 2: Verify SDK Builds

```powershell
cd components/sdk/dotnet

# Build all projects
dotnet build

# Run all tests (should pass ~195 tests)
dotnet test
```

**Expected**: Zero build errors, all tests pass.

### Step 3: Update Spas.Sdk.Inbound Documentation

```powershell
# Edit the README
code src/Spas.Sdk.Inbound/README.md
```

**Change**:
- Remove "DEFERRED" header
- Update to describe actual functionality: "Health check endpoints for SPAS services"
- Document `MapSpasHealthChecks()` extension and `/_spas/health/*` endpoints

### Step 4: Update SDK README Package Table

```powershell
code README.md
```

**Changes**:
- Remove `Spas.Sdk.Testing` row
- Update `Spas.Sdk.Inbound` row:
  - Purpose: "Health check endpoints"
  - Key Types: "`MapSpasHealthChecks()`, `/_spas/health/live`, `/_spas/health/ready`"
- Ensure table shows exactly 7 packages

### Step 5: Validate Example Services

```powershell
# Build at least 3 example services
cd ../../examples/services/order-service
dotnet build

cd ../inventory-service
dotnet build

cd ../subscription-service
dotnet build
```

**Expected**: All services build successfully.

### Step 6: Scan Dockerfiles

```powershell
# From repo root
grep -r "Spas.Sdk.Testing" examples/services/*/Dockerfile
```

**Expected**: No matches (or remove any found references).

## Part 2: Principles Documentation Audit (Priority: P2)

### Step 1: Create Audit Checklist

Create a checklist of all principle documents to verify:

```powershell
# From repo root
cd principles
ls -R *.md > ../specs/032-dotnet-docs-cleanup/audit-checklist.txt
```

### Step 2: Systematic Audit

For each category, verify documentation matches implementation:

**Service Category** (4 files):
```powershell
code service/03-service-model.md   # Check against example services
code service/04-service-contract.md # Check spas.json structure
code service/05-service-lifecycle.md # Check build/deploy patterns
code service/06-service-metadata.md # Check schema alignment
```

**Protocol Category** (3 files):
```powershell
code protocol/07-communication-model.md # Check trace context
code protocol/08-grpc-protocol.md      # Check if implemented
code protocol/09-event-protocol.md     # Check CloudEvents + kebab-case
```

**Component Category** (5 files):
```powershell
code component/10-sidecar-contract.md    # Check against components/sidecar
code component/11-repository.md          # Check against components/repository
code component/12-sdk.md                 # CRITICAL - both SDKs
code component/13-cli.md                 # Check CLI commands
code component/14-domain-choreography.md # Check choreography.yaml
```

**Other Categories**: Similarly verify infrastructure/, security/, governance/, tooling/

### Step 3: Cross-Reference Verification

```powershell
# Check for references to removed SDK package
grep -r "Spas.Sdk.Testing" principles/

# Check SDK package count mentions
grep -r "8 packages\|six packages" principles/

# Check for outdated health check patterns
grep -r "health check" principles/
```

### Step 4: Verify Against Major Components

For critical principle docs, verify against actual implementations:

**.NET SDK**: `components/sdk/dotnet/README.md`
**Java SDK**: `components/sdk/java/README.md`
**Repository**: `components/repository/README.md`
**CLI**: `components/cli/*/README.md`
**Sidecar**: `components/sidecar/README.md`

## Part 3: Appendix Cleanup (Priority: P3)

### Step 1: Remove Outdated Examples

```powershell
cd principles/appendix
Remove-Item 26-reference-examples.md
```

### Step 2: Renumber Remaining Files

```bash
# In principles/appendix/
mv 27-glossary.md 26-glossary.md
mv 28-decision-log.md 27-decision-log.md
```

### Step 3: Update Cross-References

```powershell
# Find all references to old numbering
cd ../..  # Back to repo root
grep -r "appendix/27" principles/
grep -r "appendix/28" principles/
grep -r "27-glossary" principles/
grep -r "28-decision-log" principles/
```

Update each match to use new numbering (26, 27).

### Step 4: Update Navigation

```powershell
code principles/README.md
```

**Update**:
- Reference Materials section
- Remove 26-reference-examples.md entry
- Update glossary (26) and decision-log (27) numbers

## Validation Checklist

Before marking complete, verify:

- [ ] SDK builds without errors (`cd components/sdk/dotnet && dotnet build`)
- [ ] All ~195 SDK tests pass (`dotnet test`)
- [ ] At least 3 example services build successfully
- [ ] No references to `Spas.Sdk.Testing` in principles docs
- [ ] `Spas.Sdk.Inbound` correctly documented (not "DEFERRED")
- [ ] SDK README shows exactly 7 packages
- [ ] Appendix has exactly 2 files (26-glossary.md, 27-decision-log.md)
- [ ] All markdown links in principles resolve (no 404s)
- [ ] At least 4 major components verified in principles alignment

## Common Issues & Solutions

**Issue**: SDK tests fail after removing Testing project  
**Solution**: Check for test projects referencing Spas.Sdk.Testing in their .csproj files

**Issue**: Example service Dockerfile fails to build  
**Solution**: Remove COPY lines referencing Spas.Sdk.Testing or Spas.Sdk.Inbound project paths

**Issue**: Grep finds many references to appendix/27 or appendix/28  
**Solution**: Use sed or manual find-replace to update all instances in batch

**Issue**: Principle doc claims feature exists but can't find in code  
**Solution**: Mark as "NEEDS CLARIFICATION" or note as "planned" rather than "implemented"

## Next Steps

After completing this quickstart:

1. Run full validation checklist
2. Commit changes with clear messages (one commit per part is recommended)
3. Create PR against main branch
4. Reference this spec in PR description
5. Request review from SDK maintainers and documentation owners

## Estimated Time

- Part 1 (SDK Cleanup): 30-45 minutes
- Part 2 (Principles Audit): 2-3 hours (systematic review of ~30 files)
- Part 3 (Appendix Cleanup): 15-30 minutes

**Total**: 3-4 hours for thorough execution

## Support

For questions or issues:
- Check [spec.md](./spec.md) for detailed requirements
- Check [plan.md](./plan.md) for technical context
- Check [research.md](./research.md) for design decisions
- Check [data-model.md](./data-model.md) for entity relationships
