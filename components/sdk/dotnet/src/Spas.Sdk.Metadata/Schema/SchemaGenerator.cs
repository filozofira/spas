using NJsonSchema;
using NJsonSchema.Generation;
using NJsonSchema.NewtonsoftJson.Generation;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;
using Spas.Sdk.Metadata.Attributes;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

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
    /// <returns>The schema as a JSON string.</returns>
    public async Task<object> GenerateSchemaAsync(Type type)
    {
        return await GenerateSchemaWithDraft07Async(type);
    }

    /// <summary>
    /// Generates JSON Schema and converts $schema to draft-07 for SPAS compliance (ADR-039).
    /// Returns the schema as a JSON string per ADR-039 (JSON Schema draft-07 standard).
    /// Uses camelCase property names to match runtime JSON serialization.
    /// </summary>
    private async Task<object> GenerateSchemaWithDraft07Async(Type type)
    {
        // Configure NJsonSchema with Newtonsoft settings for proper required/nullable generation
        // NJsonSchema's Newtonsoft integration provides DefaultReferenceTypeNullHandling which correctly
        // marks non-nullable reference types as required (FR-001) and nullable types appropriately (FR-003)
        var settings = new NewtonsoftJsonSchemaGeneratorSettings
        {
            DefaultReferenceTypeNullHandling = ReferenceTypeNullHandling.NotNull,
            SchemaType = SchemaType.JsonSchema
        };
        settings.SerializerSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver()
        };
        
        // Generate schema using NJsonSchema
        var schema = JsonSchema.FromType(type, settings);
        var schemaJson = schema.ToJson();

        var schemaNode = JsonNode.Parse(schemaJson)?.AsObject()
            ?? throw new InvalidOperationException("Failed to parse generated schema JSON.");

        NormalizeSchemaPropertyNamesToCamelCase(schemaNode);
        AddRequiredArrayFromNonNullableProperties(schemaNode);
        schemaNode["$schema"] = "http://json-schema.org/draft-07/schema#";

        var jsonString = schemaNode.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
        return await Task.FromResult(jsonString);
    }

    /// <summary>
    /// Adds a "required" array containing all non-nullable properties (FR-001).
    /// A property is considered required if its type is NOT an array containing "null"
    /// and does NOT use oneOf/anyOf with a null type option.
    /// </summary>
    private static void AddRequiredArrayFromNonNullableProperties(JsonNode node)
    {
        if (node is not JsonObject obj) return;

        if (obj.TryGetPropertyValue("properties", out var propertiesNode) && propertiesNode is JsonObject propertiesObj)
        {
            var requiredProperties = new JsonArray();

            foreach (var kvp in propertiesObj)
            {
                var propName = kvp.Key;
                var propSchema = kvp.Value;

                if (propSchema is JsonObject propObj)
                {
                    var isNullable = IsPropertyNullable(propObj);

                    if (!isNullable)
                    {
                        requiredProperties.Add(propName);
                    }
                }
            }

            if (requiredProperties.Count > 0)
            {
                obj["required"] = requiredProperties;
            }

            // Recursively process nested objects
            foreach (var kvp in propertiesObj)
            {
                if (kvp.Value is JsonObject propObj)
                {
                    AddRequiredArrayFromNonNullableProperties(propObj);
                }
            }
        }

        // Process definitions/schemas
        if (obj.TryGetPropertyValue("definitions", out var definitionsNode) && definitionsNode is JsonObject definitionsObj)
        {
            foreach (var kvp in definitionsObj)
            {
                AddRequiredArrayFromNonNullableProperties(kvp.Value!);
            }
        }
    }

    /// <summary>
    /// Determines if a property schema represents a nullable type.
    /// Handles multiple nullable representations:
    /// - "type": ["null", "string"] or ["string", "null"]
    /// - "oneOf": [{"type": "null"}, {...}] (used for nullable complex types)
    /// - "anyOf": [{"type": "null"}, {...}]
    /// </summary>
    private static bool IsPropertyNullable(JsonObject propObj)
    {
        // Check for type array containing "null" (e.g., "type": ["null", "string"])
        if (propObj.TryGetPropertyValue("type", out var typeNode))
        {
            if (typeNode is JsonArray typeArray)
            {
                if (typeArray.Any(t => t?.GetValue<string>() == "null"))
                {
                    return true;
                }
            }
        }

        // Check for oneOf with null type (used for nullable complex types like Address?)
        if (propObj.TryGetPropertyValue("oneOf", out var oneOfNode) && oneOfNode is JsonArray oneOfArray)
        {
            if (HasNullTypeInArray(oneOfArray))
            {
                return true;
            }
        }

        // Check for anyOf with null type
        if (propObj.TryGetPropertyValue("anyOf", out var anyOfNode) && anyOfNode is JsonArray anyOfArray)
        {
            if (HasNullTypeInArray(anyOfArray))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Checks if a oneOf/anyOf array contains a {"type": "null"} option.
    /// </summary>
    private static bool HasNullTypeInArray(JsonArray schemaArray)
    {
        foreach (var item in schemaArray)
        {
            if (item is JsonObject itemObj)
            {
                if (itemObj.TryGetPropertyValue("type", out var typeNode))
                {
                    if (typeNode is JsonValue typeValue && typeValue.TryGetValue<string>(out var typeStr) && typeStr == "null")
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static void NormalizeSchemaPropertyNamesToCamelCase(JsonNode node)
    {
        if (node is JsonObject obj)
        {
            if (obj.TryGetPropertyValue("properties", out var propertiesNode) && propertiesNode is JsonObject propertiesObj)
            {
                var renames = propertiesObj
                    .Select(kvp => new { OldName = kvp.Key, NewName = JsonNamingPolicy.CamelCase.ConvertName(kvp.Key) })
                    .Where(x => x.NewName != x.OldName)
                    .ToList();

                foreach (var rename in renames)
                {
                    if (propertiesObj.TryGetPropertyValue(rename.OldName, out var value))
                    {
                        propertiesObj.Remove(rename.OldName);
                        propertiesObj[rename.NewName] = value;
                    }
                }

                if (obj.TryGetPropertyValue("required", out var requiredNode) && requiredNode is JsonArray requiredArray)
                {
                    for (var i = 0; i < requiredArray.Count; i++)
                    {
                        if (requiredArray[i] is JsonValue requiredValue && requiredValue.TryGetValue<string>(out var requiredName))
                        {
                            requiredArray[i] = JsonNamingPolicy.CamelCase.ConvertName(requiredName);
                        }
                    }
                }
            }

            foreach (var child in obj.Select(kvp => kvp.Value).Where(v => v != null))
            {
                NormalizeSchemaPropertyNamesToCamelCase(child!);
            }
        }
        else if (node is JsonArray arr)
        {
            foreach (var child in arr.Where(v => v != null))
            {
                NormalizeSchemaPropertyNamesToCamelCase(child!);
            }
        }
    }
}
