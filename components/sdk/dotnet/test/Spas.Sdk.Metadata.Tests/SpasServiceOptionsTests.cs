using Spas.Sdk.Metadata.Configuration;

namespace Spas.Sdk.Metadata.Tests;

public class SpasServiceOptionsTests
{
    [Fact]
    public void ServiceId_CanBeSet()
    {
        var options = new SpasServiceOptions
        {
            ServiceId = "test-service"
        };

        Assert.Equal("test-service", options.ServiceId);
    }

    [Fact]
    public void ServiceName_CanBeSet()
    {
        var options = new SpasServiceOptions
        {
            ServiceName = "Test Service"
        };

        Assert.Equal("Test Service", options.ServiceName);
    }

    [Fact]
    public void Version_CanBeSet()
    {
        var options = new SpasServiceOptions
        {
            Version = "1.2.3"
        };

        Assert.Equal("1.2.3", options.Version);
    }

    [Fact]
    public void BoundedContext_CanBeSet()
    {
        var options = new SpasServiceOptions
        {
            BoundedContext = "Orders"
        };

        Assert.Equal("Orders", options.BoundedContext);
    }

    [Fact]
    public void Description_CanBeSet()
    {
        var options = new SpasServiceOptions
        {
            Description = "Test description"
        };

        Assert.Equal("Test description", options.Description);
    }

    [Fact]
    public void Description_IsNullByDefault()
    {
        var options = new SpasServiceOptions();

        Assert.Null(options.Description);
    }

    [Fact]
    public void Capabilities_IsEmptyByDefault()
    {
        var options = new SpasServiceOptions();

        Assert.Empty(options.Capabilities);
    }

    [Fact]
    public void AddCapability_AddsToCollection()
    {
        var options = new SpasServiceOptions();

        options.AddCapability("order-management");

        Assert.Single(options.Capabilities);
        Assert.Contains("order-management", options.Capabilities);
    }

    [Fact]
    public void AddCapability_ReturnsInstance_ForChaining()
    {
        var options = new SpasServiceOptions();

        var result = options.AddCapability("capability-1");

        Assert.Same(options, result);
    }

    [Fact]
    public void AddCapability_CanBeChained()
    {
        var options = new SpasServiceOptions();

        options
            .AddCapability("capability-1")
            .AddCapability("capability-2")
            .AddCapability("capability-3");

        Assert.Equal(3, options.Capabilities.Count);
        Assert.Contains("capability-1", options.Capabilities);
        Assert.Contains("capability-2", options.Capabilities);
        Assert.Contains("capability-3", options.Capabilities);
    }

    [Fact]
    public void Capabilities_CanBeAccessedDirectly()
    {
        var options = new SpasServiceOptions();

        options.Capabilities.Add("direct-capability");

        Assert.Single(options.Capabilities);
        Assert.Contains("direct-capability", options.Capabilities);
    }

    [Fact]
    public void PropertiesInitializedToEmptyStrings()
    {
        var options = new SpasServiceOptions();

        Assert.Equal(string.Empty, options.ServiceId);
        Assert.Equal(string.Empty, options.ServiceName);
        Assert.Equal(string.Empty, options.Version);
        Assert.Equal(string.Empty, options.BoundedContext);
    }

    [Fact]
    public void AllProperties_CanBeSetViaInitializer()
    {
        var options = new SpasServiceOptions
        {
            ServiceId = "order-service",
            ServiceName = "Order Service",
            Version = "2.0.0",
            BoundedContext = "Orders",
            Description = "Manages orders"
        };

        Assert.Equal("order-service", options.ServiceId);
        Assert.Equal("Order Service", options.ServiceName);
        Assert.Equal("2.0.0", options.Version);
        Assert.Equal("Orders", options.BoundedContext);
        Assert.Equal("Manages orders", options.Description);
    }
}
