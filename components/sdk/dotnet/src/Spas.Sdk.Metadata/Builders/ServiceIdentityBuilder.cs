using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for service identity metadata.
/// </summary>
public class ServiceIdentityBuilder
{
    private string? _name;
    private string? _version;
    private string? _description;
    private string? _owner;
    private string? _repository;

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
    /// Sets the service owner.
    /// </summary>
    public ServiceIdentityBuilder WithOwner(string owner)
    {
        _owner = owner;
        return this;
    }

    /// <summary>
    /// Sets the repository URL.
    /// </summary>
    public ServiceIdentityBuilder WithRepository(string repository)
    {
        _repository = repository;
        return this;
    }

    /// <summary>
    /// Builds the service identity.
    /// </summary>
    public ServiceIdentity Build()
    {
        if (string.IsNullOrEmpty(_name))
        {
            throw new InvalidOperationException("Service name is required.");
        }

        if (string.IsNullOrEmpty(_version))
        {
            throw new InvalidOperationException("Service version is required.");
        }

        return new ServiceIdentity
        {
            Name = _name,
            Version = _version,
            Description = _description,
            Owner = _owner,
            Repository = _repository
        };
    }
}
