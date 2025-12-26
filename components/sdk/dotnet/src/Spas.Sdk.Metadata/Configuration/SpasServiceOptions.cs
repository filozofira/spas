using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Configuration;

/// <summary>
/// Configuration options for a SPAS service.
/// Used by BuildSpasServiceAsync to configure service identity and metadata generation.
/// </summary>
public class SpasServiceOptions
{
    /// <summary>
    /// Unique service identifier (e.g., "order-service").
    /// </summary>
    public string ServiceId { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable service name.
    /// </summary>
    public string ServiceName { get; set; } = string.Empty;

    /// <summary>
    /// Service version (semver format, e.g., "1.0.0").
    /// </summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// Bounded context this service belongs to.
    /// </summary>
    public string BoundedContext { get; set; } = string.Empty;

    /// <summary>
    /// Optional service description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Service capabilities (e.g., "order-management", "payment-processing").
    /// </summary>
    public List<string> Capabilities { get; } = new();

    /// <summary>
    /// Optional consistency metadata.
    /// </summary>
    public ConsistencyMetadata? Consistency { get; private set; }

    /// <summary>
    /// Optional network metadata.
    /// </summary>
    public NetworkMetadata? Network { get; private set; }

    /// <summary>
    /// Optional security metadata.
    /// </summary>
    public SecurityMetadata? Security { get; private set; }

    /// <summary>
    /// Optional license identifier (e.g., "MIT").
    /// </summary>
    public string? License { get; set; }

    /// <summary>
    /// Adds a capability to the service.
    /// </summary>
    public SpasServiceOptions AddCapability(string capability)
    {
        Capabilities.Add(capability);
        return this;
    }

    public SpasServiceOptions ConfigureConsistency(Action<ConsistencyBuilder> configure)
    {
        var builder = new ConsistencyBuilder();
        configure(builder);
        Consistency = builder.Build();
        return this;
    }

    public SpasServiceOptions ConfigureNetwork(Action<NetworkBuilder> configure)
    {
        var builder = new NetworkBuilder();
        configure(builder);
        Network = builder.Build();
        return this;
    }

    public SpasServiceOptions ConfigureSecurity(Action<SecurityBuilder> configure)
    {
        var builder = new SecurityBuilder();
        configure(builder);
        Security = builder.Build();
        return this;
    }
}
