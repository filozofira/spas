using System.Diagnostics;

namespace Spas.Sdk.Core.Tracing;

/// <summary>
/// Manages W3C Trace Context propagation for SPAS services.
/// </summary>
public static class SpasTrace
{
    /// <summary>
    /// Gets the current trace ID from the active Activity, or generates a new one if none exists.
    /// </summary>
    public static string TraceId
    {
        get
        {
            var activity = Activity.Current;
            if (activity != null && !string.IsNullOrEmpty(activity.TraceId.ToString()))
            {
                return activity.TraceId.ToString();
            }

            // Generate a new trace ID if no activity is present
            return ActivityTraceId.CreateRandom().ToString();
        }
    }

    /// <summary>
    /// Gets the current span ID from the active Activity, or generates a new one if none exists.
    /// </summary>
    public static string SpanId
    {
        get
        {
            var activity = Activity.Current;
            if (activity != null && !string.IsNullOrEmpty(activity.SpanId.ToString()))
            {
                return activity.SpanId.ToString();
            }

            // Generate a new span ID if no activity is present
            return ActivitySpanId.CreateRandom().ToString();
        }
    }

    /// <summary>
    /// Gets the current parent span ID from the active Activity, or null if none exists.
    /// </summary>
    public static string? ParentSpanId
    {
        get
        {
            var activity = Activity.Current;
            if (activity?.ParentSpanId != null)
            {
                return activity.ParentSpanId.ToString();
            }

            return null;
        }
    }

    /// <summary>
    /// Gets the W3C traceparent header value for the current trace context.
    /// Format: 00-{trace-id}-{span-id}-{trace-flags}
    /// </summary>
    public static string TraceParent
    {
        get
        {
            var activity = Activity.Current;
            if (activity != null)
            {
                // W3C Trace Context format: version-traceId-spanId-flags
                var flags = activity.ActivityTraceFlags == ActivityTraceFlags.Recorded ? "01" : "00";
                return $"00-{activity.TraceId}-{activity.SpanId}-{flags}";
            }

            // Generate a minimal traceparent if no activity exists
            var traceId = ActivityTraceId.CreateRandom();
            var spanId = ActivitySpanId.CreateRandom();
            return $"00-{traceId}-{spanId}-00";
        }
    }

    /// <summary>
    /// Creates a new Activity for outbound requests with W3C Trace Context.
    /// </summary>
    /// <param name="operationName">The name of the operation being traced.</param>
    /// <returns>A new Activity instance, or null if activity creation is disabled.</returns>
    public static Activity? StartActivity(string operationName)
    {
        var activity = new Activity(operationName);
        activity.Start();
        return activity;
    }

    /// <summary>
    /// Sets the trace parent for the current context by starting a new Activity with the parsed trace context.
    /// </summary>
    /// <param name="traceParent">The W3C traceparent header value.</param>
    public static void SetTraceParent(string? traceParent)
    {
        if (string.IsNullOrEmpty(traceParent))
        {
            return;
        }

        // Parse W3C Trace Context format: 00-{trace-id}-{span-id}-{flags}
        var parts = traceParent.Split('-');
        if (parts.Length == 4)
        {
            var traceId = ActivityTraceId.CreateFromString(parts[1].AsSpan());
            var spanId = ActivitySpanId.CreateFromString(parts[2].AsSpan());
            
            var activity = new Activity("SpasRequest");
            activity.SetParentId(traceId, spanId);
            activity.Start();
        }
    }

    /// <summary>
    /// Clears the current trace context by stopping the active Activity.
    /// </summary>
    public static void Clear()
    {
        Activity.Current?.Stop();
    }
}
