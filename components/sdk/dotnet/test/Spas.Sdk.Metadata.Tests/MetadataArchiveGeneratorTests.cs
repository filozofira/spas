using Microsoft.AspNetCore.Builder;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Models;
using Spas.Sdk.Metadata.Tests.Helpers;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataArchiveGeneratorTests
{
    [SpasEvent("TestEventForArchive", "1.0.0")]
    private sealed record TestEvent(string Id);

    [Fact]
    public async Task GenerateAsync_WritesZipAndIncludesSpasJson()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            var identity = new ServiceIdentityBuilder()
                .WithId("test-service")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            Assert.True(File.Exists(zipPath));

            var entries = ZipAssert.ReadEntryNames(zipPath);
            Assert.Contains("spas.json", entries);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GenerateAsync_WithDefaultOutputDirectory_CreatesMetadataDirectoryAndWritesZip()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        var originalCurrentDirectory = Environment.CurrentDirectory;
        try
        {
            Environment.CurrentDirectory = tempRoot;

            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            var identity = new ServiceIdentityBuilder()
                .WithId("test-service")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: null,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            var expectedZipPath = Path.Combine(
                tempRoot,
                "metadata",
                "service.metadata.zip");

            Assert.Equal(expectedZipPath, zipPath);
            Assert.True(File.Exists(zipPath));

            var entries = ZipAssert.ReadEntryNames(zipPath);
            Assert.Contains("spas.json", entries);
        }
        finally
        {
            Environment.CurrentDirectory = originalCurrentDirectory;

            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GenerateAsync_WhenArchiveExists_OverwritesExistingFile()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            var identity = new ServiceIdentityBuilder()
                .WithId("test-service")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var zipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            Assert.True(File.Exists(zipPath));

            await File.WriteAllTextAsync(zipPath, "not a zip");

            var overwrittenZipPath = await app.GenerateSpasMetadataArchiveAsync(
                identity,
                outputDirectory: tempRoot,
                assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly);

            Assert.Equal(zipPath, overwrittenZipPath);

            var entries = ZipAssert.ReadEntryNames(overwrittenZipPath);
            Assert.Contains("spas.json", entries);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GenerateAsync_WhenSpasJsonIsSchemaInvalid_FailsWithActionableError()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var builder = WebApplication.CreateBuilder();
            builder.Services.AddSpasMetadata(options =>
            {
                options.AssembliesToScan.Add(typeof(MetadataArchiveGeneratorTests).Assembly);
            });

            var app = builder.Build();

            // Invalid per design-time-metadata-v1.schema.json (must be kebab-case)
            var identity = new ServiceIdentityBuilder()
                .WithId("INVALID_ID")
                .WithName("test-service")
                .WithVersion("1.0.0")
                .WithBoundedContext("test")
                .Build();

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                app.GenerateSpasMetadataArchiveAsync(
                    identity,
                    outputDirectory: tempRoot,
                    assemblyToScan: typeof(MetadataArchiveGeneratorTests).Assembly));

            Assert.Contains("schema validation", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }
}
