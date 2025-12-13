# Quickstart: Design-Time Metadata Alignment (net10.0)

## Prerequisites

- .NET SDK targeting net10.0
- SPAS .NET SDK projects referenced in your service

## Steps

1. Define endpoints with SPAS attributes and include `schemaRef` for request/response where applicable.
2. Discover metadata in your service and compose design-time `spas.json`.
3. Validate `spas.json` against `design-time-metadata-v1` using `JsonSchema.Net`.

## Sample Snippets

### Building Metadata

```csharp
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;

// Define service identity
var identity = new ServiceIdentityBuilder()
    .WithId("payment-service")
    .WithName("Payment Service")
    .WithVersion("1.2.0")
    .WithDescription("Handles payment processing")
    .WithBoundedContext("Payments")
    .AddCapability("ProcessPayments")
    .AddCapability("RefundPayments")
    .Build();

// Define contracts with schemaRef
var contracts = new ContractsBuilder()
    .AddEndpoint("CreatePayment", "Command", "Http", "POST /api/payments", "1.0", "schemas/create-payment.schema.json")
    .AddEndpoint("GetPayment", "Query", "Http", "GET /api/payments/{id}", "1.0", "schemas/get-payment.schema.json")
    .AddEvent("PaymentCreated", "1.0", "schemas/payment-created.schema.json")
    .AddEvent("PaymentFailed", "1.0", "schemas/payment-failed.schema.json")
    .Build();

// Define security requirements
var security = new SecurityBuilder()
    .WithAuthenticationType("OAuth2")
    .AddRequiredScope("payments.read")
    .AddRequiredScope("payments.write")
    .AddDataClassification("Internal")
    .AddDataClassification("Confidential")
    .Build();

// Define consistency guarantees
var consistency = new ConsistencyBuilder()
    .WithCommands("ACID")
    .WithQueries("EVENTUAL")
    .Build();

// Define network dependencies
var network = new NetworkBuilder()
    .AddRequiredEgress("payment-gateway.stripe.com")
    .AddRequiredEgress("fraud-detection-service")
    .Build();

// Compose to file
var composer = new SpasComposer();
composer.ComposeToFile(
    path: "spas.json",
    identity: identity,
    contracts: contracts,
    security: security,
    consistency: consistency,
    network: network,
    license: "MIT"
);
```

### Auto-Discovery with ASP.NET Core

```csharp
// Discover contracts from attributed endpoints
var contracts = app.DiscoverSpasMetadata();

// Compose with discovered contracts
composer.ComposeToFile(
    path: "spas.json",
    identity: identity,
    contracts: contracts,
    security: security,
    consistency: consistency,
    network: network,
    license: "MIT"
);
```

### Validation with JsonSchema.Net

```csharp
using System.Text.Json;
using Json.Schema;

// Load design-time schema (distributed via CLI/Repository, not bundled in SDK)
// Schema location: components/sdk/schemas/design-time-metadata-v1.schema.json
var schemaJson = await File.ReadAllTextAsync("design-time-metadata-v1.schema.json");
var schema = JsonSchema.FromText(schemaJson);

// Load generated spas.json
var metadataJson = await File.ReadAllTextAsync("spas.json");
var metadataDoc = JsonDocument.Parse(metadataJson);

// Validate
var validationResult = schema.Evaluate(metadataDoc, new EvaluationOptions { OutputFormat = OutputFormat.List });

if (!validationResult.IsValid)
{
    var errors = validationResult.Errors?.Select(e => e.ToString()) ?? Enumerable.Empty<string>();
    throw new InvalidOperationException($"Metadata validation failed: {string.Join(", ", errors)}");
}

Console.WriteLine("✓ Metadata validation passed");
```

## Contracts

- OpenAPI: see `contracts/openapi.yaml`
- Schemas: see `contracts/schemas/*.json`
