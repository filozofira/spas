# Implementation Plan: .NET SDK Build Warnings Cleanup

**Branch**: `033-dotnet-build-cleanup` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/033-dotnet-build-cleanup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Eliminate build warnings in the .NET SDK and example services by: (1) updating OpenTelemetry.Api from 1.10.0 to latest non-vulnerable version to resolve NU1902 security warnings, and (2) removing unnecessary explicit package references (Microsoft.AspNetCore.Routing.Abstractions, Microsoft.AspNetCore.Http.Abstractions) from Spas.Sdk.Metadata.csproj to resolve NU1510 warnings. All changes must maintain full backward compatibility and pass existing test suites.

## Technical Context

**Language/Version**: .NET 10.0  
**Primary Dependencies**: 
  - OpenTelemetry.* packages (currently 1.10.0, target: 1.11.0+)
  - Microsoft.AspNetCore.App framework reference
  - NJsonSchema, JsonSchema.Net (metadata)
**Storage**: N/A (SDK library project)  
**Testing**: xUnit via `dotnet test`  
**Target Platform**: Cross-platform (.NET 10.0 SDK)  
**Project Type**: SDK library (multi-project solution)  
**Performance Goals**: N/A (dependency update has no performance impact)  
**Constraints**: 
  - Must maintain backward compatibility with existing SDK consumers
  - All existing unit tests must pass
  - No breaking API changes
**Scale/Scope**: 
  - 6 SDK projects in components/sdk/dotnet/src/
  - 5 test projects in components/sdk/dotnet/test/
  - 4 example services affected (order-service, inventory-service, subscription-service, SampleService)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Applicable Gates**:
- ✅ **VI. Observability First**: Feature maintains observability by updating OpenTelemetry packages to non-vulnerable versions
- ✅ **V. Security by Default**: Feature eliminates known security vulnerability in OpenTelemetry.Api 1.10.0
- ✅ **VII. Portable Packaging**: Dependency cleanup reduces container image bloat

**Assessment**: ✅ **PASS** - This feature strengthens constitution compliance by addressing security and operational best practices. No violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/033-dotnet-build-cleanup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (version compatibility research)
├── data-model.md        # N/A (no data model for dependency updates)
├── quickstart.md        # Phase 1 output (validation steps)
├── contracts/           # N/A (no API contracts for internal cleanup)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/sdk/dotnet/
├── src/
│   ├── Spas.Sdk.Core/
│   ├── Spas.Sdk.Configuration/
│   ├── Spas.Sdk.Events/
│   ├── Spas.Sdk.Inbound/
│   ├── Spas.Sdk.Metadata/           # ← MODIFY: Remove unnecessary package refs
│   │   └── Spas.Sdk.Metadata.csproj
│   └── Spas.Sdk.Observability/      # ← MODIFY: Update OpenTelemetry packages
│       └── Spas.Sdk.Observability.csproj
├── test/
│   ├── Spas.Sdk.Core.Tests/
│   ├── Spas.Sdk.Configuration.Tests/
│   ├── Spas.Sdk.Events.Tests/
│   ├── Spas.Sdk.Inbound.Tests/
│   ├── Spas.Sdk.Metadata.Tests/     # ← VERIFY: Tests still pass
│   └── Spas.Sdk.Observability.Tests/ # ← VERIFY: Tests still pass
├── examples/
│   └── SampleService/               # ← VERIFY: No warnings after rebuild
└── Publish-LocalNuGet.ps1

