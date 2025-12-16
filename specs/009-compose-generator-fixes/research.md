# Research: spas-compose CLI Generator Fixes

**Feature**: 009-compose-generator-fixes  
**Date**: 2025-12-16

## Research Tasks

### RT-1: Service Metadata Runtime Schema

**Question**: What is the structure of runtime metadata in spas.json?

**Findings**: From `examples/domains/ecommerce/public/services/order-service/spas.json`:

```json
{
  "runtime": {
    "digest": "sha256:b77de65f9ae48af6d70096a6f5f8f9c202a7e4c8cb988a737946949bff48fe3e",
    "repository": "spas-examples/order-service",
    "tag": "1.0.0",
    "image": "spas-examples/order-service@sha256:..."
  }
}
```

**Decision**: Use `runtime.repository` and `runtime.tag` to construct image reference.  
**Rationale**: This matches Docker image naming conventions and is simpler than using the digest-based `runtime.image`.  
**Alternatives Considered**: Using `runtime.image` (full digest reference) - rejected as less readable and not necessary for PoC.

---

### RT-2: CloudEvents Event Type Format

**Question**: How are event types defined in service metadata?

**Findings**: The current `types.ts` has:

```typescript
export interface EventDefinition {
  name: string; // Short name like "OrderCreated"
  schema: string; // Schema path
  description?: string;
}
```

The SDK publishes CloudEvents with full type like `com.order.order-created`. This format is:

- Domain prefix: `com.{bounded-context}`
- Event name: kebab-case (lowercased, hyphen-separated)

**Key Discovery**: The SDK (authoritative) uses kebab-case for event names in CloudEvents:
- `EventPublisher.cs` has `ConvertToKebabCase()` method
- Example: "OrderCreated" → "order-created" → `com.sample-service.order-created`

**Cross-SDK Interoperability Decision**: 

For multi-language SDK support (C#, Java, Go, Python, Ruby, etc.), the canonical format
in `spas.json` uses kebab-case for event names:

1. **C# SDK**: Uses `[SpasEvent("OrderCreated")]` → normalized to `order-created` in spas.json
2. **Python SDK**: Would use `@spas_event("order_created")` → normalized to `order-created` 
3. **Other SDKs**: Same principle - normalize native convention to kebab-case

This ensures that:
- spas.json is language-neutral (kebab-case is URL-safe and widely adopted)
- Choreography authors don't need to know SDK-specific naming conventions
- Event types are consistent across all services regardless of implementation language

**Decision**: Derive CloudEvents type from service metadata using kebab-case:

1. Read `boundedContext` from service metadata
2. Convert event name (PascalCase/snake_case → kebab-case)
3. Compose: `com.{boundedContext}.{event-name-kebab}`

**Rationale**: Matches CloudEvents 1.0 spec type conventions and SDK runtime behavior.  
**Alternatives Considered**:

- Add explicit `cloudEventsType` to metadata - rejected as duplicative
- Use short event name - rejected as SDK already uses full format
- Use dot-separated format (order.created) - rejected in favor of kebab (order-created) to match SDK

---

### RT-3: Service Endpoint Discovery

**Question**: How to determine service incoming endpoint?

**Findings**:

- Constitution IV recommends `/incoming` as base path
- Constitution clarification: "SDKs SHOULD be route-agnostic; services MAY choose a different path"
- Current code hardcodes `/incoming` in `sidecar-config-generator.ts`
- inventory-service uses `/incoming`, order-service uses `/events/{event-name}`

**Decision**: Default to `/incoming` (constitution recommendation). Future enhancement: read from service contract metadata if available.  
**Rationale**: Follows convention-over-configuration. All example services now use `/incoming`.  
**Alternatives Considered**: Reading from OpenAPI contract - deferred as service contracts not fully standardized.

---

### RT-4: Port Configuration Best Practices

**Question**: What are the correct port configurations for services and sidecars?

**Findings**:

- .NET services default to port 8080 in containers (ASP.NET Core behavior since .NET 8)
- Sidecar reads `SIDECAR_PORT` environment variable (not `PORT`)
- All sidecars should use same port (7001) for simplicity
- SDK reads `SERVICE_NAME` and `SIDECAR_PORT` to connect to sidecar

**Decision**:

- Service internal port: 8080 (fixed for .NET services in containers)
- Sidecar port: 7001 (fixed, via `SIDECAR_PORT` env var)
- Service env vars: `SERVICE_NAME`, `SIDECAR_PORT=7001`
- Sidecar env vars: `SIDECAR_PORT=7001`, `SERVICE_PORT=8080`

**Rationale**: Follows .NET container defaults and simplifies configuration.  
**Alternatives Considered**: Per-service port configuration via metadata - deferred as not needed for PoC.

---

### RT-5: Init Command --output Behavior

**Question**: How should --output argument affect file placement?

**Findings**:

- Current behavior: workspace created relative to CWD
- Agent prompts placed at `../` relative to workspace
- Problem: Running from different directories creates inconsistent structures

**Decision**:

1. `--output` specifies domain workspace location
2. Agent prompts always go to project root `.github/agents/` (detected via git root or CWD)
3. Path references in agent prompts use relative paths from project root to output location

**Rationale**: Supports monorepo patterns where domains are in subdirectories.  
**Alternatives Considered**: Separate `--agents-dir` flag - rejected as over-engineered.

---

### RT-6: Transform Path Resolution

**Question**: What is the correct transform path format in sidecar configs?

**Findings**:

- Docker volume mount: `./transformations/{service}:/app/transformations`
- Current code strips service folder: `transformations/inventory-service/file.jsonata` → `transformations/file.jsonata`
- This is INCORRECT - should keep full path relative to workspace root

**Decision**: Transform paths should be `transformations/{service-name}/{filename}.jsonata` to match the workspace structure.  
**Rationale**: Sidecar mounts entire workspace, not just service subfolder.  
**Alternatives Considered**: Change mount to per-service folder - rejected as adds complexity.

---

## Summary

All technical unknowns resolved:

| Topic             | Decision                                          |
| ----------------- | ------------------------------------------------- |
| Image reference   | `{runtime.repository}:{runtime.tag}`              |
| EventType format  | `com.{boundedContext}.{event-name-kebab}`         |
| Invoke endpoint   | Default to `/incoming`                            |
| Service port      | 8080 (internal)                                   |
| Sidecar port      | 7001 via `SIDECAR_PORT`                           |
| Transform paths   | Full path with service folder                     |
| --output behavior | Domain to output dir, agents to git root          |
| spas.json naming  | kebab-case (cross-SDK interoperability)           |
