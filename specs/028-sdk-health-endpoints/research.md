# Research: Standard SDK Health Endpoints

**Feature**: Standard SDK Health Endpoints
**Status**: In Progress

## Decisions

### 1. Java Implementation Strategy
- **Decision**: Use a custom `@RestController` that delegates to Spring Boot's `HealthEndpoint` bean.
- **Rationale**:
  - **Zero Config**: Modifying `management.endpoints.web.base-path` via properties is risky as it conflicts with user configuration.
  - **Isolation**: A dedicated controller ensures `/_spas/health/*` exists *in addition* to whatever the user has configured for Actuator.
  - **Main Port**: Controllers are always served on the main port.
  - **Response Control**: We can strictly control the JSON format in the controller without affecting the standard Actuator output.

### 2. .NET Implementation Strategy
- **Decision**: Use `MapHealthChecks` with a custom `ResponseWriter`.
- **Rationale**:
  - **Standard**: This is the idiomatic way to expose health checks in ASP.NET Core.
  - **Response Control**: `ResponseWriter` allows full control over the JSON output.
  - **Separation**: We can map `/_spas/health/live` and `/_spas/health/ready` separately with different predicates.

### 3. JSON Response Format
- **Decision**: `{ "status": "UP" | "DOWN" }` (case-insensitive in spec, but we'll output uppercase).
- **Rationale**: Minimal, sufficient for sidecar, open for extension.

## Unknowns & Tasks

### Task 1: Java - Programmatic Actuator Delegation
- **Question**: How to inject `HealthEndpoint` into a controller and invoke it to get the aggregate status?
- **Research**:
  - `HealthEndpoint` is a `@Endpoint`.
  - We can inject `HealthEndpoint` (or `HealthContributorRegistry` if we want to run checks manually, but `HealthEndpoint` is better).
  - Need to check if `HealthEndpoint` is available by default or needs `@ConditionalOnEnabledEndpoint`.

### Task 2: .NET - Anonymous Access
- **Question**: How to ensure `MapHealthChecks` endpoints are anonymous?
- **Research**:
  - `.AllowAnonymous()` extension method on the endpoint convention builder.

### Task 3: .NET - Liveness vs Readiness
- **Question**: How to distinguish them in `MapHealthChecks`?
- **Research**:
  - Use `Predicate` option.
  - `tags.Contains("live")` vs `tags.Contains("ready")`?
  - Or just run all checks for both?
  - *Refinement*: Spec says "Developer Adds Custom Check". We need to know if a check is for liveness or readiness.
  - *Decision*: For MVP, maybe run *all* checks for Readiness, and a simple "return true" for Liveness (unless user tags checks).
  - *Better*: Run all checks for Readiness. Liveness is usually just "I am running", so a simple "return UP" is often enough, or a minimal set.
  - *Proposal*: Liveness = minimal (always UP if app is running). Readiness = all checks.

## Plan Updates
- Add `SpasHealthController` to Java SDK.
- Add `SpasEndpointRouteBuilderExtensions` to .NET SDK (likely in `Spas.Sdk.Inbound`).
