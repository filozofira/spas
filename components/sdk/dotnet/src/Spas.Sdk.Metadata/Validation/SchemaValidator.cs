using System.Reflection;
using System.Text.Json;
using Json.Schema;

namespace Spas.Sdk.Metadata.Validation;

/// <summary>
/// Result of schema validation.
/// </summary>
public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ValidationResult Success() => new() { IsValid = true };

    public static ValidationResult Failure(params string[] errors) => new()
    {
        IsValid = false,
        Errors = errors.ToList()
    };
}

/// <summary>
/// Validates SPAS metadata against JSON schema.
/// Validates generated spas.json against the design-time schema.
/// </summary>
public class SchemaValidator
{
    private static readonly Lazy<JsonSchema> DesignTimeSchema = new(LoadDesignTimeSchema);

    /// <summary>
    /// Validates a SPAS design-time metadata JSON string (spas.json) against the embedded
    /// design-time schema.
    /// </summary>
    public ValidationResult Validate(string json)
    {
        return ValidateAgainstSchema(json, DesignTimeSchema.Value);
    }

    /// <summary>
    /// Validates data against a JSON schema.
    /// </summary>
    public ValidationResult ValidateAgainstSchema(string data, string schema)
    {
        return ValidateAgainstSchema(data, JsonSchema.FromText(schema));
    }

    private static ValidationResult ValidateAgainstSchema(string data, JsonSchema schema)
    {
        try
        {
            using var dataDoc = JsonDocument.Parse(data);
            var validationResult = schema.Evaluate(
                dataDoc,
                new EvaluationOptions { OutputFormat = OutputFormat.List });

            if (validationResult.IsValid)
            {
                return ValidationResult.Success();
            }

            var errors = validationResult.Errors?.Select(e => e.ToString()).ToList() ?? new List<string>();

            if (errors.Count == 0)
            {
                errors.Add(validationResult.ToString() ?? "Schema validation failed (no error details returned).");
            }

            return ValidationResult.Failure(errors.ToArray());
        }
        catch (JsonException ex)
        {
            return ValidationResult.Failure($"Invalid JSON: {ex.Message}");
        }
        catch (Exception ex)
        {
            return ValidationResult.Failure($"Schema validation failed: {ex.Message}");
        }
    }

    private static JsonSchema LoadDesignTimeSchema()
    {
        var assembly = typeof(SchemaValidator).Assembly;
        var resourceName = assembly
            .GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith("design-time-metadata-v1.schema.json", StringComparison.OrdinalIgnoreCase));

        if (resourceName == null)
        {
            throw new InvalidOperationException(
                "Embedded schema resource 'design-time-metadata-v1.schema.json' not found in Spas.Sdk.Metadata assembly.");
        }

        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' could not be opened.");

        using var reader = new StreamReader(stream);
        var schemaJson = reader.ReadToEnd();
        return JsonSchema.FromText(schemaJson);
    }
}
