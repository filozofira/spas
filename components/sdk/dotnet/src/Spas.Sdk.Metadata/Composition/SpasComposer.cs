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
        ConsistencyMetadata? consistency = null,
        NetworkMetadata? network = null,
        string? license = null)
    {
        var metadata = new
        {
            schemaVersion = "design-time-metadata-v1",
            id = identity.Id,
            name = identity.Name,
            description = identity.Description,
            version = identity.Version,
            boundedContext = identity.BoundedContext,
            capabilities = identity.Capabilities,
            endpoints = contracts != null ? contracts.Endpoints.Select(e => new
            {
                name = e.Name,
                type = e.Type,
                protocol = e.Protocol,
                methodPath = e.MethodPath,
                version = e.Version,
                schemaRef = e.SchemaRef,
                description = e.Description
            }).ToArray() : Array.Empty<object>(),
            events = contracts != null ? contracts.Events.Select(ev => new
            {
                type = ev.Type,
                version = ev.Version,
                schemaRef = ev.SchemaRef
            }).ToArray() : Array.Empty<object>(),
            consistency = consistency != null ? new
            {
                commands = consistency.Commands,
                queries = consistency.Queries
            } : null,
            network = network != null ? new
            {
                requiredEgress = network.RequiredEgress
            } : null,
            security = security != null ? new
            {
                authentication = security.Authentication != null ? new
                {
                    type = security.Authentication.Type,
                    requiredScopes = security.Authentication.RequiredScopes
                } : null,
                dataClassification = security.DataClassification
            } : null,
            license = license
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
        ConsistencyMetadata? consistency = null,
        NetworkMetadata? network = null,
        string? license = null)
    {
        var json = Compose(identity, contracts, security, consistency, network, license);

        var directory = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        File.WriteAllText(filePath, json);
    }
}
