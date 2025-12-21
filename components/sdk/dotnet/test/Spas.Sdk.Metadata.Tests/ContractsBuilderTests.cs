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
        Assert.Empty(contracts.Endpoints);
        Assert.Empty(contracts.Events);
    }

    [Fact]
    public void AddEndpoint_AddsEndpointToContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddEndpoint("CreateOrder", "Command", "Http", "/commands/create-order", "1.0", "schemas/create-order.schema.json");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Endpoints);
        Assert.Equal("CreateOrder", contracts.Endpoints[0].Name);
        Assert.Equal("Command", contracts.Endpoints[0].Type);
        Assert.Equal("Http", contracts.Endpoints[0].Protocol);
        Assert.Equal("/commands/create-order", contracts.Endpoints[0].MethodPath);
        Assert.Equal("1.0", contracts.Endpoints[0].Version);
        Assert.Equal("schemas/create-order.schema.json", contracts.Endpoints[0].SchemaRef);
    }

    [Fact]
    public void AddEndpoint_Query_AddsQueryToContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddEndpoint("GetOrder", "Query", "Http", "/queries/get-order", "1.0", "schemas/get-order.schema.json");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Endpoints);
        Assert.Equal("GetOrder", contracts.Endpoints[0].Name);
        Assert.Equal("Query", contracts.Endpoints[0].Type);
    }

    [Fact]
    public void AddEvent_AddsEventToContracts()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddEvent("orders.order-created.v1", "1.0", "schemas/order-created.schema.json");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Events);
        Assert.Equal("orders.order-created.v1", contracts.Events[0].Type);
        Assert.Equal("1.0", contracts.Events[0].Version);
        Assert.Equal("schemas/order-created.schema.json", contracts.Events[0].SchemaRef);
    }

    [Fact]
    public void AddEvent_WithDescription_PropagatesDescription()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddEvent("orders.order-created.v1", "1.0", "schemas/order-created.schema.json", description: "Emitted when an order is created");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Events);
        Assert.Equal("Emitted when an order is created", contracts.Events[0].Description);
    }

    [Fact]
    public void AddEvent_WithEmptyDescription_OmitsDescription()
    {
        // Arrange
        var builder = new ContractsBuilder();

        // Act
        builder.AddEvent("orders.order-created.v1", "1.0", "schemas/order-created.schema.json", description: " ");
        var contracts = builder.Build();

        // Assert
        Assert.Single(contracts.Events);
        Assert.Null(contracts.Events[0].Description);
    }

    [Fact]
    public void Build_WithMultipleContracts_ReturnsAllContracts()
    {
        // Arrange
        var builder = new ContractsBuilder()
            .AddEndpoint("CreateOrder", "Command", "Http", "/commands/create-order", "1.0", "schemas/create-order.schema.json")
            .AddEndpoint("GetOrder", "Query", "Http", "/queries/get-order", "1.0", "schemas/get-order.schema.json")
            .AddEvent("orders.order-created.v1", "1.0", "schemas/order-created.schema.json");

        // Act
        var contracts = builder.Build();

        // Assert
        Assert.Equal(2, contracts.Endpoints.Count);
        Assert.Single(contracts.Events);
    }
}
