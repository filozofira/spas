# Domain Choreography (Adaptation & Composition)

Defines how services adapt to different Domain Contexts without code changes. Separates concerns between **Domain Composition** (what to transform) and **Middleware** (where/how transformations execute inside the sidecar/mesh).

## Composition Descriptor (`choreography.yaml`) — Domain Composition scope

Captured by domain authors; describes **what** to transform and route:

- Services: name + version (natural key) participating in the domain
- Event routing: domain topics and bindings
- Service invocation: command/query endpoint mappings for sidecar-mediated direct invocation
- Transformations: domain ↔ internal schema mappings (references to mapping files)
- Service configuration overrides
- Network policies (informative in PoC)

## Terminal Events

Events can have an empty `targets` array, indicating they are **terminal events** - published but with no consumers in this choreography. Use cases:

- **Audit/Logging**: Events for compliance or observability (e.g., `order-confirmed`)
- **Future Extension**: Placeholder for events that other domains may consume later
- **Domain Boundaries**: Events that exit this bounded context

```yaml
events:
  - source: order-service
    event: order-confirmed
    topic: order-events
    targets: []  # Terminal event - no consumers in this choreography
```

Terminal events are still added to the source service's outbound config, enabling the sidecar to accept and publish them.

## Mapping Rules — Domain Composition scope

- Inbound: Domain event/command → service internal schema
- Outbound: Service internal schema → domain event/response
- Applies to both event-driven flows and sidecar-mediated invocations
- Transformations should be declarative and testable
- Transformation rules MUST reside in external `.jsonata` files organized by service: `choreography/transformations/<service-name>/*.jsonata`. These are referenced from `choreography.yaml` (e.g. `mappings[]`). Transformation rules are NOT referenced from spas.json because they are Domain Context specific, not service specific.
- Each `.jsonata` file contains a JSONata expression that transforms the source payload to the destination schema. JSONata provides declarative, language-agnostic transformations compatible with both Node.js and Go sidecar implementations.
- At runtime (Docker PoC), transformation folders are volume-mounted to corresponding sidecars: `choreography/transformations/<service-name>` → `<service-name>-sidecar:/app/transformations`

## Validation — split by concern

- Adaptation validation (composition time, domain author responsibility):
  - Presence of mapping file references
  - Mapping file structure correctness (operations, required fields)
  - Existence of referenced internal and domain schemas
  - Topic existence in routing rules
- Deployment validation (publish/deploy time, platform responsibility):
  - Schema compatibility (additive-only) across versions
  - Uniqueness of mapping identifiers
  - Integrity (checksum) of mapping artifacts (Production)
- Runtime activation (middleware, sidecar responsibility):
  - Fail closed on invalid mappings in Production; PoC logs warnings

## Metadata Descriptions (Agent-Aware Composition)

Service metadata MAY include optional plain-text `description` fields at the service, endpoint, and event levels.

**Composition guidance (for humans and AI agents):**

- Prefer `description` as the primary semantic signal when matching endpoints/events to domain intent.
- When making a mapping decision, quote the exact snippet(s) of `description` that justify the selection.
- If `description` is missing, empty, or clearly unhelpful, fall back to names/types/schemas and state that fallback explicitly.

**Limitations:**

- Descriptions are optional and may be absent, stale, or incomplete.
- Descriptions are advisory, not authoritative: mappings MUST be validated against schemas and contracts.
- Agents/tools MUST NOT invent descriptions; they may only quote what is present in pulled metadata.

## Runtime Behavior — Middleware/Sidecar scope

- Sidecar loads mappings at startup via priority: mounted files → config service → repository API fallback
- Hot-reload: atomic swap; failure reverts to previous active mappings
- Metrics emitted for mapping load success/failure
- Production: Fail closed on invalid mappings; PoC: continue with warning

## Related Documents

- [Event Protocol](../protocol/09-event-protocol.md)
- [CLI Specification](13-cli.md)
- [Reference Examples](../appendix/26-reference-examples.md)