examples/services/
├── order-service/                   # ← VERIFY: Builds clean
├── inventory-service/               # ← VERIFY: Builds clean
└── subscription-service/            # ← VERIFY: Builds clean
```

**Structure Decision**: Standard .NET SDK multi-project solution structure. Changes isolated to two .csproj files (Spas.Sdk.Metadata, Spas.Sdk.Observability). Verification spans test projects and example services to ensure no downstream breakage.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitution violations. Feature strengthens security and observability compliance.

---

## Phase 0: Research

**Objective**: Determine compatible OpenTelemetry package versions and confirm safe removal of ASP.NET Core package references.

### Research Tasks

1. **OpenTelemetry Version Compatibility**
   - Query: What is the latest stable OpenTelemetry.Api version that resolves GHSA-8785-wc3w-h8q6?
   - Query: Are OpenTelemetry 1.11.0+ packages compatible with .NET 10.0?
   - Query: Do OpenTelemetry 1.11.0+ packages maintain API compatibility with 1.10.0?

2. **ASP.NET Core Package References**
   - Query: Are Microsoft.AspNetCore.Routing.Abstractions and Microsoft.AspNetCore.Http.Abstractions provided by FrameworkReference Microsoft.AspNetCore.App?
   - Query: What minimum version of these packages does FrameworkReference provide for .NET 10.0?
   - Query: Does Spas.Sdk.Metadata code directly use APIs from these packages or only transitive types?

3. **Backward Compatibility**
   - Query: Do any consuming services have version constraints on OpenTelemetry packages?
   - Query: Will updating OpenTelemetry packages affect existing distributed tracing functionality?

**Output**: `research.md` documenting:
- Target OpenTelemetry version (1.11.0 or latest 1.x stable)
- Confirmation that ASP.NET Core packages are transitive
- API compatibility assessment
- Migration risks (expected: none for this minor version bump)

---

## Phase 1: Design

**Objective**: Define precise changes to .csproj files and validation steps.

### Deliverables

**1. data-model.md** (N/A - no data model for this feature)

**2. contracts/** (N/A - no API contracts for this feature)

**3. quickstart.md** - Validation procedure:

```markdown
# Quickstart: Validating .NET SDK Build Warnings Cleanup

## Prerequisites
- .NET 10.0 SDK
- Repository cloned locally

## Validation Steps

1. **Build SDK with no warnings**
   ```bash
   cd components/sdk/dotnet
   dotnet build
   # Expected: Zero warnings
   ```

2. **Run all tests**
   ```bash
   dotnet test
   # Expected: All tests pass
   ```

3. **Check for vulnerabilities**
   ```bash
   dotnet list package --vulnerable
   # Expected: No vulnerable packages
   ```

4. **Publish to local feed**
   ```bash
   .\Publish-LocalNuGet.ps1 -Rebuild
   # Expected: Success with no warnings
   ```

5. **Build example services**
   ```bash
   cd examples/services/order-service
   dotnet build
   # Expected: No warnings
   
   cd ../inventory-service
   dotnet build
   # Expected: No warnings
   ```

## Success Criteria
- Zero NU1902 warnings across all projects
- Zero NU1510 warnings across all projects
- 100% test pass rate
- No vulnerable packages detected
```

### Changes Required

**File 1**: `components/sdk/dotnet/src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj`
- Update 5 OpenTelemetry package references from 1.10.0 to [RESEARCHED_VERSION]
- Packages: OpenTelemetry, OpenTelemetry.Exporter.Zipkin, OpenTelemetry.Extensions.Hosting, OpenTelemetry.Instrumentation.AspNetCore, OpenTelemetry.Instrumentation.Http

**File 2**: `components/sdk/dotnet/src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj`
- Remove PackageReference: Microsoft.AspNetCore.Routing.Abstractions (v2.2.0)
- Remove PackageReference: Microsoft.AspNetCore.Http.Abstractions (v2.2.0)
- Retain FrameworkReference: Microsoft.AspNetCore.App (provides these transitively)

### Post-Design Constitution Check

**Re-assessment after Phase 1**:
- ✅ Security vulnerability eliminated (OpenTelemetry updated)
- ✅ Unnecessary dependencies removed (cleaner dependency tree)
- ✅ Observability maintained (OpenTelemetry version upgraded, not removed)
- ✅ No new violations introduced

**Final Gate**: ✅ PASS - Ready for Phase 2 task generation.

---

## Phase 2: Tasks (Generated by `/speckit.tasks`)

**Note**: This section is intentionally blank. Tasks are generated by running `/speckit.tasks` after completing Phase 0-1. That command will create `tasks.md` with concrete implementation steps.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
