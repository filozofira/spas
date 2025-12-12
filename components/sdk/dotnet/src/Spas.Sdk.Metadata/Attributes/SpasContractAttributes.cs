namespace Spas.Sdk.Metadata.Attributes;

/// <summary>
/// Marks an endpoint as a SPAS command and provides contract metadata.
/// Apply to minimal API endpoints or controller actions.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Delegate, AllowMultiple = false)]
public class SpasCommandAttribute : Attribute
{
    /// <summary>
    /// The command name (e.g., "CreateOrder").
    /// </summary>
    public string Name { get; }

    /// <summary>
    /// The command version (semver, e.g., "1.0").
    /// </summary>
    public string Version { get; }

    /// <summary>
    /// The JSON schema reference for this command's request/response.
    /// Optional; if not provided, auto-generation may be attempted.
    /// </summary>
    public string? Schema { get; set; }

    /// <summary>
    /// Explicit path override. If not set, path will be inferred from route template.
    /// </summary>
    public string? Path { get; set; }

    public SpasCommandAttribute(string name, string version)
    {
        Name = name;
        Version = version;
    }
}

/// <summary>
/// Marks an endpoint as a SPAS query and provides contract metadata.
/// Apply to minimal API endpoints or controller actions.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Delegate, AllowMultiple = false)]
public class SpasQueryAttribute : Attribute
{
    /// <summary>
    /// The query name (e.g., "GetOrder").
    /// </summary>
    public string Name { get; }

    /// <summary>
    /// The query version (semver, e.g., "1.0").
    /// </summary>
    public string Version { get; }

    /// <summary>
    /// The JSON schema reference for this query's request/response.
    /// Optional; if not provided, auto-generation may be attempted.
    /// </summary>
    public string? Schema { get; set; }

    /// <summary>
    /// Explicit path override. If not set, path will be inferred from route template.
    /// </summary>
    public string? Path { get; set; }

    public SpasQueryAttribute(string name, string version)
    {
        Name = name;
        Version = version;
    }
}

/// <summary>
/// Marks an event type as a SPAS event and provides contract metadata.
/// Apply to event/message classes that will be published.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false)]
public class SpasEventAttribute : Attribute
{
    /// <summary>
    /// The event name (e.g., "OrderCreated").
    /// </summary>
    public string Name { get; }

    /// <summary>
    /// The event version (semver, e.g., "1.0").
    /// </summary>
    public string Version { get; }

    /// <summary>
    /// The JSON schema reference for this event's payload.
    /// Optional; if not provided, auto-generation may be attempted.
    /// </summary>
    public string? Schema { get; set; }

    public SpasEventAttribute(string name, string version)
    {
        Name = name;
        Version = version;
    }
}
