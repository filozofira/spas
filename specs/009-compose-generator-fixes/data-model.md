# Data Model: spas-compose CLI Generator Fixes

**Feature**: 009-compose-generator-fixes  
**Date**: 2025-12-16

## Entities

### 1. ServiceMetadata (Extended)

Current `types.ts` ServiceMetadata needs extension to include runtime information.

```typescript
interface ServiceMetadata {
  // Existing fields
  id: string;
  version: string;
  boundedContext: string;
  events: {
    published: EventDefinition[];
    subscribed: EventDefinition[];
  };
  network?: {
    port: number;
    protocol: string;
  };

  // NEW: Runtime metadata (from repository pull)
  runtime?: {
    repository: string; // e.g., "spas-examples/order-service"
    tag: string; // e.g., "1.0.0"
    digest?: string; // SHA256 digest (optional)
    image?: string; // Full image reference (optional)
  };
}
```

**Validation Rules**:

- `runtime.repository` MUST be non-empty when `runtime` is present
- `runtime.tag` MUST follow semver or be "latest"
- Image reference constructed as `{repository}:{tag}`

---

### 2. EventDefinition (Enhanced)

Current definition lacks full CloudEvents type. Generator will derive it.

```typescript
interface EventDefinition {
  name: string; // Short name: "OrderCreated"
  type?: string; // CloudEvents type (optional, can be derived)
  schema: string; // Schema path
  description?: string;
}
```

**Derivation Logic**:

```
cloudEventsType = "com." + boundedContext + "." + toKebabCase(name).replace("-", ".")
Example: "OrderCreated" → "com.order.order.created"
```

---

### 3. OutboundEntry (Enhanced)

Adding required `eventType` field.

```typescript
interface OutboundEntry {
  eventType: string; // NEW: CloudEvents type (e.g., "com.order.order.created")
  topic: string; // Topic name
  transform?: string; // Transform path (optional)
}
```

**Validation Rules**:

- `eventType` MUST be present and non-empty
- `eventType` MUST start with "com."
- `topic` MUST be non-empty

---

### 4. InboundEntry (Existing - no changes needed)

```typescript
interface InboundEntry {
  kind: "event" | "command";
  topic?: string;
  command?: string;
  transform?: string;
  invokeEndpoint: string; // Default: "/incoming"
}
```

---

### 5. GeneratorConfig (New)

Configuration for generation behavior.

```typescript
interface GeneratorConfig {
  // Port configuration
  serviceInternalPort: number; // Default: 8080
  sidecarPort: number; // Default: 7001

  // Image references
  sidecarImage: string; // Default: "spas/sidecar:latest"

  // Endpoint defaults
  defaultInvokeEndpoint: string; // Default: "/incoming"
}
```

---

### 6. InitCommandOptions (Extended)

```typescript
interface InitOptions extends CommonOptions {
  force?: boolean;
  output?: string; // NEW: Output directory for domain workspace
}
```

---

## State Transitions

N/A - CLI tool generates static files, no runtime state.

## Relationships

```
Choreography (1) ──contains──> (*) Flow
Flow (1) ──contains──> (*) EventRoute
EventRoute (1) ──targets──> (*) Target

ServiceMetadata (1) ──has──> (0..1) RuntimeMetadata
ServiceMetadata (1) ──publishes──> (*) EventDefinition
ServiceMetadata (1) ──subscribes──> (*) EventDefinition

Generator produces:
  Choreography + ServiceMetadata[] ──generates──> docker-compose.yaml
  Choreography + ServiceMetadata[] ──generates──> config.{service}.json[]
```
