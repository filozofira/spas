using System.Text.Json;
using Spas.Sdk.Core.Serialization;
using Spas.Sdk.Metadata.Models;

namespace Spas.Sdk.Metadata.Composition;

/// <summary>
/// Composes SPAS metadata into canonical spas.json format.
/// </summary>
public class SpasComposer
{
    /// <summary>
    /// Composes metadata fragments into a JSON string.
    /// </summary>
    public string Compose(
        ServiceIdentity identity,
        ServiceContracts? contracts = null,
        SecurityMetadata? security = null,
        HealthMetadata? health = null)
    {
        var metadata = new
        {
            identity = new
            {
                name = identity.Name,
                version = identity.Version,
                description = identity.Description,
                owner = identity.Owner,
                repository = identity.Repository
            },
            contracts = contracts != null ? new
            {
                commands = contracts.Commands.Select(c => new
                {
                    name = c.Name,
                    version = c.Version,
                    path = c.Path,
                    schema = c.Schema
                }),
                queries = contracts.Queries.Select(q => new
                {
                    name = q.Name,
                    version = q.Version,
                    path = q.Path,
                    schema = q.Schema
                }),
                events = contracts.Events.Select(e => new
                {
                    name = e.Name,
                    version = e.Version,
                    schema = e.Schema
                })
            } : null,
            security = security != null ? new
            {
                authentication = security.Authentication,
                requiredScopes = security.RequiredScopes
            } : null,
            health = health != null ? new
            {
                healthEndpoint = health.HealthEndpoint,
                timeoutSeconds = health.TimeoutSeconds
            } : null
        };

        return JsonSerializer.Serialize(metadata, JsonSerializerOptionsFactory.Indented);
    }

    /// <summary>
    /// Composes metadata and writes to a file.
    /// </summary>
    public void ComposeToFile(
        string filePath,
        ServiceIdentity identity,
        ServiceContracts? contracts = null,
        SecurityMetadata? security = null,
        HealthMetadata? health = null)
    {
        var json = Compose(identity, contracts, security, health);

        var directory = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        File.WriteAllText(filePath, json);
    }
}
