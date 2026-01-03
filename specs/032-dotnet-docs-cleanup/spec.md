# Feature Specification: .NET SDK and Principles Documentation Cleanup

**Feature Branch**: `032-dotnet-docs-cleanup`  
**Created**: 2026-01-03  
**Status**: ✅ Completed (PoC)
**Completed**: 2026-01-03  
**Input**: User description: "Clean up .NET SDK and principle docs. Remove obsolete .NET SDK projects and make sure all principles docs are well aligned with current implementation."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Remove Truly Obsolete Projects and Correct Misleading Documentation (Priority: P1)

When a contributor reviews the .NET SDK structure, they discover that `Spas.Sdk.Testing` is truly empty (only project file, no implementation), while `Spas.Sdk.Inbound` is incorrectly documented as "deferred" despite containing active health check endpoints (`MapSpasHealthChecks`). This creates confusion: one package should be removed, while the other needs documentation correction. Removing the empty Testing package and updating Inbound's documentation clarifies what's actually usable versus what was planned but never implemented.

**Why this priority**: Eliminates maintenance burden for truly empty packages and corrects misleading documentation that prevents developers from discovering useful health check functionality. This is the most actionable cleanup with immediate impact on codebase clarity.

**Independent Test**: Can be fully tested by building the SDK solution after removing Testing, running all tests, verifying Inbound health endpoints work, and checking that documentation accurately describes each package's purpose.

**Acceptance Scenarios**:

1. **Given** the SDK solution contains `Spas.Sdk.Testing` as an empty placeholder project, **When** a developer removes this project and its references, **Then** the SDK solution builds successfully without warnings or errors
2. **Given** `Spas.Sdk.Inbound` is documented as "deferred" but contains working health check extensions, **When** documentation is updated to describe its actual purpose (health endpoints), **Then** the package table accurately reflects that Inbound provides `MapSpasHealthChecks()` for `/_spas/health/*` endpoints
3. **Given** example services may reference removed or misdocumented packages, **When** references are cleaned from Dockerfiles and README descriptions are corrected, **Then** all example services build and documentation accurately describes available SDK capabilities

---

### User Story 2 - Audit and Align Principles Documentation Across All Components (Priority: P2)

When a developer reads the principles documentation to understand SPAS architecture, they need assurance that the documented patterns match actual implementation **across all components** - not just .NET SDK, but also Java SDK, Repository service, CLI tools, Sidecar, and all protocols. Over time, implementation decisions (like controller support, metadata extraction, nullable schema handling, CloudEvents format, health check patterns) may not be reflected in principles docs. A comprehensive audit ensures that SDK specifications, communication protocols, component contracts, and governance docs accurately describe what's been built in the entire SPAS ecosystem.

**Why this priority**: Accurate documentation prevents developers from building against outdated or incorrect assumptions about system-wide behavior. Principles define cross-component contracts, so misalignment affects all teams. This is critical for consistency but lower priority than removing active maintenance burden.

**Independent Test**: Can be tested by systematically cross-referencing each principle document section against current implementations across all components (README files, feature completion reports, actual code), identifying discrepancies, and validating that updates reflect actual behavior in .NET SDK, Java SDK, Repository, CLI, Sidecar, and example services.

**Acceptance Scenarios**:

1. **Given** [component/12-sdk.md](../../principles/component/12-sdk.md) defines language-agnostic SDK contract and capabilities, **When** an auditor compares documented features with actual .NET SDK AND Java SDK packages and READMEs, **Then** all documented capabilities either exist in both implementations or are clearly marked as language-specific or future/deferred
2. **Given** principles docs describe cross-component interactions (SDK→Sidecar event publishing, Repository metadata schemas, CLI composition workflows), **When** those interactions have been implemented or refined, **Then** the principles documentation accurately describes current behavior across all components
3. **Given** [protocol/09-event-protocol.md](../../principles/protocol/09-event-protocol.md) documents CloudEvents format and event naming conventions, **When** .NET SDK, Java SDK, AND Sidecar implementations are reviewed, **Then** kebab-case normalization, CloudEvents structure, and W3C trace context propagation are correctly documented with examples matching actual SDK and Sidecar behavior

---

### User Story 3 - Update Cross-References and Remove Stale Examples (Priority: P3)

When a developer navigates between principles documents using cross-references, broken links or references to removed features create confusion. Cleaning up cross-references (especially to removed SDK packages or outdated patterns) and ensuring examples match current implementation improves discoverability and trust in the documentation.

**Why this priority**: Improves documentation quality but doesn't impact functionality or critical understanding. Can be deferred if higher priorities reveal scope changes.

**Independent Test**: Can be tested by scanning all principles documents for references to `Spas.Sdk.Inbound`, `Spas.Sdk.Testing`, or outdated patterns, updating or removing those references, and validating that all markdown links resolve correctly.

**Acceptance Scenarios**:

