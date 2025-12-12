using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Spas.Sdk.Core.Configuration;

/// <summary>
/// Extension methods for reading SPAS configuration values using environment variable
/// conventions matching the sidecar prototype patterns.
/// </summary>
public static class SpasConfiguration
{
    /// <summary>
    /// Gets the service name from configuration.
    /// Reads from SERVICE_NAME environment variable or falls back to provided default.
    /// </summary>
    public static string GetSpasServiceName(this IConfiguration configuration, string defaultName = "unknown-service")
    {
        return configuration.GetValue<string>("SERVICE_NAME") ?? defaultName;
    }

    /// <summary>
    /// Gets the sidecar URL from configuration.
    /// Constructs URL from SIDECAR_HOST and SIDECAR_PORT environment variables,
    /// or falls back to SIDECAR_URL, or defaults to http://localhost:3001.
    /// </summary>
    public static string GetSpasSidecarUrl(this IConfiguration configuration)
    {
        var sidecarHost = configuration.GetValue<string>("SIDECAR_HOST");
        var sidecarPort = configuration.GetValue<int?>("SIDECAR_PORT");

        if (!string.IsNullOrEmpty(sidecarHost) && sidecarPort.HasValue)
        {
            return $"http://{sidecarHost}:{sidecarPort}";
        }

        // Fallback: single SIDECAR_URL variable
        var sidecarUrl = configuration.GetValue<string>("SIDECAR_URL");
        if (!string.IsNullOrEmpty(sidecarUrl))
        {
            return sidecarUrl;
        }

        // Default for local development
        return "http://localhost:3001";
    }

    /// <summary>
    /// Gets the Zipkin endpoint URL from configuration.
    /// Reads from ZIPKIN_URL environment variable or falls back to http://localhost:9411.
    /// </summary>
    public static string GetSpasZipkinUrl(this IConfiguration configuration)
    {
        var zipkinUrl = configuration.GetValue<string>("ZIPKIN_URL");
        if (!string.IsNullOrEmpty(zipkinUrl))
        {
            // Ensure it includes the full API path
            if (!zipkinUrl.Contains("/api/v2/spans"))
            {
                zipkinUrl = zipkinUrl.TrimEnd('/');
                return $"{zipkinUrl}/api/v2/spans";
            }
            return zipkinUrl;
        }

        // Default for local development
        return "http://localhost:9411/api/v2/spans";
    }

    /// <summary>
    /// Gets the service port from configuration.
    /// Reads from PORT environment variable or falls back to default.
    /// </summary>
    public static int GetSpasServicePort(this IConfiguration configuration, int defaultPort = 5000)
    {
        return configuration.GetValue<int?>("PORT") ?? defaultPort;
    }

    /// <summary>
    /// Determines if the service is running in development mode.
    /// Checks ASPNETCORE_ENVIRONMENT or DOTNET_ENVIRONMENT.
    /// </summary>
    public static bool IsSpasDevMode(this IHostEnvironment environment)
    {
        return environment.IsDevelopment();
    }
}
