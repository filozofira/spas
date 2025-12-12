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
            .WithName("test-service")
            .WithVersion("1.0.0")
            .Build();

        // Act
        var json = composer.Compose(identity);

        // Assert
        Assert.NotNull(json);
        Assert.Contains("test-service", json);
        Assert.Contains("1.0.0", json);
    }

    [Fact]
    public void Compose_WithIdentityAndContracts_IncludesAllSections()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithName("test-service")
            .WithVersion("1.0.0")
            .Build();
        var contracts = new ContractsBuilder()
            .AddCommand("CreateOrder", "1.0", "/commands/create-order", "schemas/create-order.schema.json")
            .Build();

        // Act
        var json = composer.Compose(identity, contracts);

        // Assert
        Assert.Contains("test-service", json);
        Assert.Contains("CreateOrder", json);
        Assert.Contains("commands", json);
    }

    [Fact]
    public void Compose_WithAllBuilders_GeneratesCompleteMetadata()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithDescription("Test service")
            .Build();
        var contracts = new ContractsBuilder()
            .AddCommand("CreateOrder", "1.0", "/commands/create-order", "schemas/create-order.schema.json")
            .AddQuery("GetOrder", "1.0", "/queries/get-order", "schemas/get-order.schema.json")
            .AddEvent("OrderCreated", "1.0", "schemas/order-created.schema.json")
            .Build();
        var security = new SecurityBuilder()
            .WithAuthentication("jwt")
            .Build();
        var health = new HealthBuilder()
            .WithHealthEndpoint("/health")
            .Build();

        // Act
        var json = composer.Compose(identity, contracts, security, health);

        // Assert
        Assert.Contains("test-service", json);
        Assert.Contains("CreateOrder", json);
        Assert.Contains("GetOrder", json);
        Assert.Contains("OrderCreated", json);
        Assert.Contains("jwt", json);
        Assert.Contains("/health", json);
    }

    [Fact]
    public void ComposeToFile_WritesJsonToFile()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithName("test-service")
            .WithVersion("1.0.0")
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
