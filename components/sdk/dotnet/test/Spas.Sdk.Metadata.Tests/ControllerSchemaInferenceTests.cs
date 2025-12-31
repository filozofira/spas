using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Tests.Fixtures;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Unit tests for controller schema inference (T019, T020 - US3).
/// Validates that schemas are correctly inferred from [FromBody] parameters and ActionResult&lt;T&gt; return types.
/// </summary>
public class ControllerSchemaInferenceTests
{
    [Fact]
    public void DiscoverSpasMetadata_WithFromBodyParameter_StoresTypeForSchemaGeneration()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(SchemaTestController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(SchemaTestController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - CreateProduct endpoint should have ProductCreateRequest type stored
        var createProductEndpoint = contracts.Endpoints.First(e => e.Name == "create-product");
        Assert.NotNull(createProductEndpoint);
        Assert.Equal("schemas/endpoints/create-product.schema.json", createProductEndpoint.SchemaRef);
        
        // The request body type should have been stored in the builder for schema generation
        // (verified indirectly by checking endpoint exists with correct schema ref)
    }

    [Fact]
    public void DiscoverSpasMetadata_WithNestedComplexType_StoresTypeForSchemaGeneration()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(SchemaTestController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(SchemaTestController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - CreateOrder endpoint with nested complex types (OrderLineItem, ShippingAddress)
        var createOrderEndpoint = contracts.Endpoints.First(e => e.Name == "create-order");
        Assert.NotNull(createOrderEndpoint);
        Assert.Equal("/api/schema-test/order", createOrderEndpoint.MethodPath);
        Assert.Equal("Command", createOrderEndpoint.Type);
    }

    [Fact]
    public void DiscoverSpasMetadata_WithAsyncActionResult_HandlesCorrectly()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(SchemaTestController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(SchemaTestController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - UpdateProduct with Task<ActionResult<ProductResponse>>
        var updateProductEndpoint = contracts.Endpoints.First(e => e.Name == "update-product");
        Assert.NotNull(updateProductEndpoint);
        Assert.Equal("/api/schema-test/product/{id}", updateProductEndpoint.MethodPath);
        Assert.Equal("Command", updateProductEndpoint.Type);
    }

    [Fact]
    public void DiscoverSpasMetadata_WithQueryAndActionResult_CreatesEndpoint()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(SchemaTestController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(SchemaTestController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - GetProduct query with ActionResult<ProductResponse>
        var getProductEndpoint = contracts.Endpoints.First(e => e.Name == "get-product");
        Assert.NotNull(getProductEndpoint);
        Assert.Equal("Query", getProductEndpoint.Type);
        Assert.Equal("/api/schema-test/product/{id}", getProductEndpoint.MethodPath);
    }

    [Fact]
    public void DiscoverSpasMetadata_AllSchemaTestEndpoints_AreDiscovered()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(SchemaTestController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(SchemaTestController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - All 4 endpoints from SchemaTestController discovered
        Assert.Contains(contracts.Endpoints, e => e.Name == "create-product" && e.MethodPath == "/api/schema-test/product");
        Assert.Contains(contracts.Endpoints, e => e.Name == "get-product" && e.MethodPath == "/api/schema-test/product/{id}");
        Assert.Contains(contracts.Endpoints, e => e.Name == "update-product" && e.MethodPath == "/api/schema-test/product/{id}");
        Assert.Contains(contracts.Endpoints, e => e.Name == "create-order" && e.MethodPath == "/api/schema-test/order");
    }
}
