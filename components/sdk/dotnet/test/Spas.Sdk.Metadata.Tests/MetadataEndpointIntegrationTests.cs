using System.IO.Compression;
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Spas.Sdk.Metadata.Dev;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataEndpointIntegrationTests
{
    [Fact]
    public async Task MetadataEndpoint_ReturnsZipArchive_WithSpasJsonAndSchemas()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Development
        });
        builder.WebHost.UseTestServer();
        builder.Services.AddMetadataEndpoint();

        await using var app = builder.Build();

        app.MapSpasMetadataEndpoint(
            metadataProvider: () => new
            {
                serviceId = "test-service",
                serviceName = "Test Service",
                version = "1.0.0",
                contracts = new
                {
                    commands = new[]
                    {
                        new
                        {
                            name = "TestCommand",
                            version = "1.0",
                            path = "/commands/test",
                            schemaPath = "schemas/test-command.schema.json"
                        }
                    },
                    events = new[]
                    {
                        new
                        {
                            name = "TestEvent",
                            version = "1.0",
                            schemaPath = "schemas/test-event.schema.json"
                        }
                    }
                }
            },
            schemasProvider: () => new Dictionary<string, object>
            {
                ["schemas/test-command.schema.json"] = new
                {
                    type = "object",
                    properties = new
                    {
                        commandId = new { type = "string" }
                    }
                },
                ["schemas/test-event.schema.json"] = new
                {
                    type = "object",
                    properties = new
                    {
                        eventId = new { type = "string" }
                    }
                }
            });

        await app.StartAsync();
        var client = app.GetTestClient();

        // Act
        var response = await client.GetAsync("/_spas/metadata");

        // Assert
        Assert.True(response.IsSuccessStatusCode, $"Expected success status code, got {response.StatusCode}");
        Assert.Equal("application/zip", response.Content.Headers.ContentType?.MediaType);
        Assert.NotNull(response.Content.Headers.ContentDisposition);
        Assert.Equal("attachment", response.Content.Headers.ContentDisposition.DispositionType);
        Assert.Equal("spas-metadata.zip", response.Content.Headers.ContentDisposition.FileName);

        var zipBytes = await response.Content.ReadAsByteArrayAsync();
        Assert.NotEmpty(zipBytes);

        // Extract and validate ZIP contents
        using var zipStream = new MemoryStream(zipBytes);
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);

        var entries = archive.Entries.Select(e => e.FullName).ToList();
        Assert.Contains("spas.json", entries);
        Assert.Contains("schemas/test-command.schema.json", entries);
        Assert.Contains("schemas/test-event.schema.json", entries);

        // Validate spas.json content
        var spasJsonEntry = archive.GetEntry("spas.json");
        Assert.NotNull(spasJsonEntry);

        using var spasJsonReader = new StreamReader(spasJsonEntry.Open());
        var spasJsonContent = await spasJsonReader.ReadToEndAsync();
        Assert.Contains("\"serviceId\":", spasJsonContent);
        Assert.Contains("\"serviceName\":", spasJsonContent);
        Assert.Contains("\"contracts\":", spasJsonContent);

        // Validate schema content
        var schemaEntry = archive.GetEntry("schemas/test-command.schema.json");
        Assert.NotNull(schemaEntry);

        using var schemaReader = new StreamReader(schemaEntry.Open());
        var schemaContent = await schemaReader.ReadToEndAsync();
        Assert.Contains("\"type\":", schemaContent);
    }

    [Fact]
    public async Task MetadataEndpoint_InProductionEnvironment_ReturnsDisabledMessage()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Production
        });
        builder.WebHost.UseTestServer();
        builder.Services.AddMetadataEndpoint();

        await using var app = builder.Build();

        app.MapSpasMetadataEndpoint(
            metadataProvider: () => new { serviceId = "test-service" },
            schemasProvider: () => new Dictionary<string, object>());

        await app.StartAsync();
        using var client = app.GetTestClient();

        // Act
        var response = await client.GetAsync("/_spas/metadata");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("disabled", content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("production", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task MetadataEndpoint_WithCustomPath_ReturnsArchive()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Development
        });
        builder.WebHost.UseTestServer();
        builder.Services.AddMetadataEndpoint(options =>
        {
            options.Path = "/custom/metadata";
        });

        await using var app = builder.Build();

        app.MapSpasMetadataEndpoint(
            metadataProvider: () => new { serviceId = "test" },
            schemasProvider: () => new Dictionary<string, object>
            {
                ["test.schema.json"] = new { type = "object" }
            });

        await app.StartAsync();
        using var client = app.GetTestClient();

        // Act
        var response = await client.GetAsync("/custom/metadata");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        Assert.Equal("application/zip", response.Content.Headers.ContentType?.MediaType);
    }
}


