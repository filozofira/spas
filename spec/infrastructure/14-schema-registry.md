# Schema Registry (Integrated, PoC)

Manages service internal schemas referenced by `spas.json` and used in choreography mappings.

## Storage & Naming

- Stored with repository metadata store
- Naming: `{repo}/{service}/{schemaName}/{version}`

## API (baseline)

- `POST /schemas` — publish schema
- `GET /schemas/{repo}/{service}/{name}/{version}` — retrieve
- `GET /schemas/{repo}/{service}/{name}/versions` — list versions

## Compatibility Checks

- Backward/forward compatibility checks for JSON Schema/Protobuf
- Additive-only evolution recommended

> Production note: Separate service or pluggable backends may be introduced.

## Related Documents

- [Event Protocol](../protocol-specification/09-event-protocol.md)
- [SDK Specification](../tooling/16-sdk-specification.md)
- [Repository Specification](13-repository-spec.md)
