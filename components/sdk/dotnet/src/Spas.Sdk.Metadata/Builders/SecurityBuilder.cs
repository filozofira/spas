using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for security metadata.
/// </summary>
public class SecurityBuilder
{
    private string? _authentication;
    private readonly List<string> _requiredScopes = new();

    /// <summary>
    /// Sets the authentication mechanism.
    /// </summary>
    public SecurityBuilder WithAuthentication(string authentication)
    {
        _authentication = authentication;
        return this;
    }

    /// <summary>
    /// Adds a required scope.
    /// </summary>
    public SecurityBuilder AddRequiredScope(string scope)
    {
        _requiredScopes.Add(scope);
        return this;
    }

    /// <summary>
    /// Builds the security metadata.
    /// </summary>
    public SecurityMetadata Build()
    {
        return new SecurityMetadata
        {
            Authentication = _authentication,
            RequiredScopes = _requiredScopes
        };
    }
}
