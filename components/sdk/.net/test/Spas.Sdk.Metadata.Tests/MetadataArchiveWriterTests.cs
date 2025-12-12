using Spas.Sdk.Metadata.Dev;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataArchiveWriterTests
{
    [Fact]
    public async Task CreateArchive_ShouldIncludeSpasJson()
    {
        // Arrange
        var spasJson = new
        {
            name = "test-service",
            version = "1.0.0",
            boundedContext = "test-context"
        };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, new Dictionary<string, object>());

        // Assert
        Assert.NotNull(archive);
        Assert.True(archive.Length > 0);

        // Verify archive contains spas.json
        archive.Position = 0;
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        var spasEntry = zipArchive.GetEntry("spas.json");
        Assert.NotNull(spasEntry);

        // Verify content
        using var entryStream = spasEntry!.Open();
        using var reader = new StreamReader(entryStream);
        var content = await reader.ReadToEndAsync();
        Assert.Contains("test-service", content);
    }

    [Fact]
    public async Task CreateArchive_ShouldIncludeAllSchemas()
    {
        // Arrange
        var spasJson = new { name = "test-service" };
        var schemas = new Dictionary<string, object>
        {
            ["commands/CreateOrder.json"] = new { type = "object", properties = new { orderId = new { type = "string" } } },
            ["events/OrderCreated.json"] = new { type = "object", properties = new { orderId = new { type = "string" } } }
        };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, schemas);

        // Assert
        archive.Position = 0;
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        
        Assert.NotNull(zipArchive.GetEntry("spas.json"));
        Assert.NotNull(zipArchive.GetEntry("commands/CreateOrder.json"));
        Assert.NotNull(zipArchive.GetEntry("events/OrderCreated.json"));
    }

    [Fact]
    public async Task CreateArchive_ShouldHandleEmptySchemas()
    {
        // Arrange
        var spasJson = new { name = "test-service" };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, new Dictionary<string, object>());

        // Assert
        archive.Position = 0;
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        Assert.Single(zipArchive.Entries); // Only spas.json
        Assert.NotNull(zipArchive.GetEntry("spas.json"));
    }

    [Fact]
    public async Task CreateArchive_ShouldUseCorrectJsonFormatting()
    {
        // Arrange
        var spasJson = new
        {
            name = "test-service",
            version = "1.0.0"
        };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, new Dictionary<string, object>());

        // Assert
        archive.Position = 0;
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        var spasEntry = zipArchive.GetEntry("spas.json");
        
        using var entryStream = spasEntry!.Open();
        using var reader = new StreamReader(entryStream);
        var content = await reader.ReadToEndAsync();

        // Verify it's valid JSON and properly formatted
        var parsed = JsonDocument.Parse(content);
        Assert.Equal("test-service", parsed.RootElement.GetProperty("name").GetString());
        Assert.Equal("1.0.0", parsed.RootElement.GetProperty("version").GetString());
    }

    [Fact]
    public async Task CreateArchive_ShouldProduceStreamAtBeginning()
    {
        // Arrange
        var spasJson = new { name = "test-service" };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, new Dictionary<string, object>());

        // Assert
        Assert.Equal(0, archive.Position);
        Assert.True(archive.CanRead);
        Assert.True(archive.CanSeek);
    }

    [Fact]
    public async Task CreateArchive_ShouldHandleNestedSchemaPath()
    {
        // Arrange
        var spasJson = new { name = "test-service" };
        var schemas = new Dictionary<string, object>
        {
            ["contracts/v1/commands/CreateOrder.json"] = new { type = "object" }
        };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, schemas);

        // Assert
        archive.Position = 0;
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        var entry = zipArchive.GetEntry("contracts/v1/commands/CreateOrder.json");
        Assert.NotNull(entry);
    }

    [Fact]
    public async Task CreateArchive_ShouldUseUtf8Encoding()
    {
        // Arrange
        var spasJson = new { name = "test-service", description = "Service with unicode: ñ, é, 中文" };
        var writer = new MetadataArchiveWriter();

        // Act
        using var archive = await writer.CreateArchiveAsync(spasJson, new Dictionary<string, object>());

        // Assert
        archive.Position = 0;
        using var zipArchive = new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        var spasEntry = zipArchive.GetEntry("spas.json");
        
        using var entryStream = spasEntry!.Open();
        using var reader = new StreamReader(entryStream, Encoding.UTF8);
        var content = await reader.ReadToEndAsync();
        
        Assert.Contains("ñ", content);
        Assert.Contains("é", content);
        Assert.Contains("中文", content);
    }
}
