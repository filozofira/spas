# Research: .NET SDK and Principles Documentation Cleanup (Phase 0)

**Date**: 2026-01-03  
**Feature**: [spec.md](./spec.md)  
**Purpose**: Resolve unknowns and establish technical approach for cleanup

## Decisions

### Decision: Spas.Sdk.Inbound Status

- **Finding**: Package contains active, production-ready code (`MapSpasHealthChecks` extension providing `/_spas/health/live` and `/_spas/health/ready` endpoints)
- **Rationale**: README incorrectly marks it as "DEFERRED" but implementation exists and is used
- **Action**: KEEP package, CORRECT documentation
- **Alternatives considered**: Remove package (rejected - has working functionality); leave as-is (rejected - misleads developers)

### Decision: Spas.Sdk.Testing Status

- **Finding**: Package contains only .csproj file, no implementation classes
- **Rationale**: Truly empty placeholder with no utility
- **Action**: REMOVE package entirely
- **Alternatives considered**: Implement test utilities (out of scope); mark as deferred (unnecessary overhead)

### Decision: SDK Package Count

- **Finding**: 7 active packages after cleanup (Core, Metadata, Events, Observability, Configuration, Inbound)
- **Rationale**: Reflects actual usable SDK surface
- **Action**: Update all documentation to reflect 7 packages, not 6 or 8
- **Alternatives considered**: None - this is factual correction

### Decision: Appendix File 26-reference-examples.md

- **Finding**: Contains outdated examples that don't match current SDK patterns
- **Rationale**: Real examples exist in examples/services/ and SDK sample service; maintaining separate example doc creates drift
- **Action**: REMOVE file, renumber remaining appendix (27→26, 28→27)
- **Alternatives considered**: Update examples to current (rejected - redundant with existing examples); leave as-is (rejected - actively misleading)

### Decision: Principles Docs Audit Scope

- **Finding**: Principles define cross-component contracts affecting all SPAS implementations
- **Rationale**: Documentation must reflect reality across .NET SDK, Java SDK, Repository, CLI, Sidecar, and protocols
- **Action**: Systematic audit of all ~30 principle files against current implementations
- **Alternatives considered**: Audit only SDK-related docs (rejected - principles are system-wide contracts)

### Decision: Historical Completion Reports

- **Finding**: Spec completion reports in specs/\*/COMPLETION.md may reference removed packages
- **Rationale**: These document what was done at that point in time
- **Action**: PRESERVE historical reports unchanged
- **Alternatives considered**: Update historical reports (rejected - rewrites history); delete reports (rejected - loses project knowledge)

## Implementation Approach

### Phase Structure

**Part 1: .NET SDK Cleanup**

1. Remove Spas.Sdk.Testing project directory and test directory
2. Remove Testing references from SPAS.SDK.slnx
3. Update Spas.Sdk.Inbound/README.md to describe health endpoints
4. Update components/sdk/dotnet/README.md package table
5. Verify SDK builds and all ~195 tests pass
6. Scan example service Dockerfiles for Testing references

**Part 2: Principles Documentation Audit**

1. Create audit checklist from principles/README.md structure
2. For each principle category (service, protocol, component, infrastructure, security, governance):
   - Read principle document
   - Identify implementation claims (SDK features, API endpoints, CLI commands, etc.)
   - Verify claims against actual code/READMEs in relevant components
   - Document discrepancies
3. Generate corrections for identified discrepancies
4. Special attention: component/12-sdk.md (both SDKs), protocol/09-event-protocol.md (CloudEvents), component/10-sidecar-contract.md

**Part 3: Appendix Cleanup**

1. Remove principles/appendix/26-reference-examples.md
2. Rename 27-glossary.md → 26-glossary.md
3. Rename 28-decision-log.md → 27-decision-log.md
4. Grep all principles docs for references to old numbering (appendix/27, appendix/28)
5. Update cross-references to new numbering (26, 27)
6. Verify principles/README.md navigation table uses correct numbers

### Validation Strategy

**SDK Validation**:

- `cd components/sdk/dotnet && dotnet build` - zero errors
- `cd components/sdk/dotnet && dotnet test` - all pass (~195 tests)
- Build at least 3 example services (order-service, inventory-service, subscription-service)

**Documentation Validation**:

- Grep search for removed package names: `grep -r "Spas.Sdk.Testing" principles/`
- Grep search for old appendix references: `grep -r "appendix/27" principles/` and `appendix/28`
- Manual verification of at least 4 major components reflected accurately in principles

**Link Validation**:

- Check all markdown links resolve (no 404s)
- Verify renumbered appendix files accessible
- Validate principles/README.md navigation links

## Technologies & Tools

**Languages**: Markdown (documentation), C# (SDK code examples)

**Build Tools**:

- .NET 10.0 SDK (dotnet build, dotnet test)
- Git (file operations)
- PowerShell/Bash (scripting for grep/file operations)

**Validation Tools**:

- grep (searching for references)
- markdown link checkers (optional)
- dotnet CLI (build/test verification)

## Risks & Mitigations

**Risk**: Example services fail to build after SDK cleanup

- **Mitigation**: Test at least 3 example services before committing changes
- **Fallback**: Restore removed projects if dependencies exist

**Risk**: Principles audit uncovers major implementation gaps

- **Mitigation**: Scope limited to documentation correction, not implementation; document gaps as "NEEDS CLARIFICATION" for future features
- **Fallback**: Defer complex corrections to separate feature specs

**Risk**: Renumbering breaks external references

- **Mitigation**: Appendix files are internal to repo; external docs should reference stable URLs
- **Verification**: Git log shows no external references to specific appendix numbers

**Risk**: Historical reports become confusing after package removal

- **Mitigation**: Preserve historical reports unchanged; they document PoC state accurately
- **Verification**: Add note in COMPLETION.md if needed explaining current vs historical state

## Open Questions

**Resolved**:

- ✅ Is Spas.Sdk.Inbound truly empty? **NO** - contains MapSpasHealthChecks
- ✅ Should historical completion reports be updated? **NO** - preserve as historical record
- ✅ What scope for principles audit? **ALL components** - principles are cross-component contracts
- ✅ Should 26-reference-examples.md be updated or removed? **REMOVE** - redundant with real examples

**None remaining** - all technical unknowns resolved.

## References

- [Spas.Sdk.Inbound/README.md](../../components/sdk/dotnet/src/Spas.Sdk.Inbound/README.md) - Current "DEFERRED" documentation
- [components/sdk/dotnet/README.md](../../components/sdk/dotnet/README.md) - Package table to update
- [principles/README.md](../../principles/README.md) - Principles navigation structure
- [principles/component/12-sdk.md](../../principles/component/12-sdk.md) - SDK specification to verify
- [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Constitution validation
