# Adaptation & Choreography Protocol

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

## Validation

- Validate presence of schemas and mapping references
- Validate topic existence
- (Production) Validate schema compatibility before activation

## Runtime Behavior

- Hot-reload of mappings is allowed
- Fail closed on invalid mappings in production
