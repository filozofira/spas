# Quickstart: Design-Time Metadata Alignment (net10.0)

## Prerequisites

- .NET SDK targeting net10.0
- SPAS .NET SDK projects referenced in your service

## Steps

1. Define endpoints with SPAS attributes and include `schemaRef` for request/response where applicable.
2. Discover metadata in your service and compose design-time `spas.json`.
3. Validate `spas.json` against `design-time-metadata-v1` using `JsonSchema.Net`.

## Sample Snippets

```csharp
// Discover contracts
var contracts = app.DiscoverSpasMetadata();

// Compose design-time spas.json
var composer = new SpasComposer();
await composer.ComposeToFileAsync(
    path: "spas.json",
    identity: new ServiceIdentityBuilder()
        .WithName("payment-service")
        .WithVersion("1.2.0")
        .WithDescription("Payment Service")
        .Build(),
    contracts: contracts,
    security: new SecurityBuilder()
        .WithAuthentication(required: true, schemes: ["jwt"], requiredScopes: ["payments.read", "payments.write"]) 
        .WithDataClassification(["pii"]) 
        .Build(),
    network: new NetworkBuilder().WithRequiredEgress(["api.stripe.com:443"]).Build(),
    consistency: new ConsistencyBuilder().WithCommandsAcid().WithQueriesEventual().Build()
);
```

```csharp
// Validate spas.json (example using JsonSchema.Net)
using Json.Schema;
var json = await File.ReadAllTextAsync("spas.json");
var schema = JsonSchema.FromFile("design-time-metadata-v1.schema.json");
var result = schema.Validate(json);
if (!result.IsValid) throw new Exception(result.ToJsonString());
```

## Contracts

- OpenAPI: see `contracts/openapi.yaml`
- Schemas: see `contracts/schemas/*.json`
