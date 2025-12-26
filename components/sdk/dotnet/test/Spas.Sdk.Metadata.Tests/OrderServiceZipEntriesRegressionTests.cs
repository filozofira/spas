using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Dev;
using Spas.Sdk.Metadata.Schema;
using Spas.Sdk.Metadata.Tests.Fixtures;
using Spas.Sdk.Metadata.Tests.Helpers;
using Spas.Sdk.Metadata.Validation;

namespace Spas.Sdk.Metadata.Tests;

public sealed class OrderServiceZipEntriesRegressionTests
{
    [Fact]
    public async Task OrderService_GeneratedZipEntries_MatchReference()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var zipPath = Path.Combine(tempRoot, "service.metadata.zip");

            // Generate archive in-process using SDK components and test-double contracts
            await GenerateTestArchiveAsync(zipPath);

            Assert.True(File.Exists(zipPath), $"Expected metadata archive at: {zipPath}");

            var actualEntries = ZipAssert.ReadEntryNames(zipPath);
            var expectedEntries = ReferenceZipEntries.OrderService_1_0_0
                .Order(StringComparer.Ordinal)
                .ToArray();

            Assert.Equal(expectedEntries, actualEntries);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    private static async Task GenerateTestArchiveAsync(string zipPath)
    {
        // Build service identity matching order-service
        var identity = new ServiceIdentityBuilder()
            .WithId("order-service")
            .WithName("Order Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("Orders")
            .Build();

        // Build contracts manually to match order-service structure
        var contractsBuilder = new ContractsBuilder();
        contractsBuilder.AddEndpoint("create-order", "Command", "Http", "POST /api/orders", "1.0", "schemas/endpoints/create-order.schema.json");
        contractsBuilder.AddEndpoint("confirm-order", "Command", "Http", "POST /api/orders/confirm", "1.0", "schemas/endpoints/confirm-order.schema.json");
        contractsBuilder.AddEndpoint("update-shipment-status", "Command", "Http", "POST /api/orders/shipment", "1.0", "schemas/endpoints/update-shipment-status.schema.json");
        contractsBuilder.AddEvent("order-created", "1.0", "schemas/events/order-created.schema.json");
        contractsBuilder.AddEvent("order-confirmed", "1.0", "schemas/events/order-confirmed.schema.json");
        var contracts = contractsBuilder.Build();

        // Generate spas.json
        var composer = new SpasComposer();
        var spasJson = composer.Compose(identity, contracts);

        // Validate
        var validator = new SchemaValidator();
        var validation = validator.Validate(spasJson);
        if (!validation.IsValid)
        {
            throw new InvalidOperationException($"Generated spas.json failed validation: {string.Join("; ", validation.Errors)}");
        }

        // Generate schemas only for our test-double types
        var schemaGenerator = new SchemaGenerator();
        var schemas = new Dictionary<string, object>();
        
        // Generate schemas for commands
        schemas["schemas/endpoints/create-order.schema.json"] = await schemaGenerator.GenerateSchemaAsync(typeof(CreateOrderRequest));
        schemas["schemas/endpoints/confirm-order.schema.json"] = await schemaGenerator.GenerateSchemaAsync(typeof(ConfirmOrderRequest));
        schemas["schemas/endpoints/update-shipment-status.schema.json"] = await schemaGenerator.GenerateSchemaAsync(typeof(UpdateShipmentStatusRequest));
        
        // Generate schemas for events
        schemas["schemas/events/order-created.schema.json"] = await schemaGenerator.GenerateSchemaAsync(typeof(OrderCreatedEvent));
        schemas["schemas/events/order-confirmed.schema.json"] = await schemaGenerator.GenerateSchemaAsync(typeof(OrderConfirmedEvent));

        // Create archive
        var archiveWriter = new MetadataArchiveWriter();
        var archiveStream = await archiveWriter.CreateArchiveAsync(spasJson, schemas);

        // Write to file
        await using var fileStream = File.Create(zipPath);
        archiveStream.Position = 0;
        await archiveStream.CopyToAsync(fileStream);
    }

    // Test-double contract types that produce the required schema filenames
    [SpasCommand("CreateOrder", "1.0")]
    internal sealed record CreateOrderRequest(string CustomerId, int ItemCount);

    [SpasCommand("ConfirmOrder", "1.0")]
    internal sealed record ConfirmOrderRequest(Guid OrderId);

    [SpasCommand("UpdateShipmentStatus", "1.0")]
    internal sealed record UpdateShipmentStatusRequest(Guid OrderId, string Status);

    [SpasEvent("OrderCreated", "1.0")]
    internal sealed record OrderCreatedEvent(Guid OrderId, DateTimeOffset Timestamp);

    [SpasEvent("OrderConfirmed", "1.0")]
    internal sealed record OrderConfirmedEvent(Guid OrderId, DateTimeOffset Timestamp);
}
