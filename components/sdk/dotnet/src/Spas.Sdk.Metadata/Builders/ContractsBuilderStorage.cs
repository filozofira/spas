using System.Collections.Concurrent;
using System.Runtime.CompilerServices;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Thread-safe static storage for ContractsBuilder instances.
/// Used to pass type mappings between the discovery phase (DiscoverSpasMetadata)
/// and the generation phase (MetadataArchiveGenerator).
/// </summary>
/// <remarks>
/// This is necessary because WebApplication.Properties is not available,
/// and we need to communicate type information from endpoint discovery to schema generation.
/// The storage is keyed by WebApplication instance hash to support multiple apps in testing.
/// </remarks>
public static class ContractsBuilderStorage
{
    private static readonly ConcurrentDictionary<int, ContractsBuilder> _builders = new();

    /// <summary>
    /// Stores a ContractsBuilder instance for later retrieval.
    /// </summary>
    /// <param name="app">The WebApplication instance as the key</param>
    /// <param name="builder">The ContractsBuilder to store</param>
    public static void Store(object app, ContractsBuilder builder)
    {
        var key = RuntimeHelpers.GetHashCode(app);
        _builders[key] = builder;
    }

    /// <summary>
    /// Retrieves a stored ContractsBuilder instance.
    /// </summary>
    /// <param name="app">The WebApplication instance as the key</param>
    /// <returns>The stored ContractsBuilder, or null if not found</returns>
    public static ContractsBuilder? Retrieve(object app)
    {
        var key = RuntimeHelpers.GetHashCode(app);
        return _builders.TryGetValue(key, out var builder) ? builder : null;
    }

    /// <summary>
    /// Removes a stored ContractsBuilder instance.
    /// </summary>
    /// <param name="app">The WebApplication instance as the key</param>
    public static void Remove(object app)
    {
        var key = RuntimeHelpers.GetHashCode(app);
        _builders.TryRemove(key, out _);
    }

    /// <summary>
    /// Clears all stored builders. Primarily for testing.
    /// </summary>
    internal static void Clear()
    {
        _builders.Clear();
    }
}
