using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Core.Configuration;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Observability.Tracing;

namespace Spas.Sdk.Observability.Extensions;

/// <summary>
/// High-level extension methods for configuring SPAS infrastructure services.
/// Abstracts away service name, sidecar URL, and Zipkin URL from application code.
/// </summary>
public static class SpasServiceExtensions
{
    /// <summary>
    /// Configures all SPAS infrastructure services: event publishing, distributed tracing.
    /// Reads configuration from environment variables (SERVICE_NAME, SIDECAR_HOST, SIDECAR_PORT, ZIPKIN_URL).
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The configuration</param>
    /// <param name="defaultServiceName">Optional default service name if SERVICE_NAME not set</param>
    /// <returns>The configured service name (for metadata composition)</returns>
    public static string AddSpasServices(
        this IServiceCollection services,
        IConfiguration configuration,
        string defaultServiceName = "unknown-service")
    {
        // Get service name from environment variable
        var serviceName = configuration.GetSpasServiceName(defaultServiceName);
        var sidecarUrl = configuration.GetSpasSidecarUrl();
        var zipkinUrl = configuration.GetSpasZipkinUrl();

        // Configure event publishing to sidecar
        services.AddHttpClient<EventPublisher>(client =>
        {
            client.BaseAddress = new Uri(sidecarUrl);
        })
        .AddTypedClient((httpClient, _) =>
        {
            return new EventPublisher(httpClient, serviceName);
        });

        // Configure OpenTelemetry with Zipkin
        services.AddSpasTracing(serviceName, zipkinUrl);

        // Return service name for metadata composition
        return serviceName;
    }
}
