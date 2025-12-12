namespace Spas.Sdk.Core.Context;

/// <summary>
/// Provides access to SPAS context values including correlation ID and identity information.
/// Uses AsyncLocal for async-safe storage within a single execution context.
/// </summary>
public static class SpasContext
{
    private static readonly AsyncLocal<string?> _correlationId = new();
    private static readonly AsyncLocal<string?> _userId = new();
    private static readonly AsyncLocal<string?> _tenantId = new();
    private static readonly AsyncLocal<Dictionary<string, string>?> _customProperties = new();

    /// <summary>
    /// Gets or sets the correlation ID for the current execution context.
    /// This ID is used to correlate events and logs across service boundaries.
    /// </summary>
    public static string? CorrelationId
    {
        get => _correlationId.Value;
        set => _correlationId.Value = value;
    }

    /// <summary>
    /// Gets or sets the user ID for the current execution context.
    /// </summary>
    public static string? UserId
    {
        get => _userId.Value;
        set => _userId.Value = value;
    }

    /// <summary>
    /// Gets or sets the tenant ID for the current execution context.
    /// </summary>
    public static string? TenantId
    {
        get => _tenantId.Value;
        set => _tenantId.Value = value;
    }

    /// <summary>
    /// Gets or sets a custom property in the current execution context.
    /// </summary>
    /// <param name="key">The property key.</param>
    /// <returns>The property value, or null if not set.</returns>
    public static string? GetProperty(string key)
    {
        if (_customProperties.Value == null)
        {
            return null;
        }

        return _customProperties.Value.TryGetValue(key, out var value) ? value : null;
    }

    /// <summary>
    /// Sets a custom property in the current execution context.
    /// </summary>
    /// <param name="key">The property key.</param>
    /// <param name="value">The property value.</param>
    public static void SetProperty(string key, string value)
    {
        _customProperties.Value ??= new Dictionary<string, string>();
        _customProperties.Value[key] = value;
    }

    /// <summary>
    /// Clears all context values for the current execution context.
    /// Useful for cleanup or testing scenarios.
    /// </summary>
    public static void Clear()
    {
        _correlationId.Value = null;
        _userId.Value = null;
        _tenantId.Value = null;
        _customProperties.Value = null;
    }

    /// <summary>
    /// Initializes the context with common identity values.
    /// </summary>
    /// <param name="correlationId">The correlation ID.</param>
    /// <param name="userId">Optional user ID.</param>
    /// <param name="tenantId">Optional tenant ID.</param>
    public static void Initialize(string correlationId, string? userId = null, string? tenantId = null)
    {
        CorrelationId = correlationId;
        UserId = userId;
        TenantId = tenantId;
    }
}
