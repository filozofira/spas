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
}

// Test DTOs for deduplication tests
public record SharedOrderDto(string OrderId, decimal Amount);
public record SharedCustomerDto(string CustomerId, string Name);
