# Glossary

- Bounded Context: Single service boundary (DDD)
- Domain Context: Composition of services for a specific domain
- Domain Composition: Deployable description of a Domain Context, defined by `choreography.yaml`
- Choreography: Event-driven composition
- North–South: Client-to-service communication via API Gateway
- East–West: Event-driven or Service-to-service communication via SPAS Sidecar
- Sidecar: Helper container handling cross-cutting concerns including transformation execution, protocol translation, identity propagation, observability, and (future) idempotency enforcement
- Adaptation: Configuration-driven transformation of inbound/outbound events using mapping files
- Domain Composition: Aggregated choreography (routing + mappings + services); Adaptation rules are a subset defined within `choreography.yaml`
- Domain Event: Business fact (past tense)
- Canonical Schema: Domain-specific event format
- Internal Schema: Service-specific event format

## Related Documents

- [INDEX](../INDEX.md)
- [Introduction](../00-introduction.md)
- [Decision Log](28-decision-log.md)