1. **Given** principles documents cross-reference SDK packages, **When** obsolete packages (`Spas.Sdk.Testing`) are removed and `Spas.Sdk.Inbound` is correctly documented, **Then** no principles documents contain references to removed packages and Inbound is accurately described as providing health endpoints
2. **Given** [principles/README.md](../../principles/README.md) provides navigation to component docs, **When** component capabilities have evolved, **Then** the navigation guide accurately reflects current SDK responsibilities
3. **Given** code examples in principles docs (C# snippets showing event publishing, metadata generation), **When** SDK APIs have changed, **Then** examples compile and run against current SDK versions

---

### Edge Cases

- What happens when a package's README says "DEFERRED" but the package contains active, production-ready code (like `Spas.Sdk.Inbound` health checks)?
- How does the system handle references to removed packages in historical completion reports (should they be updated or preserved as historical record)?
- What if example services have deep dependencies on removed packages through transitive references?
- Should principles docs that reference health checks be updated to point to `Spas.Sdk.Inbound` instead of generic ASP.NET Core patterns?
- When renumbering appendix files, how are cross-references in other principles documents updated (manual search or automated tool)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST remove `Spas.Sdk.Testing` project directory and all associated test projects from `components/sdk/dotnet/`
- **FR-002**: System MUST update `Spas.Sdk.Inbound` README to accurately describe its purpose (health check endpoints) instead of marking it as "DEFERRED"
- **FR-003**: System MUST remove all references to obsolete packages from the SDK solution file (`SPAS.SDK.slnx`)
- **FR-004**: System MUST update [components/sdk/dotnet/README.md](../../components/sdk/dotnet/README.md) to remove `Spas.Sdk.Testing` and correct `Spas.Sdk.Inbound` description to reflect its actual purpose (health check endpoints: `MapSpasHealthChecks()`, `/_spas/health/live`, `/_spas/health/ready`)
- **FR-005**: System MUST clean up example service Dockerfiles that reference removed SDK projects
- **FR-006**: Principles documentation MUST accurately describe implemented capabilities across ALL components (both .NET and Java SDKs, Repository service, CLI tools, Sidecar, protocols) without referencing removed or placeholder features
- **FR-007**: [principles/component/12-sdk.md](../../principles/component/12-sdk.md) MUST reflect current SDK structure for both .NET (7 packages) and Java SDKs, distinguishing language-specific capabilities from shared contract
- **FR-008**: All cross-references in principles documents MUST be validated for correctness (no broken links to removed features, accurate component references)
- **FR-009**: Code examples in principles docs MUST use current APIs and patterns from actual implementations (e.g., .NET health checks via `Spas.Sdk.Inbound.MapSpasHealthChecks()`, Java SDK patterns, Repository API endpoints, CLI commands, Sidecar CloudEvents format)
- **FR-010**: Documentation MUST distinguish between implemented features and explicitly deferred capabilities
- **FR-011**: System MUST remove outdated [principles/appendix/26-reference-examples.md](../../principles/appendix/26-reference-examples.md) which contains examples misaligned with current implementation
- **FR-012**: System MUST renumber remaining appendix files (`27-glossary.md` → `26-glossary.md`, `28-decision-log.md` → `27-decision-log.md`) and update all cross-references throughout principles documentation

### Key Entities _(include if feature involves data)_

- **SDK Package**: A NuGet package in the SPAS .NET SDK (Core, Metadata, Events, Observability, Configuration, Inbound)
- **SPAS Component**: A major system component with principles documentation (SDK [.NET/Java], Repository, CLI, Sidecar, protocols)
- **Principles Document**: A markdown file in `principles/` defining architectural contracts and patterns (includes appendix files like glossary, decision log)
- **Cross-Reference**: A markdown link or mention connecting one principles document to another or to SDK implementation
- **Example Service**: A reference implementation in `examples/services/` demonstrating SDK usage
- **Appendix File**: Numbered reference documents in `principles/appendix/` (26-reference-examples.md, 27-glossary.md, 28-decision-log.md)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: SDK solution builds successfully with zero compilation errors after removing obsolete projects
- **SC-002**: All SDK unit tests pass (existing ~195 tests for remaining packages) with zero failures
- **SC-003**: All example services build and run without errors after cleanup (validate at least 3 example services across different domains)
- **SC-004**: Principles documentation contains zero references to removed package (`Spas.Sdk.Testing`) and accurately describes `Spas.Sdk.Inbound` as providing health endpoints
- **SC-005**: All markdown links in principles documents resolve correctly (zero 404 errors when validated)
- **SC-006**: SDK README packages table shows exactly 7 active packages (Core, Metadata, Events, Observability, Configuration, Inbound with corrected description)
- **SC-007**: Appendix contains exactly 2 files (`26-glossary.md`, `27-decision-log.md`) with all cross-references updated to reflect new numbering
- **SC-008**: Principles documentation accurately reflects implementations in at least 4 major components (e.g., .NET SDK, Java SDK, Sidecar, Repository) with zero documented capabilities that don't exist in actual code

## Assumptions

- `Spas.Sdk.Inbound` contains active, production-ready health check functionality (`MapSpasHealthChecks`) and should be retained
- `Spas.Sdk.Testing` is truly empty (only project file) and can be safely removed
- The package's own README incorrectly marking it as "DEFERRED" is a documentation bug, not an accurate status
- Historical completion reports in `specs/` directories should be preserved as-is (they document what was done at that time)
- Example services don't have runtime dependencies on `Spas.Sdk.Testing` (only build-time references in Dockerfiles)
- The seven core packages (Core, Metadata, Events, Observability, Configuration, Inbound) represent the complete usable SDK surface
- Sufficient real examples exist in `examples/services/` and SDK examples, making `26-reference-examples.md` redundant
- Cross-references to appendix files can be found and updated via grep search across principles docs
- "Current implementation" means all SPAS components (both SDKs, Repository, CLI, Sidecar, example services), not just .NET SDK
- Principles docs serve as cross-component contracts and must be verified against all major implementations

## Dependencies

- None - this is a cleanup task that doesn't require new external dependencies

## Out of Scope

- Implementing any new SDK features to replace removed packages
- Migrating services from removed packages to new patterns (they should already be using current patterns)
- Updating third-party documentation or external references
- Refactoring SDK architecture beyond removing empty/placeholder projects
- Changes to Java SDK or other language SDKs
