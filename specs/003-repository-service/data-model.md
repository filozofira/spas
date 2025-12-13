# Data Model (Phase 1)

## Entities

### Service
- serviceName: string
- boundedContext: string
- capabilities: string[]

### ServiceVersion
- serviceName: string (FK to Service)
- version: string (semver)
- spasJson: object
- imageDigest: string (optional)
- publishedAt: datetime

### Schema
- serviceName: string
- version: string
- schemaName: string
- schemaType: "event" | "internal"
- content: object (JSON Schema)

## Relationships
- Service 1..* ServiceVersion
- ServiceVersion 1..* Schema

## Validation Rules
- Duplicate detection: unique (serviceName, version)
- Path authority: `{serviceName}:{version}` in URL must match `spas.json`
- Schema evolution: additive-only (new optional fields)
