# Research: Sidecar Config Generator

**Feature**: 006-sidecar-config-generator  
**Date**: 2025-12-14  
**Status**: Complete

## Overview

This feature is a straightforward enhancement to existing spas-compose CLI. Research scope is minimal as all technologies and patterns are already established in the codebase.

## Technology Decisions

### Decision 1: Config File Format

**Decision**: JSON  
**Rationale**: Matches existing sidecar prototype config format (`config.order-service.json`)  
**Alternatives Considered**:
- YAML: More human-readable but sidecar already parses JSON
- TOML: Not used elsewhere in SPAS

### Decision 2: Integration Approach

**Decision**: New service class `SidecarConfigGenerator` called from `choreography-deploy.ts`  
**Rationale**: Follows existing pattern (DockerGenerator is a peer service)  
**Alternatives Considered**:
- Inline in choreography-deploy.ts: Would bloat command handler
- Separate command: Violates single-command workflow requirement

### Decision 3: Transform Path Resolution

**Decision**: Transform paths in generated config are relative to `/app/transformations` (sidecar mount point)  
**Rationale**: 
- docker-compose.yaml mounts `./transformations/{service}:/app/transformations`
- Config references files relative to mount point
- Example: `transformations/fulfillment-service/inbound-order.jsonata` → `transformations/inbound-order.jsonata`

**Implementation**:
```typescript
// Extract filename from full choreography path
// Input: "transformations/fulfillment-service/inbound-order.jsonata"
// Output: "transformations/inbound-order.jsonata"
function resolveTransformPath(choreographyPath: string, serviceName: string): string {
  const filename = path.basename(choreographyPath);
  return `transformations/${filename}`;
}
```

## Existing Code Analysis

### Choreography Types (types.ts)

```typescript
interface EventRoute {
  source: string;      // Publishing service
  event: string;       // Event type name
  topic: string;       // Message topic
  targets: Target[];   // Subscribing services
}

interface Target {
  service: string;     // Subscribing service name
  transform?: string;  // Path to .jsonata file (optional)
}
```

### Sidecar Config Schema (from prototype)

```typescript
interface SidecarConfig {
  inbound: InboundEntry[];
  outbound: OutboundEntry[];
}

interface InboundEntry {
  kind: "event" | "command";
  topic?: string;           // For kind="event"
  command?: string;         // For kind="command"
  transform?: string;       // Optional .jsonata path
  invokeEndpoint: string;   // Service HTTP endpoint
}

interface OutboundEntry {
  topic: string;
  transform?: string;       // Optional .jsonata path
}
```

## Algorithm

```
For each flow in choreography.flows:
  For each eventRoute in flow.events:
    1. Add outbound entry to source service config:
       { topic: eventRoute.topic, transform: eventRoute.sourceTransform }
    
    2. For each target in eventRoute.targets:
       Add inbound entry to target service config:
       { kind: "event", topic: eventRoute.topic, 
         transform: resolveTransformPath(target.transform),
         invokeEndpoint: "/incoming" }

Deduplicate entries by topic+service combination
Generate config file per service
```

## Default Values

| Field | Default | Notes |
|-------|---------|-------|
| `invokeEndpoint` | `/incoming` | Per constitution (recommended path) |
| `kind` | `"event"` | Only events supported in PoC |
| `transform` | omitted | Passthrough when not specified |

## Dependencies

No new dependencies required. Uses existing:
- `fs` (Node.js built-in)
- `path` (Node.js built-in)
- Existing types from `types.ts`

## Open Questions — Resolved

1. **Q**: Should invokeEndpoint be configurable in choreography?  
   **A**: No, use default `/incoming` per constitution. Future enhancement can add per-target endpoint config.

2. **Q**: How to handle command invocations?  
   **A**: Out of scope for initial implementation. Only event subscriptions supported.

3. **Q**: What if transformation file doesn't exist?  
   **A**: Existing `JsonataValidator` already handles this. Config generator calls validator before writing.
