using System.Text.Json;
using System.Text.Json.Serialization;

namespace Spas.Sdk.Core.Serialization;

/// <summary>
/// Factory for creating consistent JsonSerializerOptions across all SPAS SDK components.
/// Ensures standardized JSON serialization behavior for metadata, events, and configuration.
/// </summary>
public static class JsonSerializerOptionsFactory
{
    /// <summary>
    /// Creates JsonSerializerOptions with SPAS-standard configuration.
    /// </summary>
    /// <returns>Configured JsonSerializerOptions instance.</returns>
    public static JsonSerializerOptions Create()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false,
            PropertyNameCaseInsensitive = true,
            AllowTrailingCommas = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        // Add standard converters
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));

        return options;
    }

    /// <summary>
    /// Creates JsonSerializerOptions with indented formatting for human-readable output.
    /// Useful for generating spas.json files or debug output.
    /// </summary>
    /// <returns>Configured JsonSerializerOptions instance with indentation.</returns>
    public static JsonSerializerOptions CreateIndented()
    {
        var options = Create();
        options.WriteIndented = true;
        return options;
    }

    /// <summary>
    /// Singleton instance for standard serialization (non-indented).
    /// Use this for performance-sensitive scenarios to avoid repeated allocations.
    /// </summary>
    public static JsonSerializerOptions Default { get; } = Create();

    /// <summary>
    /// Singleton instance for indented serialization.
    /// Use this for human-readable output like metadata files.
    /// </summary>
    public static JsonSerializerOptions Indented { get; } = CreateIndented();
}
