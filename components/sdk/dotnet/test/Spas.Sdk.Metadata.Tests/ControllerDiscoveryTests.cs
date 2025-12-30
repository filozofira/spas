using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Tests.Fixtures;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Tests for controller metadata discovery (Feature 026 - US1).
/// </summary>
public class ControllerDiscoveryTests
{
    [Fact]
    public void DiscoverSpasMetadata_DiscoversControllerCommand_WithRouteAndVerb()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ControllerDiscoveryTests).Assembly);
        });
        
        // Add controllers and explicitly add this assembly's application part
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(TestOrdersController).Assembly);
        
        var app = builder.Build();
        app.MapControllers(); // Map controller routes

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert
        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "create-test-order" &&
            e.Type == "Command" &&
            e.Protocol == "Http" &&
            e.MethodPath == "/api/test-orders" &&
            e.Version == "1.0.0");
    }

    [Fact]
    public void DiscoverSpasMetadata_DiscoversControllerQuery_WithRouteParameter()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ControllerDiscoveryTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(TestOrdersController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert
        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "get-test-order" &&
            e.Type == "Query" &&
            e.Protocol == "Http" &&
            e.MethodPath == "/api/test-orders/{id}" &&
            e.Version == "1.0.0");
    }

    [Fact]
    public void DiscoverSpasMetadata_WithControllers_PreservesMinimalApiEndpoints()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ControllerDiscoveryTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(TestOrdersController).Assembly);
        
        var app = builder.Build();
        
        // Add a Minimal API endpoint
        app.MapPost("/api/minimal-command", () => Results.Ok())
            .WithMetadata(new Spas.Sdk.Metadata.Attributes.SpasCommandAttribute("MinimalCommand", "1.0.0"));
        
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Both Minimal API and Controller should be discovered
        Assert.Contains(contracts.Endpoints, e => e.Name == "minimal-command");
        Assert.Contains(contracts.Endpoints, e => e.Name == "create-test-order");
    }

    [Fact]
    public void DiscoverSpasMetadata_ExtractsRequestBodyType_FromFromBodyAttribute()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ControllerDiscoveryTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(TestOrdersController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Find the create-test-order endpoint (might appear more than once due to both discovery paths)
        var endpoint = contracts.Endpoints.FirstOrDefault(e => e.Name == "create-test-order");
        Assert.NotNull(endpoint);
        
        // Verify ContractsBuilder storage has the type mapping
        var storedBuilder = ContractsBuilderStorage.Retrieve(app);
        Assert.NotNull(storedBuilder);
        Assert.True(storedBuilder.EndpointRequestBodyTypes.ContainsKey(endpoint.SchemaRef));
        Assert.Equal(typeof(TestOrderRequest), storedBuilder.EndpointRequestBodyTypes[endpoint.SchemaRef]);

        // Cleanup
        ContractsBuilderStorage.Remove(app);
    }
}
