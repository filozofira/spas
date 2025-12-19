using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;

namespace Spas.Sdk.Observability.Tracing;

/// <summary>
/// Middleware that logs request/response timing with trace and correlation identifiers.
/// Also creates Activity spans for distributed tracing (Zipkin/OpenTelemetry).
/// </summary>
public class TracelogMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TracelogMiddleware> _logger;
    private static readonly ActivitySource ActivitySource = new("Spas.Sdk.Observability", "1.0.0");

    public TracelogMiddleware(RequestDelegate next, ILogger<TracelogMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Create Activity/span for distributed tracing
        using var activity = ActivitySource.StartActivity("HTTP Request", ActivityKind.Server);

        var stopwatch = Stopwatch.StartNew();
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? "/";
        var host = context.Request.Host.ToString();

        // Set span tags for Zipkin/OpenTelemetry
        activity?.SetTag("http.method", method);
        activity?.SetTag("http.url", path);
        activity?.SetTag("http.host", host);
        activity?.SetTag("http.scheme", context.Request.Scheme);

        // Add cloudevents.type tag if this is an event callback from sidecar
        if (context.Request.Headers.TryGetValue("ce-type", out var ceType) && !string.IsNullOrEmpty(ceType))
        {
            activity?.SetTag("cloudevents.type", ceType.ToString());
        }

        // Add correlation context as span tags
        if (!string.IsNullOrEmpty(SpasContext.CorrelationId))
        {
            activity?.SetTag("correlation.id", SpasContext.CorrelationId);
        }

        if (!string.IsNullOrEmpty(SpasContext.UserId))
        {
            activity?.SetTag("user.id", SpasContext.UserId);
        }

        if (!string.IsNullOrEmpty(SpasContext.TenantId))
        {
            activity?.SetTag("tenant.id", SpasContext.TenantId);
        }

        try
        {
            await _next(context);
            stopwatch.Stop();

            // Set response tags
            activity?.SetTag("http.status_code", context.Response.StatusCode);
            activity?.SetStatus(
                context.Response.StatusCode >= 400
                    ? ActivityStatusCode.Error
                    : ActivityStatusCode.Ok
            );

            LogRequest(method, path, context.Response.StatusCode, stopwatch.ElapsedMilliseconds, null);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            // Mark span as error
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.SetTag("error", true);
            activity?.SetTag("error.type", ex.GetType().FullName);
            activity?.SetTag("error.message", ex.Message);

            LogRequest(method, path, context.Response.StatusCode, stopwatch.ElapsedMilliseconds, ex);
            throw;
        }
    }

    private void LogRequest(string method, string path, int statusCode, long latencyMs, Exception? exception)
    {
        var traceId = ExtractTraceId(SpasTrace.TraceParent);
        var correlationId = SpasContext.CorrelationId;
        var userId = SpasContext.UserId;
        var tenantId = SpasContext.TenantId;

        var logMessage = FormatLogMessage(method, path, statusCode, latencyMs, traceId, correlationId, userId, tenantId, exception);

        if (exception != null)
        {
            _logger.LogError(exception, logMessage);
        }
        else
        {
            _logger.LogInformation(logMessage);
        }
    }

    private static string FormatLogMessage(
        string method,
        string path,
        int statusCode,
        long latencyMs,
        string? traceId,
        string? correlationId,
        string? userId,
        string? tenantId,
        Exception? exception)
    {
        var parts = new List<string>
        {
            $"{method} {path}",
            $"Status={statusCode}",
            $"Latency={latencyMs}ms"
        };

        if (!string.IsNullOrEmpty(traceId))
        {
            parts.Add($"TraceId={traceId}");
        }

        if (!string.IsNullOrEmpty(correlationId))
        {
            parts.Add($"CorrelationId={correlationId}");
        }

        if (!string.IsNullOrEmpty(userId))
        {
            parts.Add($"UserId={userId}");
        }

        if (!string.IsNullOrEmpty(tenantId))
        {
            parts.Add($"TenantId={tenantId}");
        }

        if (exception != null)
        {
            parts.Add($"Error={exception.Message}");
        }

        return string.Join(" | ", parts);
    }

    private static string? ExtractTraceId(string? traceParent)
    {
        if (string.IsNullOrEmpty(traceParent))
        {
            return null;
        }

        // W3C Trace Context format: 00-{trace-id}-{span-id}-{flags}
        var parts = traceParent.Split('-');
        if (parts.Length >= 2)
        {
            return parts[1]; // Return trace-id
        }

        return null;
    }
}
