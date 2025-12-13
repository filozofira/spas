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
    public void ComposeToFile_WritesJsonToFile()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .Build();
        var tempFile = Path.Combine(Path.GetTempPath(), "spas-test.json");

        // Act
        composer.ComposeToFile(tempFile, identity);

        // Assert
        Assert.True(File.Exists(tempFile));
        var content = File.ReadAllText(tempFile);
        Assert.Contains("test-service", content);

        // Cleanup
        File.Delete(tempFile);
    }
}
