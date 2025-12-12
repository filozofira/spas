using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Discovery;

namespace Spas.Sdk.Metadata.Extensions;

/// <summary>
/// Extension methods for adding SPAS metadata services to dependency injection.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds SPAS metadata services with auto-discovery configuration.
    /// </summary>
    public static IServiceCollection AddSpasMetadata(
        this IServiceCollection services,
        Action<MetadataDiscoveryOptions>? configureOptions = null)
    {
        var options = new MetadataDiscoveryOptions();
        configureOptions?.Invoke(options);

        services.AddSingleton(options);
        services.AddSingleton<MetadataDiscovery>();

        return services;
    }
}
