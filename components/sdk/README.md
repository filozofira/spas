
# SPAS SDKs

Language SDKs for building SPAS services (metadata + events + context propagation). Each SDK generates compatible `spas.json` and publishes events through the sidecar.

## For Users

Choose your language and follow the quickstart:

- [.NET SDK](./dotnet/README.md) - Build services with .NET 10
- [Java SDK](./java/README.md) - Build services with Java 17+ (framework-agnostic)

Each SDK provides:
- Metadata generation (`spas.json` + schemas)
- Event publishing to sidecar
- Trace context propagation
- Identity context (PoC)
- Offline metadata archive generation

### Examples

For end-to-end runnable examples and walkthroughs, see the examples services overview:

- [Examples Services README](../../examples/services/README.md)

## For Contributors

Contributing to the SDK implementations:

- [.NET SDK Contributing Guide](./dotnet/CONTRIBUTING.md)
- [Java SDK Contributing Guide](./java/CONTRIBUTING.md)
- [Shared Conventions](./CONVENTIONS.md) - Cross-SDK rules (naming, schemas, boundaries)

## Common schemas

Canonical metadata JSON Schemas live in [../schemas/README.md](../schemas/README.md).

Start here:

- [design-time-metadata-v1.schema.json](../schemas/design-time-metadata-v1.schema.json)

## References

- [SDK principles](../../principles/component/12-sdk.md)
- [Communication model](../../principles/protocol/07-communication-model.md)
- [Event protocol](../../principles/protocol/09-event-protocol.md)

