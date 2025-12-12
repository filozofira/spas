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
}
