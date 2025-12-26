# Research: SDK Metadata Archive Extraction

**Feature**: 021-sdk-metadata-extraction  
**Created**: 2025-12-26

## Phase 0 Research Tasks

### 1. Reference ZIP format and required internal paths

**Task**: Inspect the reference metadata archive `examples/services/metadata/order-service-1.0.0.zip` and record the internal entry paths.

**Decision**: The generated archive MUST contain exactly these internal paths for order-service (and follow the same structure generally):

- `spas.json`
- `schemas/events/{event-type}.schema.json`
- `schemas/endpoints/{endpoint-name}.schema.json`

**Observed reference entries** (count = 6):

- `spas.json`
- `schemas/events/order-confirmed.schema.json`
- `schemas/events/order-created.schema.json`
- `schemas/endpoints/confirm-order.schema.json`
- `schemas/endpoints/create-order.schema.json`
- `schemas/endpoints/update-shipment-status.schema.json`

**Rationale**: Repository and tooling assume categorized schema paths (events vs endpoints) and stable names.

**Alternatives considered**:
- Flat `schemas/*.schema.json` output (rejected: does not match reference archives).

---

### 2. .NET endpoint discovery without listening

**Task**: Find how the .NET SDK discovers endpoints today without requiring the service to be running.

**Decision**: Use the existing ASP.NET Core discovery path (`DiscoverSpasMetadata()` via `WebApplicationDiscoveryExtensions`) which reads the `WebApplication` route data sources (`DataSources` → `EndpointDataSource.Endpoints`) to extract SPAS attributes and infer `methodPath`.

**Rationale**:
- This discovery happens after endpoints are mapped and does not require calling `app.Run()`.
- Endpoint metadata is already attached to route endpoints (attributes on minimal API handlers / controller actions).

**Alternatives considered**:
- Starting Kestrel on an ephemeral port and querying local endpoints (rejected: violates “no listening ports” and “no outbound network calls” constraints).
- Manual route parsing by scanning assemblies only (rejected: would lose framework-resolved route templates and HTTP methods).

---

### 3. Java endpoint discovery without listening

**Task**: Identify how Java metadata generation currently discovers contracts and schemas and whether it can run without starting an HTTP server.

**Decision**: Reuse the existing reflection/classpath scanning strategy currently implemented in the Spring module (today encapsulated in `SpasMetadataController`), which:
- Finds `@SpasService` for service identity
- Finds `@SpasCommand` / `@SpasQuery` / `@SpasEvent`
- Derives endpoint `methodPath` by combining HTTP mapping annotations (e.g., `@GetMapping`, `@PostMapping`) with the `path` declared in SPAS annotations
- Collects schemas from `schemaRef` values, loading from classpath when present and otherwise generating dynamically

**Rationale**:
- The existing implementation already uses reflection and classpath scanning; it does not inherently require the embedded web server to be started.
- Keeping the discovery logic shared reduces drift between “offline generate” and any legacy behavior.

**Alternatives considered**:
- Building a Spring `ApplicationContext` in `WebApplicationType.NONE` mode and asking Spring MVC for registered mappings (rejected for now: increases complexity and risk of missing mappings without the web layer enabled).

---

## Guardrails (No Outbound Calls)

Offline metadata generation MUST be a purely local, offline operation:

- Do not bind/listen on any network ports (no `app.Run()` / no embedded server start).
- Do not make outbound HTTP calls (including calling any local `/_spas/metadata` endpoint).

This is both a correctness requirement (determinism in CI) and a security constraint.

---

### 4. Output location, naming, and overwrite semantics

**Task**: Define stable output conventions and how they map across .NET and Java.

**Decision**:
- Default output directory: `./metadata` (service project root)
- Default output filename: `service.metadata.zip`
- Overwrite existing archive at the target path
- Triggers:
  - .NET: `dotnet run -- --generate-metadata` (optional `--output <path>`)
  - Java: system property `-Dspas.generate-metadata=true` (plus output override property)

**Rationale**:
- Makes CI artifact collection consistent across languages.
- Matches the feature spec decisions and acceptance criteria.

**Alternatives considered**:
- Naming archive `{serviceName}-{version}.zip` (rejected: spec decision is fixed name).

---

### 5. Removing runtime metadata endpoints

**Task**: Identify where `/_spas/metadata` is implemented to plan removal.

**Decision**:
- .NET: remove dev endpoint helpers in `components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/` (extensions/options) and any related configuration in `components/sdk/dotnet/src/Spas.Sdk.Configuration/SpasConfig.cs`.
- Java: remove the Spring controller `SpasMetadataController` and its auto-configuration wiring (`SpasAutoConfiguration`, `SpasProperties` metadata endpoint configuration).

**Rationale**:
- The feature explicitly requires endpoint removal.
- Eliminates ambiguity: metadata archives are generated via offline mode only.

**Alternatives considered**:
- Keeping the endpoint as “dev-only optional” (rejected: conflicts with feature requirements).
