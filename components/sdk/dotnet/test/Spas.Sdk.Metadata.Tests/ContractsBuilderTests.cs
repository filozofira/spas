using Xunit;
using Spas.Sdk.Metadata.Builders;

namespace Spas.Sdk.Metadata.Tests;

public class ContractsBuilderTests
{
    [Fact]
    public void Build_WithNoContracts_ReturnsEmptyContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        var contracts = builder.Build();

        // Assert
        Assert.NotNull(contracts);
        Assert.Empty(contracts.Commands);
        Assert.Empty(contracts.Queries);
        Assert.Empty(contracts.Events);
    }

    [Fact]
    public void AddCommand_AddsCommandToContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddCommand("CreateOrder", "1.0", "/commands/create-order", "schemas/create-order.schema.json");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Commands);
        Assert.Equal("CreateOrder", contracts.Commands[0].Name);
        Assert.Equal("1.0", contracts.Commands[0].Version);
        Assert.Equal("/commands/create-order", contracts.Commands[0].Path);
        Assert.Equal("schemas/create-order.schema.json", contracts.Commands[0].Schema);
    }

    [Fact]
    public void AddQuery_AddsQueryToContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddQuery("GetOrder", "1.0", "/queries/get-order", "schemas/get-order.schema.json");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Queries);
        Assert.Equal("GetOrder", contracts.Queries[0].Name);
        Assert.Equal("1.0", contracts.Queries[0].Version);
    }

    [Fact]
    public void AddEvent_AddsEventToContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddEvent("OrderCreated", "1.0", "schemas/order-created.schema.json");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Events);
        Assert.Equal("OrderCreated", contracts.Events[0].Name);
        Assert.Equal("1.0", contracts.Events[0].Version);
        Assert.Equal("schemas/order-created.schema.json", contracts.Events[0].Schema);
    }

    [Fact]
    public void Build_WithMultipleContracts_ReturnsAllContracts()
    {
        // Arrange
        var builder = new ContractsBuilder()
            .AddCommand("CreateOrder", "1.0", "/commands/create-order", "schemas/create-order.schema.json")
            .AddQuery("GetOrder", "1.0", "/queries/get-order", "schemas/get-order.schema.json")
            .AddEvent("OrderCreated", "1.0", "schemas/order-created.schema.json");

        // Act
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Commands);
        Assert.Single(contracts.Queries);
        Assert.Single(contracts.Events);
    }
}
