using Microsoft.Extensions.Configuration;
using Spas.Sdk.Core.Configuration;

namespace Spas.Sdk.Core.Tests.Configuration;

/// <summary>
/// Tests for SpasConfiguration extension methods.
/// </summary>
public class SpasConfigurationTests
{
    #region User Story 1: Auto-Derived Sidecar Connection

    [Fact]
    public void GetSpasSidecarUrl_WithServiceName_DerivesSidecarHost()
    {
        // Arrange: No SIDECAR_HOST or SIDECAR_URL set
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl(serviceName: "order-service");

        // Assert: Should derive from service name
        Assert.Equal("http://order-service-sidecar:7000", result);
    }

    [Theory]
    [InlineData("Order_Service", "http://order-service-sidecar:7000")]
    [InlineData("My Service", "http://my-service-sidecar:7000")]
    [InlineData("INVENTORY-SERVICE", "http://inventory-service-sidecar:7000")]
    [InlineData("api", "http://api-sidecar:7000")]
    [InlineData("Product__Service", "http://product-service-sidecar:7000")]
    [InlineData("  spaced  ", "http://spaced-sidecar:7000")]
    public void GetSpasSidecarUrl_NormalizesServiceName_ForDns(string serviceName, string expectedUrl)
    {
        // Arrange: No SIDECAR_HOST or SIDECAR_URL set
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl(serviceName: serviceName);

        // Assert: Should normalize service name for DNS compatibility
        Assert.Equal(expectedUrl, result);
    }

    #endregion

    #region User Story 2: Explicit Override

    [Fact]
    public void GetSpasSidecarUrl_WithSidecarUrl_IgnoresDerivation()
    {
        // Arrange: SIDECAR_URL set explicitly
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SIDECAR_URL"] = "http://custom-sidecar:8080"
            })
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl(serviceName: "order-service");

        // Assert: Explicit SIDECAR_URL takes precedence
        Assert.Equal("http://custom-sidecar:8080", result);
    }

    [Fact]
    public void GetSpasSidecarUrl_WithSidecarHost_IgnoresServiceName()
    {
        // Arrange: SIDECAR_HOST set explicitly
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SIDECAR_HOST"] = "custom-sidecar"
            })
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl(serviceName: "order-service");

        // Assert: Explicit SIDECAR_HOST takes precedence over derivation
        Assert.Equal("http://custom-sidecar:7000", result);
    }

    [Fact]
    public void GetSpasSidecarUrl_WithSidecarHostAndPort_UsesExplicitPort()
    {
        // Arrange: SIDECAR_HOST and SIDECAR_PORT set explicitly
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SIDECAR_HOST"] = "custom-sidecar",
                ["SIDECAR_PORT"] = "9000"
            })
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl(serviceName: "order-service");

        // Assert: Explicit values take precedence
        Assert.Equal("http://custom-sidecar:9000", result);
    }

    #endregion

    #region User Story 3: Local Development Fallback

    [Fact]
    public void GetSpasSidecarUrl_NoConfig_FallsBackToLocalhost7000()
    {
        // Arrange: No configuration set at all
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl();

        // Assert: Should fall back to localhost:7000
        Assert.Equal("http://localhost:7000", result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void GetSpasSidecarUrl_EmptyServiceName_FallsBackToLocalhost(string? serviceName)
    {
        // Arrange: No SIDECAR_HOST or SIDECAR_URL set
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        // Act
        var result = configuration.GetSpasSidecarUrl(serviceName: serviceName);

        // Assert: Should fall back to localhost when service name is empty
        Assert.Equal("http://localhost:7000", result);
    }

    #endregion
}
