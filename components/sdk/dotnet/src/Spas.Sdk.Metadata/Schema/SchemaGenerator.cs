using NJsonSchema;
using System.Reflection;
using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Schema;

/// <summary>
/// Generates JSON schemas from .NET types for SPAS service metadata.
/// </summary>
public class SchemaGenerator
{
    /// <summary>
    /// Generates JSON schemas for all types referenced in SPAS endpoint and event attributes.
    /// </summary>
    /// <param name="assembly">The assembly to scan for types.</param>
    /// <returns>Dictionary mapping schema paths to schema objects.</returns>
    public async Task<IDictionary<string, object>> GenerateSchemasFromAssemblyAsync(Assembly assembly)
    {
        var schemas = new Dictionary<string, object>();

        // Find all types with SPAS attributes
        var typesWithAttributes = assembly.GetTypes()
            .Where(t => t.GetCustomAttributes<SpasEventAttribute>().Any() ||
                       t.GetCustomAttributes<SpasCommandAttribute>().Any() ||
                       t.GetCustomAttributes<SpasQueryAttribute>().Any())
            .ToList();

        foreach (var type in typesWithAttributes)
        {
            // Check for event attribute
            var eventAttr = type.GetCustomAttribute<SpasEventAttribute>();
            if (eventAttr != null && !string.IsNullOrEmpty(eventAttr.Schema))
            {
                var schema = JsonSchema.FromType(type);
                schemas[eventAttr.Schema] = schema.ToJson();
            }

            // Check for command attribute
            var commandAttr = type.GetCustomAttribute<SpasCommandAttribute>();
            if (commandAttr != null && !string.IsNullOrEmpty(commandAttr.Schema))
            {
                var schema = JsonSchema.FromType(type);
                schemas[commandAttr.Schema] = schema.ToJson();
            }

            // Check for query attribute
            var queryAttr = type.GetCustomAttribute<SpasQueryAttribute>();
            if (queryAttr != null && !string.IsNullOrEmpty(queryAttr.Schema))
            {
                var schema = JsonSchema.FromType(type);
                schemas[queryAttr.Schema] = schema.ToJson();
            }
        }

        return await Task.FromResult(schemas);
    }

    /// <summary>
    /// Generates a JSON schema for a specific type.
    /// </summary>
    /// <param name="type">The type to generate a schema for.</param>
    /// <returns>The schema as a JSON object.</returns>
    public async Task<object> GenerateSchemaAsync(Type type)
    {
        var schema = JsonSchema.FromType(type);
        return await Task.FromResult(schema.ToJson());
    }
}
