using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Models;
using Spas.Sdk.Metadata.Tests.Helpers;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataArchiveGeneratorTests
{
    [SpasEvent("TestEventForArchive", "1.0.0")]
    private sealed record TestEvent(string Id);

    [Fact]
    public async Task GenerateAsync_WritesZipAndIncludesSpasJson()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            var identity = new ServiceIdentityBuilder()
                .WithId("test-service")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            Assert.True(File.Exists(zipPath));

            var entries = ZipAssert.ReadEntryNames(zipPath);
            Assert.Contains("spas.json", entries);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GenerateAsync_WithDefaultOutputDirectory_CreatesMetadataDirectoryAndWritesZip()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        var originalCurrentDirectory = Environment.CurrentDirectory;
        try
        {
            Environment.CurrentDirectory = tempRoot;

            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            var identity = new ServiceIdentityBuilder()
                .WithId("test-service")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: null,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            var expectedZipPath = Path.Combine(
                tempRoot,
                "metadata",
                "service.metadata.zip");

            Assert.Equal(expectedZipPath, zipPath);
            Assert.True(File.Exists(zipPath));

            var entries = ZipAssert.ReadEntryNames(zipPath);
            Assert.Contains("spas.json", entries);
        }
        finally
        {
            Environment.CurrentDirectory = originalCurrentDirectory;

            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GenerateAsync_WhenArchiveExists_OverwritesExistingFile()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            var identity = new ServiceIdentityBuilder()
                .WithId("test-service")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            Assert.True(File.Exists(zipPath));

            await File.WriteAllTextAsync(zipPath, "not a zip");

            var overwrittenZipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            Assert.Equal(zipPath, overwrittenZipPath);

            var entries = ZipAssert.ReadEntryNames(overwrittenZipPath);
            Assert.Contains("spas.json", entries);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GenerateAsync_WhenSpasJsonIsSchemaInvalid_FailsWithActionableError()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            // Invalid per design-time-metadata-v1.schema.json (must be kebab-case)
            var identity = new ServiceIdentityBuilder()
                .WithId("INVALID_ID")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                app.GenerateSpasMetadataArchiveAsync(
                    identity,
                    outputDirectory: tempRoot,
                    assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly));

            Assert.Contains("schema validation", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    // T010: Test for deduplication when multiple endpoints use same DTO (US1)
    [Fact]
    public void ContractsBuilder_WithSameTypeForMultipleEndpoints_DeduplicatesTypeMapping()
    {
        var builder = new ContractsBuilder();

        // Two endpoints using the same DTO type with the same schema reference
        builder.AddEndpoint(
            name: "create-order",
            type: "Command",
            protocol: "Http",
            methodPath: "/api/orders",
            version: "1.0.0",
            schemaRef: "schemas/endpoints/order-request.schema.json",
            requestBodyType: typeof(SharedOrderDto));

        builder.AddEndpoint(
            name: "update-order",
            type: "Command",
            protocol: "Http",
            methodPath: "/api/orders/{id}",
            version: "1.0.0",
            schemaRef: "schemas/endpoints/order-request.schema.json",
            requestBodyType: typeof(SharedOrderDto));

        // Verify only one type mapping exists (deduplication)
        Assert.Single(builder.EndpointRequestBodyTypes);
        Assert.Equal(typeof(SharedOrderDto), builder.EndpointRequestBodyTypes["schemas/endpoints/order-request.schema.json"]);
    }

    // T010: Test that different DTOs get different schema entries
    [Fact]
    public void ContractsBuilder_WithDifferentTypesForEndpoints_StoresBothTypeMappings()
    {
        var builder = new ContractsBuilder();

        builder.AddEndpoint(
            name: "create-order",
            type: "Command",
            protocol: "Http",
            methodPath: "/api/orders",
            version: "1.0.0",
            schemaRef: "schemas/endpoints/create-order.schema.json",
            requestBodyType: typeof(SharedOrderDto));

        builder.AddEndpoint(
            name: "create-customer",
            type: "Command",
            protocol: "Http",
            methodPath: "/api/customers",
            version: "1.0.0",
            schemaRef: "schemas/endpoints/create-customer.schema.json",
            requestBodyType: typeof(SharedCustomerDto));

        // Verify both type mappings exist
        Assert.Equal(2, builder.EndpointRequestBodyTypes.Count);
        Assert.Equal(typeof(SharedOrderDto), builder.EndpointRequestBodyTypes["schemas/endpoints/create-order.schema.json"]);
        Assert.Equal(typeof(SharedCustomerDto), builder.EndpointRequestBodyTypes["schemas/endpoints/create-customer.schema.json"]);
    }

    // T026 [US2]: Integration test simulating AI-scaffolded service with plain DTOs
    // This test verifies that services generated by AI agents with no DTO attributes
    // produce valid metadata archives with correct schema generation
    [Fact]
    public async Task GenerateAsync_WithPlainDtoEndpoints_ProducesValidMetadataArchive()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            // Simulate AI-generated service with plain DTOs (no [SpasCommand] on DTOs)
            // Only endpoint handlers have [SpasCommand] attributes
            app.MapPost("/api/orders", (PlainCreateOrderRequest request) => Results.Ok(new { id = "ord-123" }))
                .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0.0") { Description = "Creates a new order" });

            app.MapPost("/api/customers", (PlainCustomerRequest request) => Results.Ok(new { id = "cust-456" }))
                .WithMetadata(new SpasCommandAttribute("CreateCustomer", "1.0.0") { Description = "Creates a new customer" });

            app.MapGet("/api/orders/{id}", (string id) => Results.Ok())
                .WithMetadata(new SpasQueryAttribute("GetOrder", "1.0.0") { Description = "Gets an order by ID" });

            var identity = new ServiceIdentityBuilder()
                .WithId("ai-generated-service")
                .WithName("AI Generated Service")
                .WithVersion("1.0.0")
                .WithBoundedContext("ai-test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            // Verify archive was created
            Assert.True(File.Exists(zipPath), "Metadata archive should be created");

            // Verify archive contents
            var entries = ZipAssert.ReadEntryNames(zipPath);

            // Must contain spas.json
            Assert.Contains("spas.json", entries);

            // Must contain endpoint schemas generated from plain DTOs
            Assert.Contains("schemas/endpoints/create-order.schema.json", entries);
            Assert.Contains("schemas/endpoints/create-customer.schema.json", entries);

            // Verify spas.json contains the endpoints
            var spasJsonContent = ZipAssert.ReadEntryContent(zipPath, "spas.json");
            Assert.Contains("\"create-order\"", spasJsonContent);
            Assert.Contains("\"create-customer\"", spasJsonContent);
            Assert.Contains("\"get-order\"", spasJsonContent);

            // Verify schema content includes properties from plain DTOs (camelCase per SDK convention)
            var orderSchemaContent = ZipAssert.ReadEntryContent(zipPath, "schemas/endpoints/create-order.schema.json");
            Assert.Contains("customerId", orderSchemaContent);
            Assert.Contains("items", orderSchemaContent);
            Assert.Contains("total", orderSchemaContent);

            var customerSchemaContent = ZipAssert.ReadEntryContent(zipPath, "schemas/endpoints/create-customer.schema.json");
            Assert.Contains("name", customerSchemaContent);
            Assert.Contains("email", customerSchemaContent);
            Assert.Contains("address", customerSchemaContent);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    // T026 [US2]: Test that nested complex types in plain DTOs are included in schema
    [Fact]
    public async Task GenerateAsync_WithNestedPlainDtos_IncludesNestedTypesInSchema()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            // Plain DTO with nested complex types
            app.MapPost("/api/customers", (PlainCustomerRequest request) => Results.Ok())
                .WithMetadata(new SpasCommandAttribute("CreateCustomer", "1.0.0"));

            var identity = new ServiceIdentityBuilder()
                .WithId("nested-dto-service")
                .WithName("Nested DTO Service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            // Verify schema includes nested type properties (camelCase per SDK convention)
            var schemaContent = ZipAssert.ReadEntryContent(zipPath, "schemas/endpoints/create-customer.schema.json");

            // Top-level properties
            Assert.Contains("name", schemaContent);
            Assert.Contains("email", schemaContent);
            Assert.Contains("address", schemaContent);

            // Nested PlainAddressInfo properties should be in the schema
            Assert.Contains("street", schemaContent);
            Assert.Contains("city", schemaContent);
            Assert.Contains("zipCode", schemaContent);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }
}

// Test DTOs for deduplication tests
public record SharedOrderDto(string OrderId, decimal Amount);
public record SharedCustomerDto(string CustomerId, string Name);

// T026: Test DTOs for AI-scaffolded service simulation (plain DTOs without SPAS attributes)
public record PlainCreateOrderRequest(string CustomerId, List<PlainOrderLineItem> Items, decimal Total);
public record PlainOrderLineItem(string ProductId, int Quantity, decimal UnitPrice);
public record PlainCustomerRequest(string Name, string Email, PlainAddressInfo Address);
public record PlainAddressInfo(string Street, string City, string ZipCode);
