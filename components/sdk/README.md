
# SPAS SDKs

Language SDKs for building SPAS services (metadata + events + context propagation). Each SDK should generate compatible `spas.json` and publish events through the sidecar.

## Implementations

- [dotnet/README.md](./dotnet/README.md)
- [java/README.md](./java/README.md)

## Common schemas

Canonical, cross-SDK JSON Schemas live in [schemas/README.md](./schemas/README.md).

Start here:

- [design-time-metadata-v1.schema.json](./schemas/design-time-metadata-v1.schema.json)

## References

- [SDK principles](../../principles/component/12-sdk.md)
- [Communication model](../../principles/protocol/07-communication-model.md)
- [Event protocol](../../principles/protocol/09-event-protocol.md)

