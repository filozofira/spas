using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for consistency metadata.
/// </summary>
public class ConsistencyBuilder
{
    private string _commands = "ACID";
    private string _queries = "EVENTUAL";

    /// <summary>
    /// Sets commands consistency (default: ACID).
    /// </summary>
    public ConsistencyBuilder WithCommands(string consistency)
    {
        _commands = consistency;
        return this;
    }

    /// <summary>
    /// Sets queries consistency (STRONG | EVENTUAL).
    /// </summary>
    public ConsistencyBuilder WithQueries(string consistency)
    {
        _queries = consistency;
        return this;
    }

    /// <summary>
    /// Builds the consistency metadata.
    /// </summary>
    public ConsistencyMetadata Build()
    {
        return new ConsistencyMetadata
        {
            Commands = _commands,
            Queries = _queries
        };
    }
}
