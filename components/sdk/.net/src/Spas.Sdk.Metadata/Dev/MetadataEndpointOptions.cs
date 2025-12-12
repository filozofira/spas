namespace Spas.Sdk.Metadata.Dev;

/// <summary>
/// Configuration options for the dev-only metadata endpoint.
/// </summary>
public class MetadataEndpointOptions
{
    /// <summary>
    /// Gets or sets whether the metadata endpoint is enabled.
    /// Default: true
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Gets or sets the path for the metadata endpoint.
    /// Default: "/_spas/metadata"
    /// </summary>
    public string Path { get; set; } = "/_spas/metadata";

    /// <summary>
    /// Gets or sets the environment name that allows the endpoint to be active.
    /// Default: "Development"
    /// </summary>
    public string AllowedEnvironment { get; set; } = "Development";

    /// <summary>
    /// Determines whether the endpoint should be active for the given environment.
    /// </summary>
    /// <param name="currentEnvironment">The current environment name.</param>
    /// <returns>True if endpoint is enabled and environment matches; otherwise false.</returns>
    public bool IsEnvironmentAllowed(string currentEnvironment)
    {
        if (!Enabled)
        {
            return false;
        }

        return string.Equals(
            AllowedEnvironment,
            currentEnvironment,
            StringComparison.OrdinalIgnoreCase);
    }
}
