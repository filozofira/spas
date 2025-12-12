# Data Model: .NET SPAS SDK

## Entities

- Service Metadata
  - Fields: identity, contracts, security, health
  - Relationships: references contract schemas

- Event Envelope
  - Fields: CloudEvents attrs, traceId, correlationId, identity (PoC)

## Validation Rules

- spas.json must conform to repository JSON schema
- Contracts reference versioned schemas; additive-only evolution

## State Transitions

- Metadata fragments → SDK composition → canonical spas.json (dev)
- Publish events → sidecar mediation → transformed domain/internal as configured
