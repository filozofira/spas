using Spas.Sdk.Metadata.Validation;

namespace Spas.Sdk.Metadata.Diagnostics;

/// <summary>
/// Diagnostic helpers for metadata validation.
/// </summary>
public static class Diagnostics
{
    /// <summary>
    /// Formats validation errors into a human-readable message.
    /// </summary>
    public static string FormatValidationErrors(ValidationResult result)
    {
        if (result.IsValid)
        {
            return "Validation successful: No errors found.";
        }

        var errors = string.Join(Environment.NewLine, result.Errors.Select(e => $"  - {e}"));
        return $"Validation failed with {result.Errors.Count} error(s):{Environment.NewLine}{errors}";
    }

    /// <summary>
    /// Throws an exception if validation fails.
    /// </summary>
    public static void ThrowIfInvalid(ValidationResult result, string context = "Validation")
    {
        if (!result.IsValid)
        {
            var message = FormatValidationErrors(result);
            throw new InvalidOperationException($"{context}: {message}");
        }
    }

    /// <summary>
    /// Logs validation errors to console.
    /// </summary>
    public static void LogValidationErrors(ValidationResult result)
    {
        if (!result.IsValid)
        {
            Console.Error.WriteLine(FormatValidationErrors(result));
        }
    }

    /// <summary>
    /// Creates a diagnostic report for metadata composition.
    /// </summary>
    public static string CreateDiagnosticReport(
        string serviceName,
        int commandCount,
        int queryCount,
        int eventCount,
        ValidationResult validationResult)
    {
        var status = validationResult.IsValid ? "✓ VALID" : "✗ INVALID";

        return $"""
            SPAS Metadata Diagnostic Report
            ================================
            Service: {serviceName}
            Status: {status}
            
            Contracts:
              - Commands: {commandCount}
              - Queries: {queryCount}
              - Events: {eventCount}
            
            Validation:
            {FormatValidationErrors(validationResult)}
            """;
    }
}
