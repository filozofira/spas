# Service Model

Defines what makes a service “SPAS-compliant”. Clarifies the single gRPC surface, autonomy of internal state, and external adaptation responsibilities.

## Bounded Context Alignment

- Exactly one bounded context per service
- Encapsulated domain model (aggregates, entities, invariants)

## Public Contract

- Single service surface (gRPC in Production; HTTP in PoC) used by both north–south (via gateway) and east–west (invoked by sidecar when translating subscribed events or performing service invocation rules)
- Event contracts
  - Published events (outbound domain facts)
  - Subscribed events (sidecar invokes designated gRPC handlers in Production; HTTP handlers in PoC)
- State model summary: framework does not prescribe persistence patterns (e.g. CRUD, CQRS, event sourcing all allowed)

## Adaptation Layer

- Service only exposes HTTP endpoints in PoC or gRPC methods in Production and internal schemas
- Domain Composition (`choreography.yaml`) declares routing + transformation mappings
- Sidecar/mesh applies inbound (domain→internal) and outbound (internal→domain) transformations; service code remains unchanged

## Health & Observability

- Service MUST expose liveness and readiness endpoints (or gRPC health) consumed by platform
- OpenTelemetry traces/metrics/logs emitted by service and sidecar; sidecar may aggregate

## Security

- No direct service-to-service synchronous calls (enforced by composition rules)
- Service MUST accept propagated identity: JWT from edge (North-South) or via event payload (East-West PoC). In Production, sidecar will inject verified identity headers (SPIFFE/SPIRE cert subject or claims).
- Outbound events enriched with identity + correlation metadata
- Data classification declared in metadata (`security.dataClassification`)

## Compliance Summary

A SPAS-compliant service MUST:

- Align to a single bounded context (declarative; conceptual validation only)
- Provide service definition (gRPC proto or HTTP OpenAPI) and event contracts
- Reference transformation mapping artifacts (external files) used in choreography (instead of "provide schemas for mapping")
- Package as OCI image with health endpoints
- Provide `spas.json` metadata (including contracts and security declarations)

Machine‑verifiable items: Service definition presence, event contract list, image reference, health endpoint declaration, metadata schema validity.
Conceptual items: bounded context alignment.

## Related Documents

- [Service Contract](04-service-contract.md)
- [Service Metadata](06-service-metadata.md)
- [Communication Model](../protocol-specification/07-communication-model.md)
