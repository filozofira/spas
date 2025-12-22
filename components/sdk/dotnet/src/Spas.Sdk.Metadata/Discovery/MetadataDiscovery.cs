using System.Reflection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Discovery;

/// <summary>
/// Options for metadata auto-discovery.
/// </summary>
public class MetadataDiscoveryOptions
{
    /// <summary>
    /// Assemblies to scan for SPAS event attributes.
    /// Default: entry assembly.
    /// </summary>
    public List<Assembly> AssembliesToScan { get; set; } = new();

    /// <summary>
    /// Whether to auto-generate schema references if not explicitly provided.
    /// Default: true (generates schemas/{TypeName}.schema.json).
    /// </summary>
    public bool AutoGenerateSchemaReferences { get; set; } = true;

    /// <summary>
    /// Base path for auto-generated schema references.
    /// Default: "schemas/events/" for event schemas.
    /// </summary>
    public string SchemaBasePath { get; set; } = "schemas/events/";
}

/// <summary>
/// Discovers SPAS contract metadata from attributes on event types.
/// Endpoint discovery is handled via extension methods in the application layer.
/// </summary>
public class MetadataDiscovery
{
    private readonly MetadataDiscoveryOptions _options;

    public MetadataDiscovery(MetadataDiscoveryOptions? options = null)
    {
        _options = options ?? new MetadataDiscoveryOptions();

        if (_options.AssembliesToScan.Count == 0)
        {
            _options.AssembliesToScan.Add(Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly());
        }
    }

    /// <summary>
    /// Discovers event contracts from types decorated with SpasEventAttribute.
    /// </summary>
    public ServiceContracts DiscoverEvents()
    {
        var builder = new ContractsBuilder();
        DiscoverEventsFromAssemblies(builder);
        return builder.Build();
    }

    /// <summary>
    /// Discovers event contracts from types decorated with SpasEventAttribute.
    /// Event names are normalized to kebab-case for language-neutral interoperability.
    /// </summary>
    private void DiscoverEventsFromAssemblies(ContractsBuilder builder)
    {
        foreach (var assembly in _options.AssembliesToScan)
        {
            try
            {
                var eventTypes = assembly.GetTypes()
                    .Where(t => t.GetCustomAttribute<SpasEventAttribute>() != null);

                foreach (var eventType in eventTypes)
                {
                    var eventAttr = eventType.GetCustomAttribute<SpasEventAttribute>();
                    if (eventAttr != null)
                    {
                        // Normalize event name to kebab-case for cross-SDK interoperability
                        // e.g., "OrderCreated" → "order-created"
                        var normalizedName = AttributeHelpers.ToKebabCase(eventAttr.Name);
                        var schema = eventAttr.Schema ?? GenerateSchemaReference(eventAttr.Name);
                        builder.AddEvent(normalizedName, eventAttr.Version, schema, description: eventAttr.Description);
                    }
                }
            }
            catch (ReflectionTypeLoadException)
            {
                // Skip assemblies that can't be loaded
                continue;
            }
        }
    }

    /// <summary>
    /// Generates a schema reference path for a contract.
    /// </summary>
    private string GenerateSchemaReference(string contractName)
    {
        if (!_options.AutoGenerateSchemaReferences)
        {
            return string.Empty;
        }

        var schemaName = AttributeHelpers.ToKebabCase(contractName) + ".schema.json";

        return _options.SchemaBasePath + schemaName;
    }
}
