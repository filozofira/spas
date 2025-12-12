using Microsoft.AspNetCore.Http;
using Spas.Sdk.Core.Context;
using System.Security.Claims;

namespace Spas.Sdk.Core.Identity;

/// <summary>
/// Provides helper methods for accessing identity information from HTTP context and CloudEvents payloads.
/// </summary>
public static class IdentityAccessors
{
    /// <summary>
    /// Extracts identity claims from the HTTP context and populates SpasContext.
    /// Called automatically by SpasIdentityMiddleware.
    /// </summary>
    /// <param name="httpContext">The current HTTP context.</param>
    internal static void PopulateFromHttpContext(HttpContext httpContext)
    {
        if (httpContext == null)
        {
            return;
        }

        if (httpContext.User == null)
        {
            return;
        }

        if (httpContext.User.Identity == null)
        {
            return;
        }

        if (!httpContext.User.Identity.IsAuthenticated)
        {
            return;
        }

        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            SpasContext.UserId = userId;
        }

        var tenantId = httpContext.User.FindFirst("tenant_id")?.Value
            ?? httpContext.User.FindFirst("tenantId")?.Value;

        if (!string.IsNullOrEmpty(tenantId))
        {
            SpasContext.TenantId = tenantId;
        }
    }

    /// <summary>
    /// Extracts identity claims from a CloudEvents payload (PoC mode).
    /// In PoC, identity is propagated via the event payload since there's no mTLS/SPIFFE.
    /// </summary>
    /// <param name="payload">The event payload containing identity claims.</param>
    public static void PopulateFromEventPayload(dynamic payload)
    {
        if (payload == null)
        {
            return;
        }

        // Try to extract identity from payload
        try
        {
            if (payload.userId != null)
            {
                SpasContext.UserId = payload.userId.ToString();
            }

            if (payload.tenantId != null)
            {
                SpasContext.TenantId = payload.tenantId.ToString();
            }
        }
        catch
        {
            // Ignore errors during identity extraction
            // The payload might not have identity fields
        }
    }

    /// <summary>
    /// Gets the current user ID from SpasContext, or null if not set.
    /// </summary>
    public static string? GetCurrentUserId() => SpasContext.UserId;

    /// <summary>
    /// Gets the current tenant ID from SpasContext, or null if not set.
    /// </summary>
    public static string? GetCurrentTenantId() => SpasContext.TenantId;

    /// <summary>
    /// Checks if the current context has authenticated identity.
    /// </summary>
    /// <returns>True if user ID is set; otherwise false.</returns>
    public static bool IsAuthenticated() => !string.IsNullOrEmpty(SpasContext.UserId);
}
