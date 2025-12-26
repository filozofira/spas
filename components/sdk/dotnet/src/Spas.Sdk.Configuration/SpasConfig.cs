namespace Spas.Sdk.Configuration;

/// <summary>
/// Base configuration for SPAS SDK components.
/// Provides common settings for sidecar integration, endpoints, and service identity.
/// </summary>
public class SpasConfig
{
    /// <summary>
    /// Gets or sets the sidecar HTTP endpoint URL.
    /// Default: http://localhost:8080
    /// </summary>
    public string SidecarEndpoint { get; set; } = "http://localhost:8080";

    /// <summary>
    /// Gets or sets the service name for identification in metadata and events.
    /// </summary>
    public string ServiceName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the service version.
    /// </summary>
    public string ServiceVersion { get; set; } = "1.0.0";

    /// <summary>
    /// Gets or sets whether development features are enabled.
    /// Should be disabled in production environments.
    /// </summary>
    public bool DevelopmentMode { get; set; } = false;

    /// <summary>
    /// Gets or sets the timeout in seconds for sidecar HTTP requests.
    /// Default: 30 seconds.
    /// </summary>
    public int SidecarTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Gets or sets whether to automatically propagate W3C Trace Context headers.
    /// Default: true.
    /// </summary>
    public bool EnableTraceContext { get; set; } = true;

    /// <summary>
    /// Gets or sets whether to automatically include correlation IDs in outbound requests.
    /// Default: true.
    /// </summary>
    public bool EnableCorrelation { get; set; } = true;

    /// <summary>
    /// Gets or sets custom metadata properties to include in service metadata.
    /// </summary>
    public Dictionary<string, string> CustomMetadata { get; set; } = new();
}

/// <summary>
/// Configuration for event publishing.
/// </summary>
public class EventPublishingConfig
{
    /// <summary>
    /// Gets or sets the endpoint path for publishing events to the sidecar.
    /// Default: /events/publish
    /// </summary>
    public string PublishEndpoint { get; set; } = "/events/publish";

    /// <summary>
    /// Gets or sets whether to retry failed event publishes.
    /// Default: true (PoC: may be false for simplicity).
    /// </summary>
    public bool EnableRetry { get; set; } = false;

    /// <summary>
    /// Gets or sets the maximum number of retry attempts for failed publishes.
    /// Default: 3.
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;
}
