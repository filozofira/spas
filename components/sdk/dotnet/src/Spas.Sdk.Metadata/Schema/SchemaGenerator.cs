using NJsonSchema;
using System.Reflection;
using System.Text.Json;
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
                var schema = await GenerateSchemaWithDraft07Async(type);
                schemas[eventAttr.Schema] = schema;
            }

            // Check for command attribute
            var commandAttr = type.GetCustomAttribute<SpasCommandAttribute>();
            if (commandAttr != null && !string.IsNullOrEmpty(commandAttr.Schema))
            {
                var schema = await GenerateSchemaWithDraft07Async(type);
                schemas[commandAttr.Schema] = schema;
            }

            // Check for query attribute
            var queryAttr = type.GetCustomAttribute<SpasQueryAttribute>();
            if (queryAttr != null && !string.IsNullOrEmpty(queryAttr.Schema))
            {
                var schema = await GenerateSchemaWithDraft07Async(type);
                schemas[queryAttr.Schema] = schema;
            }
        }

        return schemas;
    }

    /// <summary>
    /// Generates a JSON schema for a specific type.
    /// </summary>
    /// <param name="type">The type to generate a schema for.</param>
    /// <returns>The schema as a JSON object.</returns>
    public async Task<object> GenerateSchemaAsync(Type type)
    {
        return await GenerateSchemaWithDraft07Async(type);
    }

    /// <summary>
    /// Generates JSON Schema and converts $schema to draft-07 for SPAS compliance (ADR-039).
    /// </summary>
    private async Task<object> GenerateSchemaWithDraft07Async(Type type)
    {
        // Generate schema using NJsonSchema (produces draft-04)
        var schema = JsonSchema.FromType(type);
        var schemaJson = schema.ToJson();
        
        // Parse and modify $schema to draft-07
        var schemaObj = JsonSerializer.Deserialize<Dictionary<string, object>>(schemaJson)!;
        schemaObj["$schema"] = JsonElement.Parse("\"http://json-schema.org/draft-07/schema#\"");
        
        return await Task.FromResult(schemaObj);
    }
}
