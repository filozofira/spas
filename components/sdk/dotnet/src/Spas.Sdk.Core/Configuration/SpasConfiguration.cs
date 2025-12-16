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
    /// Resolution priority:
    /// 1. SIDECAR_URL - Full URL (e.g., http://custom:8080)
    /// 2. SIDECAR_HOST + SIDECAR_PORT - Explicit host and port
    /// 3. SIDECAR_HOST + default port 7000 - Explicit host, default port
    /// 4. Derived from serviceName + default port 7000 - Convention-based ({service-name}-sidecar)
    /// 5. http://localhost:7000 - Local development fallback
    /// </summary>
    /// <param name="configuration">The configuration instance.</param>
    /// <param name="serviceName">Optional service name for deriving sidecar host using convention {serviceName}-sidecar.</param>
    /// <returns>The resolved sidecar URL.</returns>
    public static string GetSpasSidecarUrl(this IConfiguration configuration, string? serviceName = null)
    {
        const int defaultPort = 7000;

        // Priority 1: Full URL (highest priority)
        var sidecarUrl = configuration.GetValue<string>("SIDECAR_URL");
        if (!string.IsNullOrEmpty(sidecarUrl))
        {
            return sidecarUrl;
        }

        // Priority 2/3: Explicit host (with optional port)
        var sidecarHost = configuration.GetValue<string>("SIDECAR_HOST");
        var sidecarPort = configuration.GetValue<int?>("SIDECAR_PORT") ?? defaultPort;

        if (!string.IsNullOrEmpty(sidecarHost))
        {
            return $"http://{sidecarHost}:{sidecarPort}";
        }

        // Priority 4: Derive from service name using convention
        if (!string.IsNullOrWhiteSpace(serviceName))
        {
            var normalizedName = NormalizeForDns(serviceName);
            if (!string.IsNullOrEmpty(normalizedName))
            {
                return $"http://{normalizedName}-sidecar:{sidecarPort}";
            }
        }

        // Priority 5: Local development fallback
        return $"http://localhost:{defaultPort}";
    }

    /// <summary>
    /// Normalizes a service name for DNS hostname compatibility.
    /// Converts to lowercase, replaces underscores and spaces with hyphens,
    /// removes invalid characters, and trims leading/trailing hyphens.
    /// </summary>
    /// <param name="serviceName">The service name to normalize.</param>
    /// <returns>A DNS-compatible hostname.</returns>
    private static string NormalizeForDns(string serviceName)
    {
        if (string.IsNullOrWhiteSpace(serviceName))
        {
            return string.Empty;
        }

        // Convert to lowercase
        var normalized = serviceName.ToLowerInvariant();

        // Replace underscores and spaces with hyphens
        normalized = normalized.Replace('_', '-').Replace(' ', '-');

        // Remove any characters that are not alphanumeric or hyphen
        normalized = new string(normalized
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .ToArray());

        // Trim leading/trailing hyphens
        normalized = normalized.Trim('-');

        // Collapse multiple consecutive hyphens into one
        while (normalized.Contains("--"))
        {
            normalized = normalized.Replace("--", "-");
        }

        return normalized;
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
