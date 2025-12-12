using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace Spas.Sdk.Observability.Tracing;

/// <summary>
/// Extension methods for configuring OpenTelemetry tracing with Zipkin
/// </summary>
public static class OpenTelemetryExtensions
{
    /// <summary>
    /// Adds SPAS OpenTelemetry tracing with Zipkin exporter
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="serviceName">The name of the service for tracing</param>
    /// <param name="zipkinEndpoint">The Zipkin endpoint URL (default: http://localhost:9411/api/v2/spans)</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddSpasTracing(
        this IServiceCollection services,
        string serviceName,
        string zipkinEndpoint = "http://localhost:9411/api/v2/spans")
    {
        if (services == null)
        {
            throw new ArgumentNullException(nameof(services));
        }

        if (string.IsNullOrEmpty(serviceName))
        {
            throw new ArgumentException("Service name cannot be null or empty", nameof(serviceName));
        }

        services.AddOpenTelemetry()
            .WithTracing(tracing => tracing
                .SetResourceBuilder(ResourceBuilder.CreateDefault()
                    .AddService(serviceName)
                    .AddAttributes(new Dictionary<string, object>
                    {
                        ["deployment.environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
                    }))
                .AddSource("Spas.Sdk.Observability") // Listen to our ActivitySource
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.RecordException = true;
                    options.EnrichWithHttpRequest = (activity, httpRequest) =>
                    {
                        activity.SetTag("http.request.path", httpRequest.Path);
                    };
                    options.EnrichWithHttpResponse = (activity, httpResponse) =>
                    {
                        activity.SetTag("http.response.status_code", httpResponse.StatusCode);
                    };
                })
                .AddHttpClientInstrumentation() // Track outbound HTTP calls
                .AddZipkinExporter(options =>
                {
                    options.Endpoint = new Uri(zipkinEndpoint);
                }));

        return services;
    }

    /// <summary>
    /// Adds SPAS OpenTelemetry tracing with custom trace configuration
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="serviceName">The name of the service for tracing</param>
    /// <param name="configure">Action to configure TracerProviderBuilder</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddSpasTracing(
        this IServiceCollection services,
        string serviceName,
        Action<TracerProviderBuilder> configure)
    {
        if (services == null)
        {
            throw new ArgumentNullException(nameof(services));
        }

        if (string.IsNullOrEmpty(serviceName))
        {
            throw new ArgumentException("Service name cannot be null or empty", nameof(serviceName));
        }

        services.AddOpenTelemetry()
            .WithTracing(tracing =>
            {
                tracing.SetResourceBuilder(ResourceBuilder.CreateDefault()
                    .AddService(serviceName));

                tracing.AddSource("Spas.Sdk.Observability");
                tracing.AddAspNetCoreInstrumentation();
                tracing.AddHttpClientInstrumentation();

                configure(tracing);
            });

        return services;
    }
}
