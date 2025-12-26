using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Discovery;
using Spas.Sdk.Metadata.Generation;
using Spas.Sdk.Metadata.Models;
using System.Reflection;

namespace Spas.Sdk.Metadata.Extensions;

/// <summary>
/// Extension methods for WebApplication metadata discovery.
/// Import this namespace in your ASP.NET Core application to enable auto-discovery.
/// </summary>
public static class WebApplicationDiscoveryExtensions
{
    /// <summary>
    /// Discovers SPAS metadata from configured endpoints and events.
    /// Call this after configuring all endpoints but before app.Run().
    /// </summary>
    /// <param name="app">The WebApplication instance</param>
    /// <returns>ServiceContracts containing discovered commands, queries, and events</returns>
    public static ServiceContracts DiscoverSpasMetadata(this WebApplication app)
    {
        if (app == null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        var builder = new ContractsBuilder();

        // Get MetadataDiscovery from DI to discover events
        var discovery = app.Services.GetService<MetadataDiscovery>();

        if (discovery == null)
        {
            throw new InvalidOperationException(
                "MetadataDiscovery not found in DI container. Call AddSpasMetadata() during service configuration.");
        }

        // Discover events from assemblies
        var eventContracts = discovery.DiscoverEvents();
        foreach (var evt in eventContracts.Events)
        {
            builder.AddEvent(evt.Type, evt.Version, evt.SchemaRef, description: evt.Description);
        }

        // Discover endpoints from WebApplication's DataSources
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

    public static Task<string> GenerateSpasMetadataArchiveAsync(
        this WebApplication app,
        ServiceIdentity identity,
        string? outputDirectory = null,
        Assembly? assemblyToScan = null,
        SecurityMetadata? security = null,
        ConsistencyMetadata? consistency = null,
        NetworkMetadata? network = null,
        string? license = null,
        CancellationToken cancellationToken = default)
    {
        var generator = MetadataArchiveGenerator.CreateDefault();
        return generator.GenerateAsync(
            app,
            identity,
            outputDirectory,
            assemblyToScan,
            security,
            consistency,
            network,
            license,
            cancellationToken);
    }

    private static void DiscoverEndpointsFromWebApplication(WebApplication app, ContractsBuilder builder)
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

            var httpVerb = TryGetHttpVerb(metadata);

            // metadata is an EndpointMetadataCollection which implements IEnumerable<object>
            // Look for our SPAS attributes in the metadata collection
            foreach (var item in (System.Collections.IEnumerable)metadata)
            {
                // Check for SpasCommandAttribute
                if (item is SpasCommandAttribute commandAttr)
                {
                    var commandName = AttributeHelpers.ToKebabCase(commandAttr.Name);
                    builder.AddCommand(
                        name: commandName,
                        version: commandAttr.Version,
                        produces: ResolveProducedEvents(commandAttr.Produces, commandName, commandAttr.Version));

                    var finalPath = commandAttr.Path ?? path ?? string.Empty;
                    finalPath = EnsureHttpMethodPath(finalPath, httpVerb);
                    var schemaRef = commandAttr.Schema ?? $"schemas/endpoints/{commandName}.schema.json";
                    builder.AddEndpoint(
                        name: commandName,
                        type: "Command",
                        protocol: "Http",
                        methodPath: finalPath,
                        version: commandAttr.Version,
                        schemaRef: schemaRef,
                        description: commandAttr.Description);
                    return true; // Only one SPAS attribute per endpoint
                }

                // Check for SpasQueryAttribute
                if (item is SpasQueryAttribute queryAttr)
                {
                    var queryName = AttributeHelpers.ToKebabCase(queryAttr.Name);
                    var finalPath = queryAttr.Path ?? path ?? string.Empty;
                    finalPath = EnsureHttpMethodPath(finalPath, httpVerb);
                    var schemaRef = queryAttr.Schema ?? $"schemas/endpoints/{queryName}.schema.json";
                    builder.AddEndpoint(
                        name: queryName,
                        type: "Query",
                        protocol: "Http",
                        methodPath: finalPath,
                        version: queryAttr.Version,
                        schemaRef: schemaRef,
                        description: queryAttr.Description);
                    return true; // Only one SPAS attribute per endpoint
                }
            }

            return false;
        }
        catch (InvalidOperationException)
        {
            // Fail fast for invalid SPAS metadata declarations.
            throw;
        }
        catch
        {
            return false; // Skip endpoints that can't be processed
        }
    }

