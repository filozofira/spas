# Transformation Middleware (Adaptation & Choreography Protocol)

Defines how services adapt to different Domain Contexts without code changes. Separates concerns between **Domain Composition** (what to transform) and **Middleware** (where/how transformations execute inside the sidecar/mesh).

## Composition Descriptor (`choreography.yaml`) — Domain Composition scope

Captured by domain authors; describes **what** to transform and route:

- Services: name + version (natural key) participating in the domain
- Event routing: domain topics and bindings
- Service invocation: command/query endpoint mappings for sidecar-mediated direct invocation
- Transformations: domain ↔ internal schema mappings (references to mapping files)
- Service configuration overrides
- Network policies (informative in PoC)

## Mapping Rules — Domain Composition scope

- Inbound: Domain event/command → service internal schema
- Outbound: Service internal schema → domain event/response
- Applies to both event-driven flows and sidecar-mediated invocations
- Transformations should be declarative and testable
- Transformation rules MUST reside in external mapping files and be referenced from `choreography.yaml` (e.g. `mappings[]`). Transformation rules are NOT referenced from spas.json because they are Domain Context specific, not service specific.
- Each mapping file declares: source topic/command, source event/command type, transformation rules/operations, and destination endpoint/topic (i.e. endpoint for inbound traffic and topic for outbound traffic from the SPAS service.)

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

## Runtime Behavior — Middleware/Sidecar scope

- Sidecar loads mappings at startup via priority: mounted files → config service → repository API fallback
- Hot-reload: atomic swap; failure reverts to previous active mappings
- Metrics emitted for mapping load success/failure
- Production: Fail closed on invalid mappings; PoC: continue with warning

## Related Documents

- [Event Protocol](../protocol-specification/09-event-protocol.md)
- [CLI Specification](14-cli-specification.md)
- [Reference Examples](../appendix/26-reference-examples.md)
