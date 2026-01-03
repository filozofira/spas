# Quickstart: Validating .NET SDK Build Warnings Cleanup

**Date**: 2026-01-03  
**Feature**: [spec.md](spec.md) | [plan.md](plan.md)

## Prerequisites

- .NET 10.0 SDK installed
- Git repository cloned: `c:\Source\Spas\spas`
- Branch checked out: `033-dotnet-build-cleanup`

## Validation Workflow

### Step 1: Clean Build - Before Changes

Establish baseline to confirm warnings exist:

```powershell
cd C:\Source\Spas\spas\components\sdk\dotnet
dotnet clean
dotnet build
```

**Expected Output (before fix)**:
```
warning NU1902: Package 'OpenTelemetry.Api' 1.10.0 has a known moderate severity vulnerability
warning NU1510: PackageReference Microsoft.AspNetCore.Routing.Abstractions will not be pruned
warning NU1510: PackageReference Microsoft.AspNetCore.Http.Abstractions will not be pruned
```

---

### Step 2: Apply Changes

**Change 1**: Update OpenTelemetry packages in `src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj`

Replace:
```xml
<PackageReference Include="OpenTelemetry" Version="1.10.0" />
<PackageReference Include="OpenTelemetry.Exporter.Zipkin" Version="1.10.0" />
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.10.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.10.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.10.0" />
```

With:
```xml
<PackageReference Include="OpenTelemetry" Version="1.11.0" />
<PackageReference Include="OpenTelemetry.Exporter.Zipkin" Version="1.11.0" />
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.11.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.11.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.11.0" />
```

**Change 2**: Remove unnecessary packages from `src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj`

Remove these lines:
```xml
<PackageReference Include="Microsoft.AspNetCore.Routing.Abstractions" Version="2.2.0" />
<PackageReference Include="Microsoft.AspNetCore.Http.Abstractions" Version="2.2.0" />
```

Keep:
```xml
<FrameworkReference Include="Microsoft.AspNetCore.App" />
```

---

### Step 3: Clean Build - After Changes

```powershell
dotnet clean
dotnet build
```

**Expected Output (after fix)**:
```
Spas.Sdk.Core succeeded
Spas.Sdk.Configuration succeeded
Spas.Sdk.Events succeeded
Spas.Sdk.Inbound succeeded
Spas.Sdk.Metadata succeeded
Spas.Sdk.Observability succeeded
... (all projects)

Build succeeded.
    0 Warning(s)
    0 Error(s)
```

✅ **Success Criteria**: Zero warnings in build output

---

### Step 4: Run All Tests

```powershell
dotnet test
```

**Expected Output**:
```
Passed! - Failed: 0, Passed: [N], Skipped: 0, Total: [N]
```

✅ **Success Criteria**: 100% test pass rate, no failures

---

### Step 5: Check for Vulnerabilities

```powershell
dotnet list package --vulnerable
```

**Expected Output**:
```
The given project `C:\Source\Spas\spas\components\sdk\dotnet` has no vulnerable packages given the current sources
```

✅ **Success Criteria**: No vulnerable packages reported

---

### Step 6: Publish to Local NuGet Feed

```powershell
.\Publish-LocalNuGet.ps1 -Rebuild
```

**Expected Output**:
```
Building Spas.Sdk.Core (1.0.0-local-[timestamp])...
Built Spas.Sdk.Core 1.0.0-local-[timestamp]
...
Rebuilt and published [N] package(s)
```

✅ **Success Criteria**: Package build succeeds with zero warnings

---

### Step 7: Verify Example Services

```powershell
cd C:\Source\Spas\spas\examples\services\order-service
dotnet build

cd ..\inventory-service
dotnet build

cd ..\subscription-service
dotnet build
```

**Expected Output** (each service):
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

✅ **Success Criteria**: Example services build clean with no SDK-related warnings

---

## Validation Checklist

- [ ] Baseline warnings captured before changes
- [ ] OpenTelemetry packages updated to 1.11.0 in Spas.Sdk.Observability.csproj
- [ ] Unnecessary ASP.NET packages removed from Spas.Sdk.Metadata.csproj
- [ ] `dotnet build` produces zero warnings
- [ ] `dotnet test` shows 100% pass rate
- [ ] `dotnet list package --vulnerable` reports no vulnerabilities
- [ ] `Publish-LocalNuGet.ps1 -Rebuild` succeeds
- [ ] All example services build without warnings

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| NU1902 warnings | 3 | 0 | 0 |
| NU1510 warnings | 2 | 0 | 0 |
| Total warnings | 5 | 0 | 0 |
| Test pass rate | 100% | 100% | 100% |
| Vulnerable packages | 1 | 0 | 0 |

## Rollback Procedure

If validation fails:

```powershell
git checkout src/Spas.Sdk.Observability/Spas.Sdk.Observability.csproj
git checkout src/Spas.Sdk.Metadata/Spas.Sdk.Metadata.csproj
dotnet build
```

Investigate test failures or warnings before reapplying changes.
