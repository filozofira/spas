using Spas.Sdk.Metadata.Dev;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataArchiveWriterSerializationTests
{
    [Fact]
    public async Task CreateArchiveAsync_WithStringSchema_DoesNotDoubleSerialize()
    {
        // Arrange
        var writer = new MetadataArchiveWriter();
        var jsonSchema = "{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}}}";
        var schemas = new Dictionary<string, object>
        {
            ["schemas/test.schema.json"] = jsonSchema
        };
        var metadata = new { schemaVersion = "v1", name = "test" };

        // Act
        var archive = await writer.CreateArchiveAsync(metadata, schemas);

        // Assert
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read);
        var schemaEntry = zipArchive.GetEntry("schemas/test.schema.json");
        Assert.NotNull(schemaEntry);

        using var stream = schemaEntry.Open();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync();

        // Verify it's valid JSON (not double-serialized string)
        Assert.StartsWith("{", content);
        Assert.EndsWith("}", content.TrimEnd());
        Assert.DoesNotContain("\\\"", content); // Should not have escaped quotes
        
        // Verify it's the same JSON
        var parsed = JsonDocument.Parse(content);
        Assert.Equal("object", parsed.RootElement.GetProperty("type").GetString());
    }

    [Fact]
    public async Task CreateArchiveAsync_WithObjectMetadata_SerializesCorrectly()
    {
        // Arrange
        var writer = new MetadataArchiveWriter();
        var metadata = new
        {
            schemaVersion = "design-time-metadata-v1",
            name = "test-service",
            version = "1.0.0"
        };
        var schemas = new Dictionary<string, object>();

        // Act
        var archive = await writer.CreateArchiveAsync(metadata, schemas);

        // Assert
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read);
        var metadataEntry = zipArchive.GetEntry("spas.json");
        Assert.NotNull(metadataEntry);

        using var stream = metadataEntry.Open();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync();

        var parsed = JsonDocument.Parse(content);
        Assert.Equal("design-time-metadata-v1", parsed.RootElement.GetProperty("schemaVersion").GetString());
        Assert.Equal("test-service", parsed.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task CreateArchiveAsync_WithMixedContent_HandlesEachTypeCorrectly()
    {
        // Arrange
        var writer = new MetadataArchiveWriter();
        var jsonString = "{\"$schema\":\"http://json-schema.org/draft-04/schema#\"}";
        var schemas = new Dictionary<string, object>
        {
            ["schemas/string-schema.json"] = jsonString, // Already JSON string
            ["schemas/object-schema.json"] = new { type = "object" } // Object to serialize
        };
        var metadata = new { name = "mixed-test" };

        // Act
        var archive = await writer.CreateArchiveAsync(metadata, schemas);

        // Assert
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read);
        
        // Check string schema
        var stringEntry = zipArchive.GetEntry("schemas/string-schema.json");
        using var stringStream = stringEntry!.Open();
        using var stringReader = new StreamReader(stringStream);
        var stringContent = await stringReader.ReadToEndAsync();
        Assert.StartsWith("{", stringContent);
        Assert.Contains("\"$schema\"", stringContent);
        
        // Check object schema
        var objectEntry = zipArchive.GetEntry("schemas/object-schema.json");
        using var objectStream = objectEntry!.Open();
        using var objectReader = new StreamReader(objectStream);
        var objectContent = await objectReader.ReadToEndAsync();
        Assert.StartsWith("{", objectContent);
        Assert.Contains("\"type\"", objectContent);
    }
}
