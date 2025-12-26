using Microsoft.AspNetCore.Builder;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Models;
using Spas.Sdk.Metadata.Tests.Helpers;

namespace Spas.Sdk.Metadata.Tests;

public class MetadataArchiveGeneratorTests
{
    [SpasEvent("TestEvent", "1.0.0")]
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
}