    // NOTE: Despite the name "methodPath" in the SPAS schema, consumers expect this to be ONLY the route path
    // (e.g. "/orders"), not prefixed with the HTTP verb (e.g. "POST /orders").
    private static string EnsureHttpMethodPath(string path, string? httpVerb)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return path;
        }

        var trimmed = path.Trim();

        // If the input already looks like "VERB /path", strip the verb.
        if (LooksLikeMethodPrefixedPath(trimmed))
        {
            var firstSpace = trimmed.IndexOf(' ');
            if (firstSpace >= 0 && firstSpace + 1 < trimmed.Length)
            {
                trimmed = trimmed[(firstSpace + 1)..].TrimStart();
            }
        }

        // Ensure it looks like a path.
        if (!trimmed.StartsWith('/'))
        {
            trimmed = "/" + trimmed;
        }

        return trimmed;
    }

    private static bool LooksLikeMethodPrefixedPath(string value)
    {
        // Minimal heuristic: common verbs followed by a space.
        return value.StartsWith("GET ", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("POST ", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("PUT ", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("DELETE ", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("PATCH ", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("HEAD ", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("OPTIONS ", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryGetHttpVerb(object metadata)
    {
        try
        {
            foreach (var item in (System.Collections.IEnumerable)metadata)
            {
                if (item == null) continue;

                var type = item.GetType();
                if (!string.Equals(type.FullName, "Microsoft.AspNetCore.Routing.HttpMethodMetadata", StringComparison.Ordinal))
                {
                    continue;
                }

                var httpMethodsProperty = type.GetProperty("HttpMethods", BindingFlags.Public | BindingFlags.Instance);
                if (httpMethodsProperty?.GetValue(item) is System.Collections.IEnumerable httpMethods)
                {
                    foreach (var method in httpMethods)
                    {
                        if (method is string methodString && !string.IsNullOrWhiteSpace(methodString))
                        {
                            return methodString;
                        }
                    }
                }
            }
        }
        catch
        {
            // Best-effort: missing type or reflection failure should not break metadata generation.
        }

        return null;
    }

    private static IEnumerable<ProducedEventRefContract> ResolveProducedEvents(Type[]? producedEventTypes)
    {
        return ResolveProducedEvents(producedEventTypes, commandName: null, commandVersion: null);
    }

    private static IEnumerable<ProducedEventRefContract> ResolveProducedEvents(
        Type[]? producedEventTypes,
        string? commandName,
        string? commandVersion)
    {
        if (producedEventTypes == null || producedEventTypes.Length == 0)
        {
            return Array.Empty<ProducedEventRefContract>();
        }

        var results = new List<ProducedEventRefContract>();

        foreach (var eventType in producedEventTypes)
        {
            if (eventType == null) continue;

            var evtAttr = eventType.GetCustomAttribute<SpasEventAttribute>();
            if (evtAttr == null)
            {
                var cmd = !string.IsNullOrWhiteSpace(commandName)
                    ? $"'{commandName}@{commandVersion}'"
                    : "<unknown command>";
                throw new InvalidOperationException(
                    $"Command {cmd} declares produced event type '{eventType.FullName}' but it is missing [SpasEvent].");
            }

            var resolvedType = AttributeHelpers.ToKebabCase(evtAttr.Name);
            var resolvedVersion = evtAttr.Version;

            if (string.IsNullOrWhiteSpace(resolvedType))
            {
                throw new InvalidOperationException(
                    $"Produced event type '{eventType.FullName}' has [SpasEvent] but Name is blank.");
            }
            if (string.IsNullOrWhiteSpace(resolvedVersion))
            {
                throw new InvalidOperationException(
                    $"Produced event type '{eventType.FullName}' has [SpasEvent] but Version is blank.");
            }

            results.Add(new ProducedEventRefContract
            {
                Type = resolvedType,
                Version = resolvedVersion,
                When = "success"
            });
        }

        return results;
    }
}
