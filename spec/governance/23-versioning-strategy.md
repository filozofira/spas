# Versioning Strategy

## Semantic Versioning

- `MAJOR.MINOR.PATCH` for services, SDKs, repository API, and protocols

## API Versioning

- gRPC: package versions (`v1`, `v2`) — mandatory
- REST (edge): versioned paths (`/v1/...`) — recommendation (external gateway responsibility; not enforced by SPAS tooling)

## Event Versioning

- Versioned event types (e.g., `orders.order-created.v1`) — version embedded in CloudEvents `type`
- Additive-only schema evolution; new fields optional; breaking change requires new major suffix

## Metadata Versioning & Validation

- `spas.json` schema versioned independently
- Machine verifiable fields: `boundedContext`, `idempotency.strategy` (if present), `consistency.commands` (must be ACID), `consistency.queries` (allowed enum)
- Conceptual constraints (e.g., single bounded context) documented but not provably enforceable beyond field presence

## Deprecation Policy

- Minimum support window (e.g., 6 months)
- Deprecation notice in metadata
- Migration guides for breaking changes

## Related Documents

- [Compliance Checklist](24-compliance-checklist.md)
- [Evolution Policy](25-evolution-policy.md)
- [Service Lifecycle](../service-specification/05-service-lifecycle.md)
