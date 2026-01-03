# Implementation Plan: .NET SDK and Principles Documentation Cleanup

**Branch**: `032-dotnet-docs-cleanup` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/032-dotnet-docs-cleanup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature cleans up .NET SDK project structure and ensures all principles documentation accurately reflects current SPAS implementation across all components. It removes the empty `Spas.Sdk.Testing` project, corrects misleading documentation about `Spas.Sdk.Inbound` (which contains active health check endpoints), removes outdated `principles/appendix/26-reference-examples.md`, renumbers remaining appendix files, and audits all principles docs against actual implementations in .NET SDK, Java SDK, Repository, CLI, Sidecar, and protocols.

## Technical Context

**Language/Version**: Markdown documentation, .NET 10.0 (SDK), C# (for code examples)  
**Primary Dependencies**: None - documentation and project structure cleanup  
**Storage**: N/A - file system operations only  
**Testing**: Manual verification (builds, links, cross-references), dotnet test for SDK validation  
**Target Platform**: Cross-platform (documentation), .NET 10.0 SDK for .NET components  
**Project Type**: Documentation cleanup + SDK project structure refactoring  
**Performance Goals**: N/A - no runtime performance requirements  
**Constraints**: Must not break existing SDK builds or example services; must preserve historical completion reports  
**Scale/Scope**:

- 1 SDK project to remove (Spas.Sdk.Testing)
- 7 SDK packages to document correctly
- ~30 principles documentation files to audit across 6 categories (service, protocol, component, infrastructure, security, governance)
- 1 appendix file to remove, 2 to renumber
- 4+ major SPAS components to verify alignment (.NET SDK, Java SDK, Repository, CLI, Sidecar)
- 6+ example services to validate after SDK cleanup

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Applicable Constitution Rules

**This feature is a documentation and project structure cleanup** - it does NOT create new services, components, or runtime behavior. Constitution gates primarily apply to runtime components.

**Evaluation**:

- ✅ **I. Single Bounded Context**: N/A - not creating/modifying services
- ✅ **II. No Direct Service Communication**: N/A - not modifying communication patterns
- ✅ **III. Event-First Integration**: N/A - not modifying integration patterns
- ✅ **IV. Convention Over Configuration**: ✅ PASS - Verifies documentation accurately describes naming conventions
- ✅ **V. Security by Default**: N/A - not modifying security implementation
- ✅ **VI. Observability First**: ✅ PASS - Verifies health endpoint documentation (`Spas.Sdk.Inbound.MapSpasHealthChecks`)
- ✅ **VII. Portable Packaging**: N/A - not modifying packaging
- ✅ **VIII. Adaptable Through Configuration**: N/A - not modifying configuration patterns

### SDK Component Constitution

**Applicable Checks**:

- ✅ **Offline Metadata Generation**: ✅ PASS - Feature verifies documentation describes offline generation correctly
- ✅ **Events Boundary**: ✅ PASS - Feature audits that principles docs correctly describe SDK→Sidecar event publishing boundary
- ✅ **Quality Gates**: ✅ PASS - Feature validates SDK builds and all ~195 tests pass after cleanup

### CLI Tools Constitution

**Not directly applicable** - feature does not modify CLI tools, only verifies principles documentation accuracy.

### Repository Constitution

**Not directly applicable** - feature does not modify Repository service, only verifies principles documentation accuracy.

**GATE RESULT**: ✅ **PASS** - All applicable gates satisfied. This cleanup feature improves documentation alignment without introducing architectural violations.

---

### Post-Design Re-evaluation (After Phase 1)

**Design Artifacts Created**:

- ✅ research.md - All technical unknowns resolved
- ✅ data-model.md - Entity model for cleanup operations
- ✅ quickstart.md - Execution guide
- N/A contracts/ - No API contracts for cleanup feature
- ✅ Agent context updated (Copilot)

**Constitution Re-check**:

All constitution checks remain **PASSED** after design phase. The implementation approach:

1. Removes empty SDK project (Spas.Sdk.Testing) - reduces complexity ✅
2. Corrects misleading documentation (Spas.Sdk.Inbound) - improves accuracy ✅
3. Audits principles against ALL components (.NET/Java SDKs, Repository, CLI, Sidecar) - ensures cross-component alignment ✅
4. Removes outdated examples, renumbers appendix - improves documentation quality ✅

**No new architectural patterns introduced**. Feature strictly improves documentation/code alignment without adding complexity or violating constitution principles.

**GATE RESULT (Post-Phase 1)**: ✅ **PASS** - Ready for Phase 2 task breakdown (`/speckit.tasks`).

## Project Structure

