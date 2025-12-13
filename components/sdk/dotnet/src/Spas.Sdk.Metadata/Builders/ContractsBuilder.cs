using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for service contracts metadata.
/// </summary>
public class ContractsBuilder
{
    private readonly List<EndpointContract> _endpoints = new();
    private readonly List<EventContract> _events = new();

    /// <summary>
    /// Adds an endpoint (command or query).
    /// </summary>
    public ContractsBuilder AddEndpoint(string name, string type, string protocol, string methodPath, string version, string schemaRef, string? description = null)
    {
        _endpoints.Add(new EndpointContract
        {
            Name = name,
            Type = type,
            Protocol = protocol,
            MethodPath = methodPath,
            Version = version,
            SchemaRef = schemaRef,
            Description = description
        });
        return this;
    }

    /// <summary>
    /// Adds an event contract.
    /// </summary>
    public ContractsBuilder AddEvent(string type, string version, string schemaRef)
    {
        _events.Add(new EventContract
        {
            Type = type,
            Version = version,
            SchemaRef = schemaRef
        });
        return this;
    }

    /// <summary>
    /// Builds the service contracts.
    /// </summary>
    public ServiceContracts Build()
    {
        return new ServiceContracts
        {
            Endpoints = _endpoints,
            Events = _events
        };
    }
}
