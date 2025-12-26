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
            e.MethodPath == "POST /api/orders");

        Assert.Contains(contracts.Endpoints, e =>
            e.Name == "get-order" &&
            e.Type == "Query" &&
            e.Protocol == "Http" &&
            e.MethodPath == "GET /api/orders/{id}");
    }
}
