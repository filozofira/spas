using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

public class WebApplicationDiscoveryExtensionsTests
{
    [Fact]
    public void DiscoverSpasMetadata_DiscoversEndpointsWithMethodPathAndProtocol_WithoutRunningServer()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(WebApplicationDiscoveryExtensionsTests).Assembly);
        });

        var app = builder.Build();

        app.MapPost("/api/orders", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0.0"));

        app.MapGet("/api/orders/{id}", (string id) => Results.Ok(id))
            .WithMetadata(new SpasQueryAttribute("GetOrder", "1.0.0"));

        var contracts = app.DiscoverSpasMetadata();

        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "create-order" &&
            e.Type == "Command" &&
            e.Protocol == "Http" &&
            e.MethodPath == "/api/orders");

        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "get-order" &&
            e.Type == "Query" &&
            e.Protocol == "Http" &&
            e.MethodPath == "/api/orders/{id}");
    }

    // T007: Test for schema inference from plain DTO parameter (US1)
    [Fact]
    public void DiscoverSpasMetadata_WithPlainDtoParameter_StoresTypeForSchemaInference()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(WebApplicationDiscoveryExtensionsTests).Assembly);
        });

        var app = builder.Build();

        // Plain DTO - no [SpasCommand] on the record itself
        app.MapPost("/api/orders", (PlainOrderRequest request) => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0.0"));

        var contracts = app.DiscoverSpasMetadata();

        // Verify endpoint is discovered
        var endpoint = Assert.Single(contracts.Endpoints, e => e.Name == "create-order");
        Assert.Equal("schemas/endpoints/create-order.schema.json", endpoint.SchemaRef);

        // Verify ContractsBuilder storage has the type mapping
        var storedBuilder = ContractsBuilderStorage.Retrieve(app);
        Assert.NotNull(storedBuilder);
        Assert.True(storedBuilder.EndpointRequestBodyTypes.ContainsKey("schemas/endpoints/create-order.schema.json"));
        Assert.Equal(typeof(PlainOrderRequest), storedBuilder.EndpointRequestBodyTypes["schemas/endpoints/create-order.schema.json"]);

        // Cleanup
        ContractsBuilderStorage.Remove(app);
    }

    // T008: Test for endpoint with no request body parameter (US1)
    [Fact]
    public void DiscoverSpasMetadata_WithNoRequestBody_DoesNotStoreType()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(WebApplicationDiscoveryExtensionsTests).Assembly);
        });

        var app = builder.Build();

        // Endpoint with no body parameter (route-only)
        app.MapDelete("/api/orders/{id}", (string id) => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("DeleteOrder", "1.0.0"));

        var contracts = app.DiscoverSpasMetadata();

        // Verify endpoint is discovered
        var endpoint = Assert.Single(contracts.Endpoints, e => e.Name == "delete-order");
        Assert.Equal("schemas/endpoints/delete-order.schema.json", endpoint.SchemaRef);

        // Verify ContractsBuilder storage does NOT have a type mapping (primitive string parameter)
        var storedBuilder = ContractsBuilderStorage.Retrieve(app);
        Assert.NotNull(storedBuilder);
        Assert.False(storedBuilder.EndpointRequestBodyTypes.ContainsKey("schemas/endpoints/delete-order.schema.json"));

        // Cleanup
        ContractsBuilderStorage.Remove(app);
    }

    // T009: Test for endpoint with primitive parameter type (US1)
    [Fact]
    public void DiscoverSpasMetadata_WithPrimitiveParameter_DoesNotStoreType()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(WebApplicationDiscoveryExtensionsTests).Assembly);
        });

        var app = builder.Build();

        // Endpoint with primitive parameter
        app.MapPost("/api/count", (int count) => Results.Ok(count))
            .WithMetadata(new SpasCommandAttribute("SetCount", "1.0.0"));

        var contracts = app.DiscoverSpasMetadata();

        // Verify endpoint is discovered
        var endpoint = Assert.Single(contracts.Endpoints, e => e.Name == "set-count");

        // Verify ContractsBuilder storage does NOT have a type mapping for primitives
        var storedBuilder = ContractsBuilderStorage.Retrieve(app);
        Assert.NotNull(storedBuilder);
        Assert.False(storedBuilder.EndpointRequestBodyTypes.ContainsKey("schemas/endpoints/set-count.schema.json"));

        // Cleanup
        ContractsBuilderStorage.Remove(app);
    }

    // Test helper to verify IsPrimitiveOrSimpleType works correctly
    [Theory]
    [InlineData(typeof(int), true)]
    [InlineData(typeof(string), true)]
    [InlineData(typeof(Guid), true)]
    [InlineData(typeof(DateTime), true)]
    [InlineData(typeof(decimal), true)]
    [InlineData(typeof(PlainOrderRequest), false)]
    public void IsPrimitiveOrSimpleType_ReturnsCorrectResult(Type type, bool expected)
    {
        var result = WebApplicationDiscoveryExtensions.IsPrimitiveOrSimpleType(type);
        Assert.Equal(expected, result);
    }
}

// Plain DTO for testing - no SPAS attributes required
public record PlainOrderRequest(string CustomerId, decimal Amount, List<PlainOrderItem> Items);
public record PlainOrderItem(string ProductId, int Quantity);
