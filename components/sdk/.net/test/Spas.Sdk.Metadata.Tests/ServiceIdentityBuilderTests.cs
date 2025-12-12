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
            .WithName("order-service")
            .WithVersion("1.0.0")
            .WithDescription("Order processing service");

        // Act
        var identity = builder.Build();

        // Assert
        Assert.NotNull(identity);
        Assert.Equal("order-service", identity.Name);
        Assert.Equal("1.0.0", identity.Version);
        Assert.Equal("Order processing service", identity.Description);
    }

    [Fact]
    public void Build_WithoutName_ThrowsException()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithVersion("1.0.0");

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
    public void Build_WithOwner_IncludesOwner()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithName("order-service")
            .WithVersion("1.0.0")
            .WithOwner("platform-team");

        // Act
        var identity = builder.Build();

        // Assert
        Assert.Equal("platform-team", identity.Owner);
    }

    [Fact]
    public void Build_WithRepository_IncludesRepository()
    {
        // Arrange
        var builder = new ServiceIdentityBuilder()
            .WithName("order-service")
            .WithVersion("1.0.0")
            .WithRepository("https://github.com/org/order-service");

        // Act
        var identity = builder.Build();

        // Assert
        Assert.Equal("https://github.com/org/order-service", identity.Repository);
    }
}
