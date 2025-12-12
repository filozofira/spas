using Microsoft.Extensions.Logging;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;

namespace Spas.Sdk.Core.Logging;

/// <summary>
/// Extension methods for ILogger to simplify logging with SPAS context.
/// </summary>
public static class LoggingExtensions
{
    /// <summary>
    /// Logs a message with automatic inclusion of trace and correlation context.
    /// </summary>
    /// <param name="logger">The logger instance.</param>
    /// <param name="logLevel">The log level.</param>
    /// <param name="message">The log message.</param>
    public static void LogWithContext(this ILogger logger, LogLevel logLevel, string message)
    {
        using (logger.BeginScope(new Dictionary<string, object>
        {
            ["TraceId"] = SpasTrace.TraceId,
            ["SpanId"] = SpasTrace.SpanId,
            ["CorrelationId"] = SpasContext.CorrelationId ?? string.Empty,
            ["UserId"] = SpasContext.UserId ?? string.Empty,
            ["TenantId"] = SpasContext.TenantId ?? string.Empty
        }))
        {
            logger.Log(logLevel, message);
        }
    }

    /// <summary>
    /// Logs an information message with SPAS context.
    /// </summary>
    public static void LogInformationWithContext(this ILogger logger, string message)
    {
        logger.LogWithContext(LogLevel.Information, message);
    }

    /// <summary>
    /// Logs a warning message with SPAS context.
    /// </summary>
    public static void LogWarningWithContext(this ILogger logger, string message)
    {
        logger.LogWithContext(LogLevel.Warning, message);
    }

    /// <summary>
    /// Logs an error message with SPAS context.
    /// </summary>
    public static void LogErrorWithContext(this ILogger logger, string message, Exception? exception = null)
    {
        using (logger.BeginScope(new Dictionary<string, object>
        {
            ["TraceId"] = SpasTrace.TraceId,
            ["SpanId"] = SpasTrace.SpanId,
            ["CorrelationId"] = SpasContext.CorrelationId ?? string.Empty,
            ["UserId"] = SpasContext.UserId ?? string.Empty,
            ["TenantId"] = SpasContext.TenantId ?? string.Empty
        }))
        {
            if (exception != null)
            {
                logger.LogError(exception, message);
            }
            else
            {
                logger.LogError(message);
            }
        }
    }

    /// <summary>
    /// Creates a logging scope with SPAS trace and correlation context.
    /// </summary>
    public static IDisposable? BeginSpasScope(this ILogger logger)
    {
        return logger.BeginScope(new Dictionary<string, object>
        {
            ["TraceId"] = SpasTrace.TraceId,
            ["SpanId"] = SpasTrace.SpanId,
            ["CorrelationId"] = SpasContext.CorrelationId ?? string.Empty,
            ["UserId"] = SpasContext.UserId ?? string.Empty,
            ["TenantId"] = SpasContext.TenantId ?? string.Empty
        });
    }
}
