using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Integration tests for User Story 2: Mixed Routing Support.
/// Validates services can use both Minimal API and Controllers together without conflicts.
/// </summary>
public class US2_MixedRoutingIntegrationTests
{
    [Fact]
    public void US2_Checkpoint_BothMinimalApiAndController_IncludedInMetadata()
    {
        // Arrange - Service with BOTH Minimal API and Controller
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        
        var app = builder.Build();
        
        // Minimal API endpoints
        app.MapPost("/api/minimal/orders", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateMinimalOrder", "1.0.0"));
        
        app.MapGet("/api/minimal/orders/{id}", (string id) => Results.Ok())
            .WithMetadata(new SpasQueryAttribute("GetMinimalOrder", "1.0.0"));
        
        // Controller endpoints
        app.MapControllers();

        // Act - Run metadata discovery
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Verify both Minimal API endpoints are included
        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "create-minimal-order" &&
            e.MethodPath == "/api/minimal/orders" &&
            e.Type == "Command");
        
        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "get-minimal-order" &&
            e.MethodPath == "/api/minimal/orders/{id}" &&
            e.Type == "Query");
        
        // Assert - Verify controller endpoints are included
        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "create-mixed-product" &&
            e.MethodPath == "/api/mixed/products" &&
            e.Type == "Command");
        
        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "get-mixed-product" &&
            e.MethodPath == "/api/mixed/products/{id}" &&
            e.Type == "Query");
    }

    [Fact]
    public void US2_Checkpoint_RouteResolution_NoTokenConflicts()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        
        var app = builder.Build();
        app.MapGet("/api/minimal/{id}", (string id) => Results.Ok())
            .WithMetadata(new SpasQueryAttribute("MinimalWithParam", "1.0.0"));
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Minimal API route parameters preserved
        var minimalEndpoint = contracts.Endpoints.First(e => e.Name == "minimal-with-param");
        Assert.Equal("/api/minimal/{id}", minimalEndpoint.MethodPath);
        
        // Assert - Controller route parameters preserved (no [controller] token conflicts)
        var controllerEndpoint = contracts.Endpoints.First(e => e.Name == "get-mixed-product");
        Assert.Equal("/api/mixed/products/{id}", controllerEndpoint.MethodPath);
        Assert.DoesNotContain("[controller]", controllerEndpoint.MethodPath);
        Assert.DoesNotContain("[action]", controllerEndpoint.MethodPath);
    }

    [Fact]
    public void US2_Checkpoint_ProperBaseRoutes_NoLeadingSlashIssues()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        
        var app = builder.Build();
        app.MapPost("api/no-slash", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("NoSlashCommand", "1.0.0"));
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - All routes normalized with leading slash
        foreach (var endpoint in contracts.Endpoints)
        {
            Assert.StartsWith("/", endpoint.MethodPath);
            Assert.DoesNotContain("//", endpoint.MethodPath); // No double slashes
        }
    }

    [Fact]
    public void US2_RegressionTest_MinimalApiPreserved_AfterAddingControllers()
    {
        // Arrange - Minimal API only scenario
        var builderMinimalOnly = WebApplication.CreateBuilder();
        builderMinimalOnly.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        });
        
        var appMinimalOnly = builderMinimalOnly.Build();
        appMinimalOnly.MapPost("/api/original", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("OriginalCommand", "1.0.0"));

        var contractsMinimalOnly = appMinimalOnly.DiscoverSpasMetadata();

        // Arrange - Minimal API + Controllers scenario
        var builderMixed = WebApplication.CreateBuilder();
        builderMixed.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        });
        builderMixed.Services.AddControllers()
            .AddApplicationPart(typeof(US2_MixedRoutingIntegrationTests).Assembly);
        
        var appMixed = builderMixed.Build();
        appMixed.MapPost("/api/original", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("OriginalCommand", "1.0.0"));
        appMixed.MapControllers();

        var contractsMixed = appMixed.DiscoverSpasMetadata();

        // Assert - Original Minimal API endpoint still discovered correctly in mixed scenario
        var originalMinimalOnly = contractsMinimalOnly.Endpoints.First(e => e.Name == "original-command");
        var originalMixed = contractsMixed.Endpoints.First(e => e.Name == "original-command");
        
        Assert.Equal(originalMinimalOnly.MethodPath, originalMixed.MethodPath);
        Assert.Equal(originalMinimalOnly.Type, originalMixed.Type);
        Assert.Equal(originalMinimalOnly.Version, originalMixed.Version);
    }
}

/// <summary>
/// Test fixture controller for mixed routing tests (T013).
/// </summary>
[Route("api/mixed/products")]
[ApiController]
public class MixedProductsController : ControllerBase
{
    [HttpPost]
    [SpasCommand("CreateMixedProduct", "1.0.0")]
    public IActionResult Create([FromBody] MixedProductRequest request)
    {
        return Ok();
    }

    [HttpGet("{id}")]
    [SpasQuery("GetMixedProduct", "1.0.0")]
    public IActionResult Get(string id)
    {
        return Ok();
    }
}

public record MixedProductRequest(string Name, decimal Price);
