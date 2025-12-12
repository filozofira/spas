using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for service contracts metadata.
/// </summary>
public class ContractsBuilder
{
    private readonly List<ContractDefinition> _commands = new();
    private readonly List<ContractDefinition> _queries = new();
    private readonly List<EventDefinition> _events = new();

    /// <summary>
    /// Adds a command contract.
    /// </summary>
    public ContractsBuilder AddCommand(string name, string version, string path, string schema)
    {
        _commands.Add(new ContractDefinition
        {
            Name = name,
            Version = version,
            Path = path,
            Schema = schema
        });
        return this;
    }

    /// <summary>
    /// Adds a query contract.
    /// </summary>
    public ContractsBuilder AddQuery(string name, string version, string path, string schema)
    {
        _queries.Add(new ContractDefinition
        {
            Name = name,
            Version = version,
            Path = path,
            Schema = schema
        });
        return this;
    }

    /// <summary>
    /// Adds an event contract.
    /// </summary>
    public ContractsBuilder AddEvent(string name, string version, string schema)
    {
        _events.Add(new EventDefinition
        {
            Name = name,
            Version = version,
            Schema = schema
        });
        return this;
    }

    /// <summary>
    /// Builds the service contracts.
    /// </summary>
    public ServiceContracts Build()
    {
        return new ServiceContracts
        {
            Commands = _commands,
            Queries = _queries,
            Events = _events
        };
    }
}
