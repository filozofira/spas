
# SPAS SDKs

Language SDKs for building SPAS services (metadata + events + context propagation). Each SDK generates compatible `spas.json` and publishes events through the sidecar.

## For Users

Choose your language and follow the quickstart:

- [.NET SDK](./dotnet/README.md) - Build services with .NET 10
- [Java SDK](./java/README.md) - Build services with Java 21+ (framework-agnostic)

Each SDK provides:
- Metadata generation (`spas.json` + schemas)
- Event publishing to sidecar
- Trace context propagation
- Identity context (PoC)
- Offline metadata archive generation

### Examples

For end-to-end runnable examples and walkthroughs, see the examples services overview:

- [Examples Services README](../../examples/services/README.md)

## Design Principles

SPAS services follow **domain-agnostic design** to maximize reusability across different business contexts. These principles guide how you design service contracts, entity models, and operations.

### Core Pillars

> 💡 **Neutral Entity Naming**  
> Use generic identifiers that transcend domain boundaries: `itemId` not `productId`, `referenceId` not `orderId`.  
> 📖 [Service Model Principles](../../principles/service/03-service-model.md#entity-identifier-neutrality)

> 🌐 **Semantic Portability**  
> Describe capabilities without domain vocabulary: "reserve countable items" not "reserve product stock".  
> 📖 [Service Contract Principles](../../principles/service/04-service-contract.md#domain-agnostic-contracts)

> 🔄 **Context-Free Operations**  
> Business logic operates on abstract entities. Service doesn't know if managing products, licenses, or supplies—only "items".  
> 📖 [Service Model Principles](../../principles/service/03-service-model.md#context-free-operations)

> 📤 **Caller-Provided Context**  
> Domain context comes through event metadata, not entity models. Treat domain identifiers as opaque correlation keys.  
> 📖 [Service Model Principles](../../principles/service/03-service-model.md#neutral-identifiers)

> ✅ **Cross-Domain Reusability Test**  
> If renaming one identifier breaks the abstraction, design is domain-coupled. Good design: `referenceId` value changes don't require code.  
> 📖 [Service Model Principles](../../principles/service/03-service-model.md#when-to-apply)

> 📝 **Description Clarity**  
> Write capability-focused descriptions that enable AI semantic matching across domains.  
> ✅ "Reserves specified item quantities for a transaction" ❌ "Reserves product stock for an order"  
> 📖 [Metadata Descriptions](../../specs/017-metadata-descriptions/spec.md)

**When to apply:** Utility services (inventory, fulfillment, notifications) SHOULD be domain-agnostic. Domain services (order-service, subscription-service) own their context and use domain-specific identifiers internally.

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

