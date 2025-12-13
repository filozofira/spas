using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for service identity metadata.
/// </summary>
public class ServiceIdentityBuilder
{
    private string? _id;
    private string? _name;
    private string? _version;
    private string? _description;
    private string? _boundedContext;
    private readonly List<string> _capabilities = new();

    /// <summary>
    /// Sets the service ID (kebab-case identifier).
    /// </summary>
    public ServiceIdentityBuilder WithId(string id)
    {
        _id = id;
        return this;
    }

    /// <summary>
    /// Sets the service name.
    /// </summary>
    public ServiceIdentityBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    /// <summary>
    /// Sets the service version.
    /// </summary>
    public ServiceIdentityBuilder WithVersion(string version)
    {
        _version = version;
        return this;
    }

    /// <summary>
    /// Sets the service description.
    /// </summary>
    public ServiceIdentityBuilder WithDescription(string description)
    {
        _description = description;
        return this;
    }

    /// <summary>
    /// Sets the bounded context.
    /// </summary>
    public ServiceIdentityBuilder WithBoundedContext(string boundedContext)
    {
        _boundedContext = boundedContext;
        return this;
    }

    /// <summary>
    /// Adds a capability.
    /// </summary>
    public ServiceIdentityBuilder AddCapability(string capability)
    {
        _capabilities.Add(capability);
        return this;
    }

    /// <summary>
    /// Builds the service identity.
    /// </summary>
    public ServiceIdentity Build()
    {
        if (string.IsNullOrEmpty(_id))
        {
            throw new InvalidOperationException("Service id is required.");
        }

        if (string.IsNullOrEmpty(_name))
        {
            throw new InvalidOperationException("Service name is required.");
        }

        if (string.IsNullOrEmpty(_version))
        {
            throw new InvalidOperationException("Service version is required.");
        }

        if (string.IsNullOrEmpty(_boundedContext))
        {
            throw new InvalidOperationException("Bounded context is required.");
        }

        return new ServiceIdentity
        {
            Id = _id,
            Name = _name,
            Version = _version,
            Description = _description,
            BoundedContext = _boundedContext,
            Capabilities = _capabilities
        };
    }
}
