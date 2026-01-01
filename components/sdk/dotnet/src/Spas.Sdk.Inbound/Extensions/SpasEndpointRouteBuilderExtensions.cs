using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;
using System.Threading.Tasks;

namespace Spas.Sdk.Inbound.Extensions;

public static class SpasEndpointRouteBuilderExtensions
{
    public static IEndpointConventionBuilder MapSpasHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/_spas/health/live", async context =>
        {
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"status\":\"UP\"}");
        }).AllowAnonymous();

        return endpoints.MapHealthChecks("/_spas/health/ready", new HealthCheckOptions
        {
            ResponseWriter = WriteResponse
        }).AllowAnonymous();
    }

    private static Task WriteResponse(HttpContext context, HealthReport result)
    {
        context.Response.ContentType = "application/json";

        var status = result.Status == HealthStatus.Unhealthy ? "DOWN" : "UP";
        var json = JsonSerializer.Serialize(new { status });

        return context.Response.WriteAsync(json);
    }
}
