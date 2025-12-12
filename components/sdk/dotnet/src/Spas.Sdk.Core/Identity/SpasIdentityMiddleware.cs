using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Spas.Sdk.Core.Identity;

/// <summary>
/// Middleware that automatically populates SpasContext with identity information from HTTP context.
/// This should be registered early in the request pipeline to ensure identity is available throughout the request.
/// </summary>
public class SpasIdentityMiddleware
{
    private readonly RequestDelegate _next;

    public SpasIdentityMiddleware(RequestDelegate next)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Populate SpasContext with identity from HTTP context
        IdentityAccessors.PopulateFromHttpContext(context);

        await _next(context);
    }
}

/// <summary>
/// Extension methods for registering SpasIdentityMiddleware.
/// </summary>
public static class SpasIdentityMiddlewareExtensions
{
    /// <summary>
    /// Adds SPAS identity middleware to the application pipeline.
    /// This middleware automatically populates SpasContext with user and tenant information from the HTTP context.
    /// Should be called early in the pipeline, typically before UseSpasTracelog().
    /// </summary>
    /// <param name="app">The application builder.</param>
    /// <returns>The application builder for chaining.</returns>
    public static IApplicationBuilder UseSpasIdentity(this IApplicationBuilder app)
    {
        return app.UseMiddleware<SpasIdentityMiddleware>();
    }
}