### Documentation (this feature)

```text
specs/032-dotnet-docs-cleanup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - research findings
├── data-model.md        # Phase 1 output - entity model (minimal for cleanup feature)
├── quickstart.md        # Phase 1 output - execution guide
├── contracts/           # Phase 1 output - N/A for cleanup feature
├── checklists/
│   └── requirements.md  # Specification quality checklist (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# .NET SDK Structure
components/sdk/dotnet/
├── SPAS.SDK.slnx                           # Solution file - remove Testing reference
├── src/
│   ├── Spas.Sdk.Core/                      # KEEP - foundation
│   ├── Spas.Sdk.Metadata/                  # KEEP - composition
│   ├── Spas.Sdk.Events/                    # KEEP - event publishing
│   ├── Spas.Sdk.Observability/             # KEEP - tracing/logging
│   ├── Spas.Sdk.Configuration/             # KEEP - env config
│   ├── Spas.Sdk.Inbound/                   # KEEP - health endpoints (correct docs)
│   │   ├── README.md                       # UPDATE - remove "DEFERRED" label
│   │   └── Extensions/
│   │       └── SpasEndpointRouteBuilderExtensions.cs  # MapSpasHealthChecks
│   └── Spas.Sdk.Testing/                   # REMOVE - empty placeholder
├── test/
│   ├── Spas.Sdk.Core.Tests/                # KEEP
│   ├── Spas.Sdk.Metadata.Tests/            # KEEP
│   ├── Spas.Sdk.Events.Tests/              # KEEP
│   ├── Spas.Sdk.Observability.Tests/       # KEEP
│   ├── Spas.Sdk.Configuration.Tests/       # KEEP
│   ├── Spas.Sdk.Inbound.Tests/             # KEEP
│   └── Spas.Sdk.Testing.Tests/             # REMOVE
├── examples/
│   └── SampleService/                      # VALIDATE - ensure builds after cleanup
└── README.md                               # UPDATE - correct package table

# Principles Documentation
principles/
├── README.md                               # AUDIT - navigation accuracy
├── 01-core-principles.md                   # AUDIT
├── 02-architecture-overview.md             # AUDIT
├── service/                                # AUDIT - 4 files
│   ├── 03-service-model.md
│   ├── 04-service-contract.md
│   ├── 05-service-lifecycle.md
│   └── 06-service-metadata.md
├── protocol/                               # AUDIT - 3 files
│   ├── 07-communication-model.md
│   ├── 08-grpc-protocol.md
│   └── 09-event-protocol.md               # Verify CloudEvents + kebab-case
├── component/                              # AUDIT - 5 files
│   ├── 10-sidecar-contract.md
│   ├── 11-repository.md
│   ├── 12-sdk.md                          # UPDATE - both SDKs structure
│   ├── 13-cli.md
│   └── 14-domain-choreography.md
├── infrastructure/                         # AUDIT - 3 files
│   ├── 15-package-format.md
│   ├── 16-schema-registry.md
│   └── 17-runtime-environment.md
├── security/                               # AUDIT - 4 files
│   ├── 19-security-model.md
│   ├── 20-identity-access.md
│   ├── 21-network-security.md
│   └── 22-data-security.md
├── governance/                             # AUDIT - 5 files
│   ├── 23-versioning-strategy.md
│   ├── 24-compliance-checklist.md
│   ├── 25-evolution-policy.md
│   └── 29-documentation-standards.md
├── tooling/
│   └── 18-testing-harness.md              # AUDIT
└── appendix/
    ├── 26-reference-examples.md           # REMOVE - outdated examples
    ├── 27-glossary.md                     # RENAME to 26-glossary.md
    └── 28-decision-log.md                 # RENAME to 27-decision-log.md

# Example Services (validation targets)
examples/services/
├── order-service/
│   └── Dockerfile                         # VALIDATE - no Testing references
├── inventory-service/
│   └── Dockerfile                         # VALIDATE - no Testing references
├── subscription-service/
│   └── Dockerfile                         # VALIDATE - no Testing references
└── [other services...]

# Java SDK (verification only - no changes)
components/sdk/java/
└── README.md                              # VERIFY - cross-reference accuracy
```

**Structure Decision**: This feature operates on existing SDK and documentation structure. No new directories created. Removes 1 SDK project directory tree (`src/Spas.Sdk.Testing/`, `test/Spas.Sdk.Testing.Tests/`), removes 1 principles appendix file, and renames 2 appendix files. All other modifications are content updates to existing files.

## Complexity Tracking

**No violations** - this cleanup feature does not introduce architectural complexity. It removes unused code and corrects documentation to match existing implementations.
