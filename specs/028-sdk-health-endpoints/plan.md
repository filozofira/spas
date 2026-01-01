# Implementation Plan: Standard SDK Health Endpoints

**Branch**: `028-sdk-health-endpoints` | **Date**: 2026-01-01 | **Spec**: [specs/028-sdk-health-endpoints/spec.md](spec.md)
**Input**: Feature specification from `/specs/028-sdk-health-endpoints/spec.md`

## Summary

Standardize health check endpoints (`/_spas/health/live` and `/_spas/health/ready`) across Java and .NET SDKs. The implementation will adapt existing framework capabilities (Spring Boot Actuator, ASP.NET Core Health Checks) to expose these paths on the main application port with a consistent, minimal JSON response (`{ "status": "UP" }`).

## Technical Context

**Language/Version**: Java 17+ (Spring Boot 3.x), .NET 10 (ASP.NET Core)
**Primary Dependencies**: 
- Java: `spring-boot-starter-actuator` (optional dependency)
- .NET: `Microsoft.AspNetCore.Diagnostics.HealthChecks` (via FrameworkReference)
**Project Type**: SDK Libraries
**Constraints**: "Adapt don't Reinvent" - must leverage native health registries.

## Constitution Check

*GATE: Passed.*
- **Convention Over Configuration**: Enforcing standard paths `/_spas/health/*`.
- **No Direct Service-to-Service**: N/A.
- **Single Bounded Context**: N/A.

## Project Structure

### Documentation (this feature)

```text
specs/028-sdk-health-endpoints/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── health-api.yaml
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
components/sdk/java/spas-sdk-spring/
├── pom.xml                                      # Add actuator dependency
└── src/main/java/io/spas/sdk/spring/
    ├── SpasAutoConfiguration.java               # Register controller
    └── health/
        └── SpasHealthController.java            # New controller

components/sdk/dotnet/src/Spas.Sdk.Inbound/
├── Spas.Sdk.Inbound.csproj                      # Add FrameworkReference
└── Extensions/
    └── SpasEndpointRouteBuilderExtensions.cs    # New extension method
```

## Complexity Tracking

N/A
