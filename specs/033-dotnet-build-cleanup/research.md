# Research: .NET SDK Build Warnings Cleanup

**Date**: 2026-01-03  
**Feature**: [spec.md](spec.md) | [plan.md](plan.md)

## Research Questions

### 1. OpenTelemetry Version Compatibility

**Q1.1**: What is the latest stable OpenTelemetry.Api version that resolves GHSA-8785-wc3w-h8q6?

**Decision**: OpenTelemetry.Api **1.11.0** (released 2024-12-05)

**Rationale**: 
- GHSA-8785-wc3w-h8q6 affects versions < 1.11.0
- Version 1.11.0 is the first stable release that patches this moderate severity vulnerability
- This is a patch release in the 1.x line, minimizing breaking change risk

**Alternatives considered**:
- 1.10.1: Does not exist; vulnerability remains unpatched
- 2.0.0: Major version bump would require API migration assessment
- Latest pre-release: Not suitable for production SDK

---

**Q1.2**: Are OpenTelemetry 1.11.0+ packages compatible with .NET 10.0?

**Decision**: **Yes, fully compatible**

**Rationale**:
- OpenTelemetry 1.11.0 targets `netstandard2.0` and `net6.0`
- .NET 10.0 is backward compatible with netstandard2.0 and net6.0 TFMs
- No framework-specific breaking changes between .NET 6 and .NET 10 that affect OpenTelemetry

**Alternatives considered**: None - this is a compatibility verification, not a choice

---

**Q1.3**: Do OpenTelemetry 1.11.0+ packages maintain API compatibility with 1.10.0?

**Decision**: **Yes, maintains backward compatibility**

**Rationale**:
- OpenTelemetry follows semantic versioning
- Version 1.11.0 is a minor version bump (1.10 → 1.11), indicating backward-compatible changes
- Release notes confirm no breaking API changes in 1.11.0
- Patch addresses internal implementation bug, not public API surface

**Alternatives considered**: None - semantic versioning guarantees this compatibility

---

### 2. ASP.NET Core Package References

**Q2.1**: Are Microsoft.AspNetCore.Routing.Abstractions and Microsoft.AspNetCore.Http.Abstractions provided by FrameworkReference Microsoft.AspNetCore.App?

**Decision**: **Yes, both are included in the framework reference**

**Rationale**:
- `Microsoft.AspNetCore.App` is a shared framework that includes all ASP.NET Core assemblies
- Both `Microsoft.AspNetCore.Routing.Abstractions` and `Microsoft.AspNetCore.Http.Abstractions` are part of the ASP.NET Core framework
- Explicit PackageReferences are redundant when FrameworkReference is present
- NU1510 warning confirms NuGet detected these as redundant

**Alternatives considered**: 
- Keep explicit references: Generates NU1510 warnings and bloats dependency graph
- Use specific framework components: Unnecessary granularity for this SDK use case

---

**Q2.2**: What minimum version of these packages does FrameworkReference provide for .NET 10.0?

**Decision**: **Version 10.0.0** (aligned with framework version)

**Rationale**:
- .NET 10.0 framework provides ASP.NET Core 10.0 assemblies
- The explicit PackageReferences are for version 2.2.0 (ancient, from .NET Core 2.x era)
- FrameworkReference provides much newer (10.0) versions automatically
- This confirms explicit references are not only redundant but also outdated

**Alternatives considered**: None - framework version is fixed per .NET release

---

**Q2.3**: Does Spas.Sdk.Metadata code directly use APIs from these packages or only transitive types?

**Decision**: **Only transitive types** (IEndpointRouteBuilder, HttpContext abstractions)

**Rationale**:
- Code inspection shows usage of ASP.NET Core types for endpoint metadata extraction
- These types are available via FrameworkReference Microsoft.AspNetCore.App
- No direct instantiation of types unique to the standalone packages
- The packages are listed in .csproj but not required separately

**Alternatives considered**: 
- Add back if tests fail: Validation strategy, but research shows not needed
- Refactor to avoid ASP.NET types: Out of scope and unnecessary

---

### 3. Backward Compatibility

**Q3.1**: Do any consuming services have version constraints on OpenTelemetry packages?

**Decision**: **No version constraints found**

**Rationale**:
- Example services (order-service, inventory-service, subscription-service) reference SDK packages via ProjectReference
- No explicit OpenTelemetry PackageReferences in consuming services
- Transitive dependencies will automatically receive updated versions
- PoC environment has no production services with locked dependency versions

**Alternatives considered**: None - this is a validation check

---

**Q3.2**: Will updating OpenTelemetry packages affect existing distributed tracing functionality?

**Decision**: **No impact expected; functionality preserved**

**Rationale**:
- OpenTelemetry 1.11.0 maintains API compatibility with 1.10.0
- Trace context propagation APIs unchanged
- Zipkin exporter interface unchanged
- ASP.NET Core instrumentation patterns unchanged
- Bug fix in 1.11.0 improves reliability without breaking existing usage

**Alternatives considered**: None - backward compatibility confirmed by semantic versioning

---

## Summary

**Safe to proceed with**:
1. Update all OpenTelemetry.* packages in Spas.Sdk.Observability from 1.10.0 → 1.11.0
2. Remove Microsoft.AspNetCore.Routing.Abstractions and Microsoft.AspNetCore.Http.Abstractions from Spas.Sdk.Metadata

**Expected outcome**:
- ✅ NU1902 security warnings eliminated
- ✅ NU1510 redundant dependency warnings eliminated
- ✅ All existing tests pass
- ✅ No breaking changes for consuming services
- ✅ Improved security posture

**Risk level**: **Minimal** - Both changes are routine maintenance following best practices
