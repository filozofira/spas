using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Tests;

public class SchemaPathOverrideTests
{
    [Fact]
    public void SpasCommandAttribute_WithExplicitSchema_OverridesAutoGeneration()
    {
        // Arrange & Act
        var attribute = new SpasCommandAttribute("CreateOrder", "1.0")
        {
            Schema = "custom/path/my-schema.json"
        };

        // Assert
        Assert.Equal("custom/path/my-schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasQueryAttribute_WithExplicitSchema_OverridesAutoGeneration()
    {
        // Arrange & Act
        var attribute = new SpasQueryAttribute("GetOrder", "1.0")
        {
            Schema = "custom/query-schema.json"
        };

        // Assert
        Assert.Equal("custom/query-schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasEventAttribute_WithExplicitSchema_OverridesAutoGeneration()
    {
        // Arrange & Act
        var attribute = new SpasEventAttribute("OrderCreated", "1.0")
        {
            Schema = "events/custom/event-schema.json"
        };

        // Assert
        Assert.Equal("events/custom/event-schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasCommandAttribute_DefaultAutoGeneration_UsesKebabCaseConvention()
    {
        // Arrange & Act
        var attribute = new SpasCommandAttribute("CreateOrderRequest", "1.0");

        // Assert
        Assert.Equal("schemas/endpoints/create-order-request.schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasQueryAttribute_DefaultAutoGeneration_UsesKebabCaseConvention()
    {
        // Arrange & Act
        var attribute = new SpasQueryAttribute("GetOrderById", "1.0");

        // Assert
        Assert.Equal("schemas/endpoints/get-order-by-id.schema.json", attribute.Schema);
    }

    [Fact]
    public void SpasEventAttribute_DefaultAutoGeneration_UsesEventsFolder()
    {
        // Arrange & Act
        var attribute = new SpasEventAttribute("OrderStatusChanged", "1.0");

        // Assert
        Assert.Equal("schemas/events/order-status-changed.schema.json", attribute.Schema);
    }
}
