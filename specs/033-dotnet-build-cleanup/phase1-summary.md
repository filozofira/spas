# Phase 1: Setup - Baseline Capture Summary

**Date**: 2026-01-03  
**Branch**: 033-dotnet-build-cleanup

## Task Completion

✅ **T001**: Captured baseline build output → [baseline-build.txt](baseline-build.txt)  
✅ **T002**: Captured baseline test results → [baseline-tests.txt](baseline-tests.txt)  
✅ **T003**: Documented vulnerable packages → [baseline-vulnerabilities.txt](baseline-vulnerabilities.txt)

---

## Baseline Warnings Summary

### Build Warnings (12 total)

**NU1902 Security Warnings (6 occurrences)**:
- `Spas.Sdk.Observability.csproj` (2x - restore & build)
- `Spas.Sdk.Observability.Tests.csproj` (2x - restore & build)
- `SampleService.csproj` (2x - restore & build)
- **Vulnerability**: OpenTelemetry.Api 1.10.0 - GHSA-8785-wc3w-h8q6 (moderate severity)

**NU1510 Unnecessary Dependency Warnings (6 occurrences)**:
- `Spas.Sdk.Metadata.csproj`:
  - Microsoft.AspNetCore.Routing.Abstractions (2x - restore & build)
  - Microsoft.AspNetCore.Http.Abstractions (2x - restore & build)
- `Spas.Sdk.Core.csproj`:
  - Microsoft.Extensions.Logging.Abstractions (2x - restore & build)

---

## Test Suite Baseline

**Total Tests**: 199  
**Passed**: 199  
**Failed**: 0  
**Skipped**: 0  
**Pass Rate**: 100%

**Test Projects**:
- ✅ Spas.Sdk.Core.Tests: 20 tests passed (82 ms)
- ✅ Spas.Sdk.Events.Tests: 18 tests passed (128 ms)
- ✅ Spas.Sdk.Observability.Tests: 12 tests passed (233 ms)
- ✅ Spas.Sdk.Inbound.Tests: 2 tests passed (203 ms)
- ✅ Spas.Sdk.Metadata.Tests: 147 tests passed (409 ms)
- ⚠️ Spas.Sdk.Configuration.Tests: No tests available (removed in Phase 4 - Configuration is simple POCO)

---

## Vulnerable Packages

**Status**: Vulnerable packages detected but not reported by `dotnet list package --vulnerable`

**Note**: The command shows "no vulnerable packages" for individual projects, BUT the NU1902 warnings during restore/build confirm OpenTelemetry.Api 1.10.0 has known vulnerability GHSA-8785-wc3w-h8q6. This discrepancy may be due to NuGet vulnerability database sync timing or advisory categorization.

**Affected Package**:
- Package: `OpenTelemetry.Api`
- Current Version: `1.10.0`
- Vulnerability: GHSA-8785-wc3w-h8q6
- Severity: Moderate
- Projects Affected: Spas.Sdk.Observability, Spas.Sdk.Observability.Tests, SampleService

---

## Warnings Distribution

| Warning Type | Project | Count |
|--------------|---------|-------|
| NU1902 (Security) | Spas.Sdk.Observability | 2 |
| NU1902 (Security) | Spas.Sdk.Observability.Tests | 2 |
| NU1902 (Security) | SampleService | 2 |
| NU1510 (Metadata) | Spas.Sdk.Metadata | 4 |
| NU1510 (Core) | Spas.Sdk.Core | 2 |
| **Total** | | **12** |

---

## Scope for User Stories

### User Story 1 (P1) - Security Fix
**Target**: Eliminate 6 NU1902 warnings
- Update OpenTelemetry packages in Spas.Sdk.Observability
- This will also fix transitive warnings in tests and examples

### User Story 2 (P2) - Dependency Cleanup  
**Target**: Eliminate 4 NU1510 warnings (Metadata)
- Remove Microsoft.AspNetCore.Routing.Abstractions from Spas.Sdk.Metadata
- Remove Microsoft.AspNetCore.Http.Abstractions from Spas.Sdk.Metadata

**Out of Scope** (Not in spec):
- Microsoft.Extensions.Logging.Abstractions in Spas.Sdk.Core (2 warnings)
- Can be addressed in future cleanup if desired

### User Story 3 (P3) - Clean Build
**Target**: Zero warnings total (8 targeted, excluding 2 Core warnings)

---

## Next Steps

✅ Phase 1 Complete - Baseline established  
➡️ **Ready for Phase 3**: User Story 1 - Security Vulnerability Resolution

**Command to proceed**:
```powershell
# Follow instructions in speckit.implement.prompt.md
# Execute Phase 3 (US1) tasks T004-T012
```
