using Xunit;
using Spas.Sdk.Metadata.Builders;

namespace Spas.Sdk.Metadata.Tests;

public class ServiceIdentityBuilderTests
{
    [Fact]
    public void Build_WithValidData_ReturnsServiceIdentity()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithId("order-service")
            .WithName("order-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("orders")
            .WithDescription("Order processing service");

        // Act
        var identity = builder.Build();

        // Assert
        Assert.NotNull(identity);
        Assert.Equal("order-service", identity.Id);
        Assert.Equal("order-service", identity.Name);
        Assert.Equal("1.0.0", identity.Version);
        Assert.Equal("orders", identity.BoundedContext);
        Assert.Equal("Order processing service", identity.Description);
    }

    [Fact]
    public void Build_WithoutName_ThrowsException()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => builder.Build());
    }

    [Fact]
    public void Build_WithoutVersion_ThrowsException()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithName("order-service");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => builder.Build());
    }

    [Fact]
    public void Build_WithCapabilities_IncludesCapabilities()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithId("order-service")
            .WithName("order-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("orders")
            .AddCapability("create-order")
            .AddCapability("query-order");

        // Act
        var identity = builder.Build();

        // Assert
        Assert.Equal(2, identity.Capabilities.Count);
        Assert.Contains("create-order", identity.Capabilities);
        Assert.Contains("query-order", identity.Capabilities);
    }

    [Fact]
    public void Build_WithBoundedContext_IncludesBoundedContext()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithId("order-service")
            .WithName("order-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("orders");

        // Act
        var identity = builder.Build();

        // Assert
        Assert.Equal("orders", identity.BoundedContext);
    }
}
