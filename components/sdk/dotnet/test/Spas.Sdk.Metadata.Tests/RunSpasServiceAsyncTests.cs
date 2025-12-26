using Microsoft.AspNetCore.Builder;
using Spas.Sdk.Metadata.Extensions;

namespace Spas.Sdk.Metadata.Tests;

public class RunSpasServiceAsyncTests
{
    [Fact]
    public async Task RunSpasServiceAsync_ThrowsForNullApp()
    {
        WebApplication? app = null;

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            app!.RunSpasServiceAsync(Array.Empty<string>(), options => { }));
    }

    [Fact]
    public async Task RunSpasServiceAsync_ThrowsForMissingServiceId_WhenGeneratingMetadata()
    {
        var builder = WebApplication.CreateBuilder(Array.Empty<string>());
        var app = builder.Build();

        var args = new[] { "--generate-metadata", "--output", "." };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            app.RunSpasServiceAsync(args, options =>
            {
                options.ServiceName = "Test Service";
                options.Version = "1.0.0";
                options.BoundedContext = "Test";
            }));

        Assert.Contains("ServiceId", exception.Message);

        await app.DisposeAsync();
    }

    [Fact]
    public async Task RunSpasServiceAsync_ThrowsForMissingServiceName_WhenGeneratingMetadata()
    {
        var builder = WebApplication.CreateBuilder(Array.Empty<string>());
        var app = builder.Build();

        var args = new[] { "--generate-metadata", "--output", "." };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            app.RunSpasServiceAsync(args, options =>
            {
                options.ServiceId = "test-service";
                options.Version = "1.0.0";
                options.BoundedContext = "Test";
            }));

        Assert.Contains("ServiceName", exception.Message);

        await app.DisposeAsync();
    }

    [Fact]
    public async Task RunSpasServiceAsync_ThrowsForMissingVersion_WhenGeneratingMetadata()
    {
        var builder = WebApplication.CreateBuilder(Array.Empty<string>());
        var app = builder.Build();

        var args = new[] { "--generate-metadata", "--output", "." };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            app.RunSpasServiceAsync(args, options =>
            {
                options.ServiceId = "test-service";
                options.ServiceName = "Test Service";
                options.BoundedContext = "Test";
            }));

        Assert.Contains("Version", exception.Message);

        await app.DisposeAsync();
    }

    [Fact]
    public async Task RunSpasServiceAsync_ThrowsForMissingBoundedContext_WhenGeneratingMetadata()
    {
        var builder = WebApplication.CreateBuilder(Array.Empty<string>());
        var app = builder.Build();

        var args = new[] { "--generate-metadata", "--output", "." };
        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            app.RunSpasServiceAsync(args, options =>
            {
                options.ServiceId = "test-service";
                options.ServiceName = "Test Service";
                options.Version = "1.0.0";
            }));

        Assert.Contains("BoundedContext", exception.Message);

        await app.DisposeAsync();
    }
}
