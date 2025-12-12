using Spas.Sdk.Metadata.Dev;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataEndpointOptionsTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithDefaults()
    {
        // Arrange & Act
        var options = new MetadataEndpointOptions();

        // Assert
        Assert.True(options.Enabled);
        Assert.Equal("/_spas/metadata", options.Path);
        Assert.Equal("Development", options.AllowedEnvironment);
    }

    [Fact]
    public void Enabled_CanBeSetToFalse()
    {
        // Arrange
        var options = new MetadataEndpointOptions { Enabled = false };

        // Assert
        Assert.False(options.Enabled);
    }

    [Fact]
    public void Path_CanBeCustomized()
    {
        // Arrange
        var customPath = "/custom/metadata";
        var options = new MetadataEndpointOptions { Path = customPath };

        // Assert
        Assert.Equal(customPath, options.Path);
    }

    [Fact]
    public void AllowedEnvironment_CanBeCustomized()
    {
        // Arrange
        var customEnv = "Staging";
        var options = new MetadataEndpointOptions { AllowedEnvironment = customEnv };

        // Assert
        Assert.Equal(customEnv, options.AllowedEnvironment);
    }

    [Theory]
    [InlineData("Development", "Development", true)]
    [InlineData("Development", "Production", false)]
    [InlineData("Staging", "Staging", true)]
    [InlineData("Staging", "Production", false)]
    public void IsEnvironmentAllowed_ShouldMatchEnvironmentName(
        string allowedEnv,
        string currentEnv,
        bool expected)
    {
        // Arrange
        var options = new MetadataEndpointOptions { AllowedEnvironment = allowedEnv };

        // Act
        var result = options.IsEnvironmentAllowed(currentEnv);

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void IsEnvironmentAllowed_ShouldBeCaseInsensitive()
    {
        // Arrange
        var options = new MetadataEndpointOptions { AllowedEnvironment = "Development" };

        // Act
        var result = options.IsEnvironmentAllowed("development");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsEnvironmentAllowed_ShouldReturnFalse_WhenDisabled()
    {
        // Arrange
        var options = new MetadataEndpointOptions 
        { 
            Enabled = false,
            AllowedEnvironment = "Development"
        };

        // Act
        var result = options.IsEnvironmentAllowed("Development");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Path_ShouldNotBeNullOrEmpty()
    {
        // Arrange
        var options = new MetadataEndpointOptions();

        // Assert
        Assert.False(string.IsNullOrEmpty(options.Path));
        Assert.StartsWith("/", options.Path);
    }
}
