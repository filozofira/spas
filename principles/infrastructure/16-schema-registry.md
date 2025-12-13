# Schema Registry (Integrated, PoC)

Manages service internal schemas referenced by `spas.json` and used in choreography mappings.

## Storage & Naming

- Stored with repository metadata store
- Naming: `{repo}/{service}/{schemaName}/{version}`

## API (baseline)

Unified service-centric path structure:

- `POST /services/{id}/versions/{version}/schemas` — publish schema
- `GET /services/{id}/versions/{version}/schemas` — list schemas for version
- `GET /services/{id}/versions/{version}/schemas/{schemaName}` — retrieve schema
- `GET /schemas?serviceId=&eventType=` — global search/listing

## Compatibility Checks

- Additive-only evolution enforced for JSON Schema (new optional fields only)
- Future: pluggable validators for Avro/Proto
- Failure severity: PoC logs warning; Production blocks publish

> Production note: Separate service or pluggable backends may be introduced.

## Related Documents

- [Event Protocol](../protocol/09-event-protocol.md)
- [SDK](../component/12-sdk.md)
- [Repository](../component/11-repository.md)
