using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Spas.Sdk.Inbound.Extensions;
using System.Net;
using Xunit;

namespace Spas.Sdk.Inbound.Tests;

public class SpasHealthChecksTests
{
    [Fact]
    public async Task LiveEndpoint_ReturnsUp()
    {
        // Arrange
        using var host = await new HostBuilder()
            .ConfigureServices(services =>
            {
                services.AddRouting();
                services.AddHealthChecks();
            })
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .Configure(app =>
                    {
                        app.UseRouting();
                        app.UseEndpoints(endpoints =>
                        {
                            endpoints.MapSpasHealthChecks();
                        });
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/_spas/health/live");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":\"UP\"", content);
    }

    [Fact]
    public async Task ReadyEndpoint_ReturnsUp_WhenHealthy()
    {
        // Arrange
        using var host = await new HostBuilder()
            .ConfigureServices(services =>
            {
                services.AddRouting();
                services.AddHealthChecks();
            })
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .Configure(app =>
                    {
                        app.UseRouting();
                        app.UseEndpoints(endpoints =>
                        {
                            endpoints.MapSpasHealthChecks();
                        });
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/_spas/health/ready");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":\"UP\"", content);
    }
}
