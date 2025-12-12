using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Spas.Sdk.Metadata.Dev;

/// <summary>
/// Extension methods for registering and mapping the dev metadata endpoint.
/// </summary>
public static class MetadataEndpointExtensions
{
    /// <summary>
    /// Adds metadata endpoint services to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configure">Optional configuration action for endpoint options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddMetadataEndpoint(
        this IServiceCollection services,
        Action<MetadataEndpointOptions>? configure = null)
    {
        var options = new MetadataEndpointOptions();
        configure?.Invoke(options);

        services.AddSingleton(options);
        services.AddSingleton<MetadataArchiveWriter>();

        return services;
    }

    /// <summary>
    /// Maps the /_spas/metadata endpoint if environment allows it.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <param name="metadataProvider">Function that provides spas.json content.</param>
    /// <param name="schemasProvider">Function that provides contract schemas.</param>
    /// <returns>The web application for chaining.</returns>
    public static WebApplication MapSpasMetadataEndpoint(
        this WebApplication app,
        Func<object> metadataProvider,
        Func<IDictionary<string, object>> schemasProvider)
    {
        var options = app.Services.GetService<MetadataEndpointOptions>()
            ?? new MetadataEndpointOptions();
        var environment = app.Services.GetRequiredService<IHostEnvironment>();

        if (!options.IsEnvironmentAllowed(environment.EnvironmentName))
        {
            // Map disabled endpoint that returns helpful message
            app.MapGet(options.Path, () => Results.NotFound(new
            {
                message = "Metadata endpoint is disabled in this environment",
                environment = environment.EnvironmentName,
                hint = $"Enable in {options.AllowedEnvironment} mode"
            }));

            return app;
        }

        // Map active endpoint
        app.MapGet(options.Path, async (HttpContext context) =>
        {
            var archiveWriter = app.Services.GetRequiredService<MetadataArchiveWriter>();
            var metadata = metadataProvider();
            var schemas = schemasProvider();

            var archive = await archiveWriter.CreateArchiveAsync(metadata, schemas);

            context.Response.ContentType = "application/zip";
            context.Response.Headers.Append("Content-Disposition",
                "attachment; filename=\"spas-metadata.zip\"");

            await archive.CopyToAsync(context.Response.Body);
        });

        return app;
    }
}
