using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Schema;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Tests for SchemaGenerator.
/// 
/// NOTE: After feature 023-endpoint-command-inference, GenerateSchemasFromAssemblyAsync only generates 
/// schemas for types with [SpasEvent]. Command/Query schemas are now generated via endpoint parameter 
/// inference in MetadataArchiveGenerator. The [SpasCommand] and [SpasQuery] attributes can no longer 
/// be applied to classes/structs (only methods/delegates).
/// </summary>
public class SchemaGeneratorTests
{
    [Fact]
    public async Task GenerateSchemasFromAssembly_WithEventAttribute_GeneratesSchema()
    {
        // Arrange
        var generator = new SchemaGenerator();
        var assembly = typeof(TestEventForSchema).Assembly;

        // Act
        var schemas = await generator.GenerateSchemasFromAssemblyAsync(assembly);

        // Assert
        Assert.Contains("schemas/events/test-event.schema.json", schemas.Keys);
        var schema = schemas["schemas/events/test-event.schema.json"] as string;
        Assert.NotNull(schema);
        Assert.Contains("\"type\":", schema);
        // Schemas use camelCase to match runtime JSON serialization
        Assert.Contains("\"eventId\":", schema);
        Assert.Contains("\"timestamp\":", schema);
    }

    [Fact]
    public async Task GenerateSchemasFromAssembly_OnlyGeneratesEventSchemas()
    {
        // Arrange - after 023-endpoint-command-inference, only events are scanned from assembly
        var generator = new SchemaGenerator();
        var assembly = typeof(TestEventForSchema).Assembly;

        // Act
        var schemas = await generator.GenerateSchemasFromAssemblyAsync(assembly);

        // Assert - should only contain event schemas (events/ or custom paths)
        // Events can have custom schema paths that don't follow the events/ pattern
        Assert.All(schemas.Keys, key => Assert.EndsWith(".schema.json", key));
        Assert.True(schemas.Count > 0, "Should generate at least one event schema");
    }

    [Fact]
    public async Task GenerateSchemaAsync_ForAnyType_GeneratesValidSchema()
    {
        // Arrange - GenerateSchemaAsync can generate schema for any type, even without attributes
        var generator = new SchemaGenerator();

        // Act
        var schema = await generator.GenerateSchemaAsync(typeof(PlainDtoForSchemaTest)) as string;

        // Assert
        Assert.NotNull(schema);
        Assert.Contains("\"$schema\":", schema);
        Assert.Contains("\"type\":", schema);
        Assert.Contains("\"properties\":", schema);
        // Schemas use camelCase to match runtime JSON serialization
        Assert.Contains("\"orderId\":", schema);
        Assert.Contains("\"amount\":", schema);
    }

    [Fact]
    public async Task GenerateSchemaAsync_HandlesNestedComplexTypes()
    {
        // Arrange - Test nested types are included in schema
        var generator = new SchemaGenerator();

        // Act
        var schema = await generator.GenerateSchemaAsync(typeof(NestedOrderRequest)) as string;

        // Assert - should include nested types
        Assert.NotNull(schema);
        Assert.Contains("\"customer\":", schema);
        Assert.Contains("\"items\":", schema);
    }
}

// Test types for schema generation unit tests
// These are plain DTOs - no SPAS attributes needed for command/query types
public record PlainDtoForSchemaTest(string OrderId, decimal Amount);

// Test types for nested schema generation
public record NestedOrderRequest(CustomerInfo Customer, List<OrderItemInfo> Items, decimal Total);
public record CustomerInfo(string CustomerId, string Name, string Email);
public record OrderItemInfo(string ProductId, int Quantity, decimal UnitPrice);

// Event type - still requires [SpasEvent] attribute
[SpasEvent("TestEvent", "1.0", EventType = "com.test.event")]
public record TestEventForSchema(Guid EventId, DateTime Timestamp, string Message);
