using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for security metadata.
/// </summary>
public class SecurityBuilder
{
    private string? _authenticationType;
    private readonly List<string> _requiredScopes = new();
    private readonly List<string> _dataClassification = new();

    /// <summary>
    /// Sets the authentication type (e.g., jwt).
    /// </summary>
    public SecurityBuilder WithAuthenticationType(string type)
    {
        _authenticationType = type;
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
    /// Adds a data classification.
    /// </summary>
    public SecurityBuilder AddDataClassification(string classification)
    {
        _dataClassification.Add(classification);
        return this;
    }

    /// <summary>
    /// Builds the security metadata.
    /// </summary>
    public SecurityMetadata Build()
    {
        return new SecurityMetadata
        {
            Authentication = !string.IsNullOrEmpty(_authenticationType) || _requiredScopes.Any()
                ? new AuthenticationMetadata
                {
                    Type = _authenticationType ?? "jwt",
                    RequiredScopes = _requiredScopes
                }
                : null,
            DataClassification = _dataClassification
        };
    }
}
