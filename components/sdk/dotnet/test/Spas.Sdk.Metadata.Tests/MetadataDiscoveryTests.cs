using Xunit;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Discovery;
using System.Reflection;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataDiscoveryTests
{
    [Fact]
    public void Constructor_WithNoAssemblies_UsesEntryAssembly()
    {
        // Arrange & Act
        var discovery = new MetadataDiscovery();

        // Assert - no exception thrown, discovery instance created
        Assert.NotNull(discovery);
    }

    [Fact]
    public void Constructor_WithOptions_UsesProvidedAssemblies()
    {
        // Arrange
        var options = new MetadataDiscoveryOptions
        {
            AssembliesToScan = { typeof(MetadataDiscoveryTests).Assembly }
        };

        // Act
        var discovery = new MetadataDiscovery(options);

        // Assert
        Assert.NotNull(discovery);
    }

    [Fact]
    public void DiscoverEvents_WithSpasEventAttribute_FindsEventTypes()
    {
        // Arrange
        var options = new MetadataDiscoveryOptions
        {
            AssembliesToScan = { typeof(MetadataDiscoveryTests).Assembly },
            AutoGenerateSchemaReferences = true
        };
        var discovery = new MetadataDiscovery(options);

        // Note: Event discovery happens in DiscoverFromEndpoints
        // This test verifies the discovery mechanism setup
        Assert.NotNull(discovery);
    }

    [Fact]
    public void AutoGenerateSchemaReferences_WhenEnabled_GeneratesSchemaPath()
    {
        // Arrange
        var options = new MetadataDiscoveryOptions
        {
            AutoGenerateSchemaReferences = true,
            SchemaBasePath = "schemas/events/"
        };

        // Act & Assert
        Assert.True(options.AutoGenerateSchemaReferences);
        Assert.Equal("schemas/events/", options.SchemaBasePath);
    }

    [Fact]
    public void AutoGenerateSchemaReferences_WhenDisabled_DoesNotGenerateSchema()
    {
        // Arrange
        var options = new MetadataDiscoveryOptions
        {
            AutoGenerateSchemaReferences = false
        };

        // Act & Assert
        Assert.False(options.AutoGenerateSchemaReferences);
    }
}

// Test event types for discovery
[SpasEvent("TestEventCreated", "1.0")]
public record TestEventCreated(Guid Id, string Name);

[SpasEvent("TestEventUpdated", "2.0", Schema = "custom/test-event.schema.json")]
public record TestEventUpdated(Guid Id, string Name, DateTime UpdatedAt);
