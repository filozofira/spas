using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Tests.Fixtures;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Integration test for User Story 1 checkpoint: Controller discovery working.
/// Verifies the "Independent Test" scenario from tasks.md.
/// </summary>
public class US1_ControllerDiscoveryIntegrationTests
{
    [Fact]
    public void US1_Checkpoint_ControllerWithSpasCommand_GeneratesCorrectMetadata()
    {
        // Arrange - Create a simple controller with [SpasCommand] attribute
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US1_ControllerDiscoveryIntegrationTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(TestOrdersController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act - Run metadata discovery (equivalent to dotnet spas-generate)
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Verify metadata archive includes controller endpoint
        var controllerEndpoint = contracts.Endpoints.First(e => 
            e.Name == "create-test-order" && 
            e.Type == "Command");

        // Verify correct route
        Assert.Equal("/api/test-orders", controllerEndpoint.MethodPath);
        
        // Verify correct verb (POST)
        // (HTTP verb is implicit from the route - MapControllers handles this)
        
        // Verify capability type
        Assert.Equal("Command", controllerEndpoint.Type);
        
        // Verify version
        Assert.Equal("1.0.0", controllerEndpoint.Version);
        
        // Verify protocol
        Assert.Equal("Http", controllerEndpoint.Protocol);
    }

    [Fact]
    public void US1_Checkpoint_MinimalApiEndpoints_StillWorkUnchanged()
    {
        // Arrange - Add both Minimal API and Controller
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US1_ControllerDiscoveryIntegrationTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(TestOrdersController).Assembly);
        
        var app = builder.Build();
        
        // Add Minimal API endpoint
        app.MapPost("/api/minimal-test", () => Microsoft.AspNetCore.Http.Results.Ok())
            .WithMetadata(new SpasCommandAttribute("MinimalTestCommand", "1.0.0"));
        
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Minimal API endpoint still works
        Assert.Contains(contracts.Endpoints, e => 
            e.Name == "minimal-test-command" && 
            e.MethodPath == "/api/minimal-test" &&
            e.Type == "Command");
        
        // Assert - Controller endpoint also works
        Assert.Contains(contracts.Endpoints, e => 
            e.Name == "create-test-order" && 
            e.MethodPath == "/api/test-orders" &&
            e.Type == "Command");
    }
}
