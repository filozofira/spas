# Versioning Strategy

## Semantic Versioning

- `MAJOR.MINOR.PATCH` for services, SDKs, repository API, and protocols

## API Versioning

- gRPC: package versions (`v1`, `v2`)
- REST (edge): versioned paths (`/v1/...`)

## Event Versioning

- Versioned event types (e.g., `order.placed.v1`)
- Additive-only schema evolution; new fields optional

## Metadata Versioning

- `spas.json` schema versioned independently

## Deprecation Policy

- Minimum support window (e.g., 6 months)
- Deprecation notice in metadata
- Migration guides for breaking changes

## Related Documents

- [Compliance Checklist](24-compliance-checklist.md)
- [Evolution Policy](25-evolution-policy.md)
- [Service Lifecycle](../service-specification/05-service-lifecycle.md)
