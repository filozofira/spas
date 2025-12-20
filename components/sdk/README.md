
# SPAS SDKs

Language SDKs for building SPAS services (metadata + events + context propagation). Each SDK should generate compatible `spas.json` and publish events through the sidecar.

## Implementations

- [components/sdk/dotnet/README.md](./dotnet/README.md)
- [components/sdk/java/README.md](./java/README.md)

## Common schemas

Canonical, cross-SDK JSON Schemas live in:

- [components/sdk/schemas/README.md](./schemas/README.md)
- [design-time-metadata-v1 schema](./schemas/README.md)

## References

- [SDK principles](../../principles/component/12-sdk.md)
- [Communication model](../../principles/protocol/07-communication-model.md)
- [Event protocol](../../principles/protocol/09-event-protocol.md)

