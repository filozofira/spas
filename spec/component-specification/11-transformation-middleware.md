# Transformation Middleware (Adaptation & Choreography Protocol)

Defines how services adapt to different Domain Contexts without code changes.

## Composition Descriptor (`choreography.yaml`)

Includes:

- Services: id + version
- Event routing: domain topics and bindings
- Transformations: domain ↔ internal schema mappings
- Service configuration overrides
- Network policies (informative in PoC)

## Mapping Rules

- Inbound: Domain event → service internal schema
- Outbound: Service internal schema → domain event
- Transformations should be declarative and testable
- Transformation rules MUST reside in external mapping files and be referenced from `choreography.yaml` and `spas.json` (`mappings[]`)
- Each mapping file declares: source event type, internal schema, operations, validation section

## Validation

- Adaptation validation (composition time):
  - Presence of mapping file references
  - Mapping file structure correctness (operations, required fields)
  - Existence of referenced internal and domain schemas
  - Topic existence in routing rules
- Repository validation (publish time):
  - Schema compatibility (additive-only) across versions
  - Uniqueness of mapping identifiers
  - Integrity (checksum) of mapping artifacts (Production)
- (Production) Activation blocked on failed compatibility checks; PoC logs warnings only

## Runtime Behavior

- Sidecar loads mappings at startup via priority: mounted files → config service → repository API fallback
- Hot-reload: atomic swap; failure reverts to previous active mappings
- Metrics emitted for mapping load success/failure
- Production: Fail closed on invalid mappings; PoC: continue with warning

## Related Documents

- [Event Protocol](../protocol-specification/09-event-protocol.md)
- [CLI Specification](14-cli-specification.md)
- [Reference Examples](../appendix/26-reference-examples.md)
