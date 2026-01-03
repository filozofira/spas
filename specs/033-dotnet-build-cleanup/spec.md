# Feature Specification: .NET SDK Build Warnings Cleanup

**Feature Branch**: `033-dotnet-build-cleanup`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Clean up dotnet sdk and dotnet examples services for build warnings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Security Vulnerability Resolution (Priority: P1)

As a developer or security engineer, I want the .NET SDK to be free of packages with known security vulnerabilities so that services built with the SDK are not exposed to exploitable weaknesses.

**Why this priority**: Security vulnerabilities represent real risk to production systems. The `OpenTelemetry.Api 1.10.0` package has a known moderate severity vulnerability (GHSA-8785-wc3w-h8q6) that affects observability functionality across all services using the SDK.

**Independent Test**: Build the SDK and verify no NU1902 warnings appear. Run `dotnet list package --vulnerable` and confirm no vulnerable packages are detected.

**Acceptance Scenarios**:

1. **Given** the SDK references `OpenTelemetry.Api 1.10.0`, **When** I run `dotnet build` from `components/sdk/dotnet`, **Then** no NU1902 security warnings appear in the output
2. **Given** the SDK has been updated to a non-vulnerable OpenTelemetry version, **When** I run `dotnet list package --vulnerable`, **Then** the output shows "No vulnerable packages found"
3. **Given** example services reference the updated SDK, **When** I build any example service (order-service, inventory-service, subscription-service), **Then** no NU1902 warnings appear for OpenTelemetry packages

---

### User Story 2 - Dependency Cleanup (Priority: P2)

As a developer, I want the SDK to have minimal and necessary dependencies so that consuming services don't inherit unnecessary transitive dependencies that increase attack surface and build complexity.

**Why this priority**: While not a security risk, unnecessary dependencies bloat the dependency tree and can cause confusion. The NU1510 warnings indicate packages that are already provided transitively and don't need explicit references.

**Independent Test**: Build `Spas.Sdk.Metadata` and verify no NU1510 warnings appear. Confirm functionality works by running metadata extraction tests.

**Acceptance Scenarios**:

1. **Given** `Spas.Sdk.Metadata.csproj` has explicit references to `Microsoft.AspNetCore.Routing.Abstractions` and `Microsoft.AspNetCore.Http.Abstractions`, **When** these references are removed, **Then** the project still builds successfully
2. **Given** unnecessary package references have been removed, **When** I run `dotnet build`, **Then** no NU1510 warnings appear in the output
3. **Given** the cleaned-up SDK, **When** I run the full test suite (`dotnet test`), **Then** all tests pass including metadata extraction tests

---

### User Story 3 - Clean Build Output (Priority: P3)

As a developer, I want a clean build output with no warnings so that I can quickly identify new issues and maintain code quality standards.

**Why this priority**: Clean builds improve developer experience and make CI/CD pipelines clearer. This is lower priority than security and correctness but important for maintainability.

**Independent Test**: Run `dotnet build` from the SDK root and verify the output shows only success messages with no warnings.

**Acceptance Scenarios**:

1. **Given** all SDK projects and example services, **When** I run `dotnet build` from `components/sdk/dotnet`, **Then** the output contains zero warning messages
2. **Given** a clean SDK build, **When** I build any example service, **Then** the build succeeds with no warnings related to SDK dependencies
3. **Given** the cleaned codebase, **When** I run `Publish-LocalNuGet.ps1 -Rebuild`, **Then** package generation completes with no warnings

---

### Edge Cases

- What happens if removing explicit package references breaks existing functionality that relied on specific versions?
- How do we ensure the updated OpenTelemetry version is compatible with existing observability code?
- What if the transitive dependencies don't provide the same API surface as the explicit references?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: SDK MUST update `OpenTelemetry.Api` package reference from version 1.10.0 to the latest stable non-vulnerable version (1.11.0 or higher)
- **FR-002**: SDK MUST remove explicit PackageReferences to `Microsoft.AspNetCore.Routing.Abstractions` and `Microsoft.AspNetCore.Http.Abstractions` from `Spas.Sdk.Metadata.csproj`
- **FR-003**: All SDK test suites MUST continue to pass after dependency changes
- **FR-004**: Example services (order-service, inventory-service, subscription-service) MUST build without warnings after SDK updates
- **FR-005**: Observability functionality MUST continue to work correctly with the updated OpenTelemetry version
- **FR-006**: Metadata extraction functionality MUST continue to work correctly after removing unnecessary ASP.NET Core package references

### Key Entities *(include if feature involves data)*

- **SDK Package References**: NuGet package dependencies declared in .csproj files across the SDK projects
- **Build Warnings**: Diagnostic messages (NU1510, NU1902) generated during compilation
- **Test Suite**: Unit tests that validate SDK functionality remains intact after changes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero NU1902 security warnings appear when building the SDK or example services
- **SC-002**: Zero NU1510 dependency warnings appear when building the SDK
- **SC-003**: 100% of existing unit tests continue to pass after dependency changes
- **SC-004**: `dotnet build` completes with zero warnings across all SDK projects and example services
- **SC-005**: `dotnet list package --vulnerable` reports no vulnerable packages in the SDK
