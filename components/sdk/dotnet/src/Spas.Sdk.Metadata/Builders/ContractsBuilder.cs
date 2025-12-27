using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Builders;

/// <summary>
/// Builder for service contracts metadata.
/// </summary>
public class ContractsBuilder
{
    private readonly List<EndpointContract> _endpoints = new();
    private readonly List<CommandContract> _commands = new();
    private readonly List<EventContract> _events = new();

    /// <summary>
    /// Mapping of endpoint schemaRef to the Type that should be used for schema generation.
    /// Enables endpoint-centric schema inference from plain DTOs.
    /// </summary>
    public Dictionary<string, Type> EndpointRequestBodyTypes { get; } = new();

    private static string? TrimToNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    /// <summary>
    /// Adds an endpoint (command or query).
    /// </summary>
    /// <param name="name">Endpoint name</param>
    /// <param name="type">Type (Command or Query)</param>
    /// <param name="protocol">Protocol (Http)</param>
    /// <param name="methodPath">HTTP method and path</param>
    /// <param name="version">Version</param>
    /// <param name="schemaRef">Schema reference path</param>
    /// <param name="description">Optional description</param>
    /// <param name="requestBodyType">Optional request body type for schema inference</param>
    public ContractsBuilder AddEndpoint(string name, string type, string protocol, string methodPath, string version, string schemaRef, string? description = null, Type? requestBodyType = null)
    {
        _endpoints.Add(new EndpointContract
        {
            Name = name,
            Type = type,
            Protocol = protocol,
            MethodPath = methodPath,
            Version = version,
            SchemaRef = schemaRef,
            Description = TrimToNull(description)
        });

        // Store the request body type for schema generation if provided
        if (requestBodyType != null && !string.IsNullOrWhiteSpace(schemaRef))
        {
            EndpointRequestBodyTypes.TryAdd(schemaRef, requestBodyType);
        }

        return this;
    }

    /// <summary>
    /// Adds an event contract.
    /// </summary>
    public ContractsBuilder AddEvent(string type, string version, string schemaRef, string? description = null)
    {
        _events.Add(new EventContract
        {
            Type = type,
            Version = version,
            SchemaRef = schemaRef,
            Description = TrimToNull(description)
        });
        return this;
    }

    /// <summary>
    /// Adds or merges a command definition.
    /// </summary>
    public ContractsBuilder AddCommand(string name, string version, IEnumerable<ProducedEventRefContract>? produces = null)
    {
        var existing = _commands.FirstOrDefault(c =>
            string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase)
            && string.Equals(c.Version, version, StringComparison.OrdinalIgnoreCase));

        if (existing == null)
        {
            existing = new CommandContract
            {
                Name = name,
                Version = version,
                Produces = new List<ProducedEventRefContract>()
            };
            _commands.Add(existing);
        }

        if (produces != null)
        {
            foreach (var p in produces)
            {
                if (p == null) continue;
                if (string.IsNullOrWhiteSpace(p.Type)) continue;
                if (string.IsNullOrWhiteSpace(p.Version)) continue;

                var already = existing.Produces.Any(ep =>
                    string.Equals(ep.Type, p.Type, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(ep.Version, p.Version, StringComparison.OrdinalIgnoreCase));
                if (already)
                {
                    throw new InvalidOperationException(
                        $"Command '{existing.Name}@{existing.Version}' declares duplicate produced event '{p.Type}@{p.Version}'.");
                }

                existing.Produces.Add(new ProducedEventRefContract
                {
                    Type = p.Type,
                    Version = p.Version,
                    When = "success"
                });
            }
        }

        return this;
    }

    /// <summary>
    /// Builds the service contracts.
    /// </summary>
    public ServiceContracts Build()
    {
        // Fail-fast validation:
        // - produced events must reference a declared event (type, version)
        // - commands must not contain duplicate produced events (enforced in AddCommand)
        var eventKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var ev in _events)
        {
            if (ev == null) continue;
            if (string.IsNullOrWhiteSpace(ev.Type)) continue;
            if (string.IsNullOrWhiteSpace(ev.Version)) continue;
            eventKeys.Add($"{ev.Type}|{ev.Version}");
        }

        foreach (var cmd in _commands)
        {
            if (cmd == null) continue;
            if (cmd.Produces == null || cmd.Produces.Count == 0) continue;

            foreach (var p in cmd.Produces)
            {
                if (p == null) continue;
                var key = $"{p.Type}|{p.Version}";
                if (!eventKeys.Contains(key))
                {
                    throw new InvalidOperationException(
                        $"Command '{cmd.Name}@{cmd.Version}' produces '{p.Type}@{p.Version}' but no matching entry exists in events[].");
                }
            }
        }

        return new ServiceContracts
        {
            Endpoints = _endpoints,
            Commands = _commands,
            Events = _events
        };
    }
}
