namespace Spas.Sdk.Metadata.Attributes;

/// <summary>
/// Internal helper for attribute classes.
/// </summary>
internal static class AttributeHelpers
{
    /// <summary>
    /// Converts a PascalCase name to kebab-case for file naming.
    /// </summary>
    public static string ToKebabCase(string value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return string.Concat(value.Select((ch, i) =>
            i > 0 && char.IsUpper(ch) ? "-" + char.ToLowerInvariant(ch) : char.ToLowerInvariant(ch).ToString()));
    }
}

/// <summary>
/// Marks an endpoint as a SPAS command and provides contract metadata.
/// Apply to minimal API endpoints or controller actions, or to request/response types for auto-schema generation.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Delegate | AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false)]
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
        // Auto-generate schema path if not explicitly set
        Schema ??= $"schemas/endpoints/{AttributeHelpers.ToKebabCase(name)}.schema.json";
    }
}

/// <summary>
/// Marks an endpoint as a SPAS query and provides contract metadata.
/// Apply to minimal API endpoints or controller actions, or to request/response types for auto-schema generation.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Delegate | AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false)]
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
        // Auto-generate schema path if not explicitly set
        Schema ??= $"schemas/endpoints/{AttributeHelpers.ToKebabCase(name)}.schema.json";
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

    /// <summary>
    /// The CloudEvents type value (reverse-DNS format, e.g., com.example.order.created).
    /// Optional; if not provided, will be auto-generated from service name and event name.
    /// </summary>
    public string? EventType { get; set; }

    public SpasEventAttribute(string name, string version)
    {
        Name = name;
        Version = version;
        // Auto-generate schema path if not explicitly set
        Schema ??= $"schemas/events/{AttributeHelpers.ToKebabCase(name)}.schema.json";
    }
}
