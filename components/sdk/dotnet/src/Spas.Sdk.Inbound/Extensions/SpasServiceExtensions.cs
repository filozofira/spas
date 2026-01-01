using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Spas.Sdk.Inbound.Extensions;

public static class SpasServiceExtensions
{
    public static IServiceCollection AddSpasHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks();
        return services;
    }

    public static WebApplication UseSpasHealthChecks(this WebApplication app)
    {
        app.MapSpasHealthChecks();
        return app;
    }
}
