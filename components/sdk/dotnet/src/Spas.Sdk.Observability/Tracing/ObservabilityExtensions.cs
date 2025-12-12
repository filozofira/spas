using Microsoft.AspNetCore.Builder;

namespace Spas.Sdk.Observability.Tracing;

/// <summary>
/// Extension methods for registering SPAS observability middleware
/// </summary>
public static class ObservabilityExtensions
{
    /// <summary>
    /// Adds the SPAS tracelog middleware to the application pipeline.
    /// This middleware logs request/response timing with trace and correlation identifiers.
    /// </summary>
    /// <param name="app">The application builder</param>
    /// <returns>The application builder for chaining</returns>
    /// <exception cref="ArgumentNullException">Thrown when app is null</exception>
    public static IApplicationBuilder UseSpasTracelog(this IApplicationBuilder app)
    {
        if (app == null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        return app.UseMiddleware<TracelogMiddleware>();
    }
}
