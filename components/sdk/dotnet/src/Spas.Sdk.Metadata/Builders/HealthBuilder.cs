using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for health check metadata.
/// </summary>
public class HealthBuilder
{
    private string _healthEndpoint = "/health";
    private int _timeoutSeconds = 30;

    /// <summary>
    /// Sets the health check endpoint path.
    /// </summary>
    public HealthBuilder WithHealthEndpoint(string endpoint)
    {
        _healthEndpoint = endpoint;
        return this;
    }

    /// <summary>
    /// Sets the health check timeout in seconds.
    /// </summary>
    public HealthBuilder WithTimeout(int timeoutSeconds)
    {
        _timeoutSeconds = timeoutSeconds;
        return this;
    }

    /// <summary>
    /// Builds the health metadata.
    /// </summary>
    public HealthMetadata Build()
    {
        return new HealthMetadata
        {
            HealthEndpoint = _healthEndpoint,
            TimeoutSeconds = _timeoutSeconds
        };
    }
}
