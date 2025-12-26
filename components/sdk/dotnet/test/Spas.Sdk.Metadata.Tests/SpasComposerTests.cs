using System.Text.Json;
using Xunit;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Builders;

namespace Spas.Sdk.Metadata.Tests;

public class SpasComposerTests
{
    [Fact]
    public void Compose_WithIdentityOnly_GeneratesValidJson()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .Build();

        // Act
        var json = composer.Compose(identity);

        // Assert
        Assert.NotNull(json);
        Assert.Contains("test-service", json);
        Assert.Contains("1.0.0", json);
        Assert.Contains("design-time-metadata-v1", json);
    }

    [Fact]
    public void Compose_WithIdentityAndContracts_IncludesAllSections()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .Build();
        var contracts = new ContractsBuilder()
            .AddEndpoint("CreateOrder", "Command", "Http", "/commands/create-order", "1.0", "schemas/create-order.schema.json")
            .Build();

        // Act
        var json = composer.Compose(identity, contracts);

        // Assert
        Assert.Contains("test-service", json);
        Assert.Contains("CreateOrder", json);
        Assert.Contains("endpoints", json);
    }

    [Fact]
    public void Compose_WithAllBuilders_GeneratesCompleteMetadata()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .WithDescription("Test service")
            .Build();
        var contracts = new ContractsBuilder()
            .AddEndpoint("CreateOrder", "Command", "Http", "/commands/create-order", "1.0", "schemas/create-order.schema.json")
            .AddEndpoint("GetOrder", "Query", "Http", "/queries/get-order", "1.0", "schemas/get-order.schema.json")
            .AddEvent("orders.order-created.v1", "1.0", "schemas/order-created.schema.json")
            .Build();
        var security = new SecurityBuilder()
            .WithAuthenticationType("jwt")
            .AddDataClassification("pii")
            .Build();
        var consistency = new ConsistencyBuilder()
            .WithQueries("EVENTUAL")
            .Build();
        var network = new NetworkBuilder()
            .AddRequiredEgress("api.example.com:443")
            .Build();

        // Act
        var json = composer.Compose(identity, contracts, security, consistency, network, "MIT");

        // Assert
        Assert.Contains("test-service", json);
        Assert.Contains("CreateOrder", json);
        Assert.Contains("GetOrder", json);
        Assert.Contains("orders.order-created.v1", json);
        Assert.Contains("jwt", json);
        Assert.Contains("pii", json);
        Assert.Contains("EVENTUAL", json);
        Assert.Contains("api.example.com:443", json);
    }

    [Fact]
    public void Compose_WithEndpointDescription_IncludesDescription()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .Build();
        var contracts = new ContractsBuilder()
            .AddEndpoint(
                "CreateOrder",
                "Command",
                "Http",
                "/commands/create-order",
                "1.0",
                "schemas/create-order.schema.json",
                description: "Creates an order and reserves inventory")
            .Build();

        // Act
        var json = composer.Compose(identity, contracts);

        // Assert
        using var doc = JsonDocument.Parse(json);
        var endpoint = doc.RootElement.GetProperty("endpoints").EnumerateArray().First();
        Assert.True(endpoint.TryGetProperty("description", out var description));
        Assert.Equal("Creates an order and reserves inventory", description.GetString());
    }

    [Fact]
    public void Compose_WithEmptyEndpointDescription_OmitsDescription()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .Build();
        var contracts = new ContractsBuilder()
            .AddEndpoint(
                "CreateOrder",
                "Command",
                "Http",
                "/commands/create-order",
                "1.0",
                "schemas/create-order.schema.json",
                description: "  ")
            .Build();

        // Act
        var json = composer.Compose(identity, contracts);

        // Assert
        using var doc = JsonDocument.Parse(json);
        var endpoint = doc.RootElement.GetProperty("endpoints").EnumerateArray().First();
        Assert.False(endpoint.TryGetProperty("description", out _));
    }
}
