using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for network metadata.
/// </summary>
public class NetworkBuilder
{
    private readonly List<string> _requiredEgress = new();

    /// <summary>
    /// Adds a required egress host:port.
    /// </summary>
    public NetworkBuilder AddRequiredEgress(string hostPort)
    {
        _requiredEgress.Add(hostPort);
        return this;
    }

    /// <summary>
    /// Builds the network metadata.
    /// </summary>
    public NetworkMetadata Build()
    {
        return new NetworkMetadata
        {
            RequiredEgress = _requiredEgress
        };
    }
}
