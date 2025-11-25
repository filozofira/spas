# Service Model

Defines what makes a service “SPAS-compliant”.

## Bounded Context Alignment

- Exactly one bounded context per service
- Encapsulated domain model (aggregates, entities, invariants)

## Public Contract

- gRPC API (north–south via edge; internal use discouraged)
- Event contracts
  - Published events (outbound)
  - Subscribed events (inbound)
- State model summary (read models are implementation-specific)

## Adaptation Layer

- Service exposes internal schemas for inbound/outbound mapping
- Domain Composition binds mappings via `choreography.yaml`

## Health & Observability

- Liveness and readiness endpoints
- OpenTelemetry traces/metrics/logs

## Security

- No direct service-to-service sync calls
- Identity propagation for events
- Data classification declared in metadata

## Compliance Summary

A SPAS-compliant service MUST:

- Align to a single bounded context
- Provide gRPC service definition and event contracts
- Provide schemas for mapping
- Package as OCI image with health endpoints
- Provide `spas.json` metadata

## Related Documents

- [Service Contract](04-service-contract.md)
- [Service Metadata](06-service-metadata.md)
- [Communication Model](../protocol-specification/07-communication-model.md)
