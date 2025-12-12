using Xunit;
using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Tests;

public class SpasContractAttributesTests
{
    [Fact]
    public void SpasCommandAttribute_Constructor_SetsNameAndVersion()
    {
        // Arrange & Act
        var attribute = new SpasCommandAttribute("CreateOrder", "1.0");

        // Assert
        Assert.Equal("CreateOrder", attribute.Name);
        Assert.Equal("1.0", attribute.Version);
        Assert.Null(attribute.Schema);
        Assert.Null(attribute.Path);
    }

    [Fact]
    public void SpasCommandAttribute_WithSchema_SetsSchemaProperty()
    {
        // Arrange & Act
        var attribute = new SpasCommandAttribute("CreateOrder", "1.0")
        {
            Schema = "schemas/create-order.schema.json"
        };

        // Assert
        Assert.Equal("schemas/create-order.schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasCommandAttribute_WithPath_SetsPathProperty()
    {
        // Arrange & Act
        var attribute = new SpasCommandAttribute("CreateOrder", "1.0")
        {
            Path = "/api/commands/create-order"
        };

        // Assert
        Assert.Equal("/api/commands/create-order", attribute.Path);
    }

    [Fact]
    public void SpasQueryAttribute_Constructor_SetsNameAndVersion()
    {
        // Arrange & Act
        var attribute = new SpasQueryAttribute("GetOrder", "1.0");

        // Assert
        Assert.Equal("GetOrder", attribute.Name);
        Assert.Equal("1.0", attribute.Version);
        Assert.Null(attribute.Schema);
        Assert.Null(attribute.Path);
    }

    [Fact]
    public void SpasQueryAttribute_WithSchema_SetsSchemaProperty()
    {
        // Arrange & Act
        var attribute = new SpasQueryAttribute("GetOrder", "1.0")
        {
            Schema = "schemas/get-order.schema.json"
        };

        // Assert
        Assert.Equal("schemas/get-order.schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasEventAttribute_Constructor_SetsNameAndVersion()
    {
        // Arrange & Act
        var attribute = new SpasEventAttribute("OrderCreated", "1.0");

        // Assert
        Assert.Equal("OrderCreated", attribute.Name);
        Assert.Equal("1.0", attribute.Version);
        Assert.Null(attribute.Schema);
    }

    [Fact]
    public void SpasEventAttribute_WithSchema_SetsSchemaProperty()
    {
        // Arrange & Act
        var attribute = new SpasEventAttribute("OrderCreated", "1.0")
        {
            Schema = "schemas/order-created.schema.json"
        };

        // Assert
        Assert.Equal("schemas/order-created.schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasCommandAttribute_AllowsMultipleFalse()
    {
        // Arrange
        var attributeUsage = typeof(SpasCommandAttribute)
            .GetCustomAttributes(typeof(AttributeUsageAttribute), false)
            .Cast<AttributeUsageAttribute>()
            .FirstOrDefault();

        // Assert
        Assert.NotNull(attributeUsage);
        Assert.False(attributeUsage.AllowMultiple);
    }

    [Fact]
    public void SpasEventAttribute_CanBeAppliedToClasses()
    {
        // Arrange
        var attributeUsage = typeof(SpasEventAttribute)
            .GetCustomAttributes(typeof(AttributeUsageAttribute), false)
            .Cast<AttributeUsageAttribute>()
            .FirstOrDefault();

        // Assert
        Assert.NotNull(attributeUsage);
        Assert.True((attributeUsage.ValidOn & AttributeTargets.Class) == AttributeTargets.Class);
    }
}
