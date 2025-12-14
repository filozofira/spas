using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Discovery;
using Spas.Sdk.Metadata.Models;
using System.Reflection;

namespace Spas.Sdk.Metadata.Extensions;

/// <summary>
/// Extension methods for WebApplication metadata discovery.
/// This class uses reflection to access ASP.NET Core types without requiring direct references.
/// Import this namespace in your ASP.NET Core application to enable auto-discovery.
/// </summary>
public static class WebApplicationDiscoveryExtensions
{
    /// <summary>
    /// Discovers SPAS metadata from configured endpoints and events.
    /// Call this after configuring all endpoints but before app.Run().
    /// </summary>
    /// <param name="app">The WebApplication instance (passed as object to avoid direct dependency)</param>
    /// <returns>ServiceContracts containing discovered commands, queries, and events</returns>
    public static ServiceContracts DiscoverSpasMetadata(this object app)
    {
        if (app == null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        var builder = new ContractsBuilder();

        // Get the Services property to access dependency injection container
        var servicesProperty = app.GetType().GetProperty("Services");
        if (servicesProperty == null)
        {
            throw new InvalidOperationException("Unable to access Services property. Ensure this is called on a WebApplication instance.");
        }

        var services = servicesProperty.GetValue(app) as IServiceProvider;
        if (services == null)
        {
            throw new InvalidOperationException("Services property returned null.");
        }

        // Get MetadataDiscovery from DI to discover events
        var metadataDiscoveryType = typeof(MetadataDiscovery);
        var discovery = services.GetService(metadataDiscoveryType) as MetadataDiscovery;

        if (discovery == null)
        {
            throw new InvalidOperationException(
                "MetadataDiscovery not found in DI container. Call AddSpasMetadata() during service configuration.");
        }

        // Discover events from assemblies
        var eventContracts = discovery.DiscoverEvents();
        foreach (var evt in eventContracts.Events)
        {
            builder.AddEvent(evt.Type, evt.Version, evt.SchemaRef);
        }

        // Discover endpoints - access them directly from WebApplication's DataSources property
        try
        {
            DiscoverEndpointsFromWebApplication(app, builder);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to discover endpoints: {ex.Message}. Ensure DiscoverSpasMetadata() is called after all endpoints are mapped.", ex);
        }

        return builder.Build();
    }

    private static void DiscoverEndpointsFromWebApplication(object app, ContractsBuilder builder)
    {
        // WebApplication has a property called "DataSources" which is a list of EndpointDataSource
        // Try to access it via reflection
        var dataSourcesProperty = app.GetType().GetProperty("DataSources", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        if (dataSourcesProperty == null)
        {
            throw new InvalidOperationException("DataSources property not found on WebApplication");
        }

        var dataSources = dataSourcesProperty.GetValue(app) as System.Collections.IEnumerable;
        if (dataSources == null)
        {
            throw new InvalidOperationException("DataSources property is null");
        }

        foreach (var dataSource in dataSources)
        {
            // Get the Endpoints property from the base type to avoid ambiguity
            // Find the EndpointDataSource base type
            var baseType = dataSource.GetType().BaseType;
            while (baseType != null && baseType.Name != "EndpointDataSource")
            {
                baseType = baseType.BaseType;
            }

            PropertyInfo? endpointsProperty = null;
            if (baseType != null)
            {
                endpointsProperty = baseType.GetProperty("Endpoints", BindingFlags.Public | BindingFlags.Instance);
            }

            // If not found on base, try on the actual type with DeclaredOnly flag
            if (endpointsProperty == null)
            {
                endpointsProperty = dataSource.GetType().GetProperty("Endpoints", BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
            }

            if (endpointsProperty == null)
            {
                continue; // Skip data sources without Endpoints property
            }

            var endpoints = endpointsProperty.GetValue(dataSource) as System.Collections.IEnumerable;
            if (endpoints == null)
            {
                continue; // Skip if Endpoints is null
            }

            // Process each endpoint
            foreach (var endpoint in endpoints)
            {
                ProcessEndpoint(endpoint, builder);
            }
        }
    }

    private static void DiscoverEndpoints(IServiceProvider services, ContractsBuilder builder)
    {
        // Use reflection to find EndpointDataSource without direct reference
        // This type is from Microsoft.AspNetCore.Routing
        var endpointDataSourceType = AppDomain.CurrentDomain.GetAssemblies()
            .Where(a => !a.IsDynamic)
            .SelectMany(a =>
            {
                try { return a.GetTypes(); }
                catch { return Array.Empty<Type>(); }
            })
            .FirstOrDefault(t => t.FullName == "Microsoft.AspNetCore.Routing.EndpointDataSource");

        if (endpointDataSourceType == null)
        {
            Console.WriteLine("Warning: EndpointDataSource type not found");
            return; // ASP.NET Core routing not available
        }

        Console.WriteLine($"Found EndpointDataSource type: {endpointDataSourceType.FullName}");

        // Get all registered endpoint data sources
        var enumerableType = typeof(IEnumerable<>).MakeGenericType(endpointDataSourceType);
        var endpointDataSources = services.GetService(enumerableType);

        if (endpointDataSources == null)
        {
            Console.WriteLine("Warning: No endpoint data sources found in DI (IEnumerable<EndpointDataSource>)");

            // Try getting a single EndpointDataSource
            var singleDataSource = services.GetService(endpointDataSourceType);
            if (singleDataSource != null)
            {
                Console.WriteLine($"Found single EndpointDataSource: {singleDataSource.GetType().FullName}");
                endpointDataSources = new[] { singleDataSource };
            }
            else
            {
                Console.WriteLine("No single EndpointDataSource found either");
                return;
            }
        }
        else
        {
            Console.WriteLine($"Found IEnumerable<EndpointDataSource>");
        }

        int dataSourceCount = 0;
        int endpointCount = 0;
        int discoveredCount = 0;

        // Iterate through all endpoint data sources
        foreach (var dataSource in (System.Collections.IEnumerable)endpointDataSources)
        {
            dataSourceCount++;
            Console.WriteLine($"Data source #{dataSourceCount}: {dataSource.GetType().FullName}");

            // Get the Endpoints property
            var endpointsProperty = dataSource.GetType().GetProperty("Endpoints");
            if (endpointsProperty == null)
            {
                Console.WriteLine($"  No Endpoints property");
                continue;
            }

            var endpoints = endpointsProperty.GetValue(dataSource) as System.Collections.IEnumerable;
            if (endpoints == null)
            {
                Console.WriteLine($"  Endpoints property is null");
                continue;
            }

            // Process each endpoint
            foreach (var endpoint in endpoints)
            {
                endpointCount++;
                if (ProcessEndpoint(endpoint, builder))
                {
                    discoveredCount++;
                }
            }
        }

        Console.WriteLine($"Endpoint discovery: Scanned {dataSourceCount} data sources, {endpointCount} endpoints, discovered {discoveredCount} SPAS contracts");
    }

    private static bool ProcessEndpoint(object endpoint, ContractsBuilder builder)
    {
        try
        {
            // Get Metadata property from endpoint
            var metadataProperty = endpoint.GetType().GetProperty("Metadata");
            if (metadataProperty == null)
            {
                return false;
            }

            var metadata = metadataProperty.GetValue(endpoint);
            if (metadata == null)
            {
                return false;
            }

            // Get RoutePattern to extract path
            var routePatternProperty = endpoint.GetType().GetProperty("RoutePattern");
            string? path = null;

            if (routePatternProperty != null)
            {
                var routePattern = routePatternProperty.GetValue(endpoint);
                if (routePattern != null)
                {
                    var rawTextProperty = routePattern.GetType().GetProperty("RawText");
                    if (rawTextProperty != null)
                    {
                        path = rawTextProperty.GetValue(routePattern) as string;
                    }
                }
            }

            // metadata is an EndpointMetadataCollection which implements IEnumerable<object>
            // Look for our SPAS attributes in the metadata collection
            foreach (var item in (System.Collections.IEnumerable)metadata)
            {
                // Check for SpasCommandAttribute
                if (item is SpasCommandAttribute commandAttr)
                {
                    var finalPath = commandAttr.Path ?? path ?? string.Empty;
                    var schemaRef = commandAttr.Schema ?? $"schemas/endpoints/{commandAttr.Name.ToLowerInvariant()}.schema.json";
                    builder.AddEndpoint(
                        name: commandAttr.Name,
                        type: "Command",
                        protocol: "Http",
                        methodPath: finalPath,
                        version: commandAttr.Version,
                        schemaRef: schemaRef);
                    return true; // Only one SPAS attribute per endpoint
                }

                // Check for SpasQueryAttribute
                if (item is SpasQueryAttribute queryAttr)
                {
                    var finalPath = queryAttr.Path ?? path ?? string.Empty;
                    var schemaRef = queryAttr.Schema ?? $"schemas/endpoints/{queryAttr.Name.ToLowerInvariant()}.schema.json";
                    builder.AddEndpoint(
                        name: queryAttr.Name,
                        type: "Query",
                        protocol: "Http",
                        methodPath: finalPath,
                        version: queryAttr.Version,
                        schemaRef: schemaRef);
                    return true; // Only one SPAS attribute per endpoint
                }
            }

            return false;
        }
        catch
        {
            return false; // Skip endpoints that can't be processed
        }
    }
}
