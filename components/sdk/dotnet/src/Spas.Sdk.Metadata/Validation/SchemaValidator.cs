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
/// Note: PoC implementation provides basic validation.
/// Production would use a full JSON Schema validator library.
/// </summary>
public class SchemaValidator
{
    /// <summary>
    /// Validates a JSON string for basic structure.
    /// </summary>
    public ValidationResult Validate(string json)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            var errors = new List<string>();

            // Check required top-level properties
            if (!root.TryGetProperty("identity", out _))
            {
                errors.Add("Missing required property: identity");
            }

            if (!root.TryGetProperty("contracts", out _))
            {
                errors.Add("Missing required property: contracts");
            }

            // Validate identity structure
            if (root.TryGetProperty("identity", out var identity))
            {
                if (!identity.TryGetProperty("name", out _))
                {
                    errors.Add("Missing required property: identity.name");
                }
                if (!identity.TryGetProperty("version", out _))
                {
                    errors.Add("Missing required property: identity.version");
                }
            }

            return errors.Count > 0
                ? ValidationResult.Failure(errors.ToArray())
                : ValidationResult.Success();
        }
        catch (System.Text.Json.JsonException ex)
        {
            return ValidationResult.Failure($"Invalid JSON: {ex.Message}");
        }
    }

    /// <summary>
    /// Validates data against a JSON schema.
    /// PoC: Basic implementation checking required fields.
    /// Production: Use JSON Schema validator library (e.g., Json.Schema.Net).
    /// </summary>
    public ValidationResult ValidateAgainstSchema(string data, string schema)
    {
        try
        {
            using var dataDoc = System.Text.Json.JsonDocument.Parse(data);
            using var schemaDoc = System.Text.Json.JsonDocument.Parse(schema);

            var errors = new List<string>();

            // Extract required fields from schema
            if (schemaDoc.RootElement.TryGetProperty("required", out var required))
            {
                foreach (var requiredField in required.EnumerateArray())
                {
                    var fieldName = requiredField.GetString();
                    if (fieldName != null && !dataDoc.RootElement.TryGetProperty(fieldName, out _))
                    {
                        errors.Add($"Missing required field: {fieldName}");
                    }
                }
            }

            return errors.Count > 0
                ? ValidationResult.Failure(errors.ToArray())
                : ValidationResult.Success();
        }
        catch (System.Text.Json.JsonException ex)
        {
            return ValidationResult.Failure($"Invalid JSON: {ex.Message}");
        }
    }
}
