using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using System.IO.Compression;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Debug test to verify controller schema generation works end-to-end.
/// </summary>
public class ControllerSchemaGenerationDebugTest
{
    [Fact]
    public async Task ControllerEndpoint_GeneratesSchema_InArchive()
    {
        // Arrange - Simple controller with request type
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ControllerSchemaGenerationDebugTest).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(ControllerSchemaGenerationDebugTest).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        var identity = new ServiceIdentityBuilder()
            .WithId("debug-service")
            .WithName("Debug Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("Testing")
            .Build();

        // Act
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        
        try
        {
            var archivePath = await app.GenerateSpasMetadataArchiveAsync(identity, tempDir, typeof(ControllerSchemaGenerationDebugTest).Assembly);
            
            // Assert
            Assert.True(File.Exists(archivePath));

            using var zipArchive = ZipFile.OpenRead(archivePath);
            
            // List all entries for debugging
            var entries = zipArchive.Entries.Select(e => e.FullName).ToList();
            var schemasInArchive = entries.Where(e => e.Contains("schema")).ToList();
            
            // Check if schema was generated
            var debugSchema = zipArchive.Entries.FirstOrDefault(e =>
                e.FullName == "schemas/endpoints/create-debug-item.schema.json");
            
            Assert.NotNull(debugSchema);
        }
        finally
        {
            if (Directory.Exists(tempDir))
            {
                Directory.Delete(tempDir, recursive: true);
            }
        }
    }
}

[Route("api/debug")]
[ApiController]
public class DebugTestController : ControllerBase
{
    [HttpPost]
    [SpasCommand("CreateDebugItem", "1.0.0")]
    public IActionResult Create([FromBody] DebugItemRequest request)
    {
        return Ok();
    }
}

public record DebugItemRequest(string Name, int Value);
