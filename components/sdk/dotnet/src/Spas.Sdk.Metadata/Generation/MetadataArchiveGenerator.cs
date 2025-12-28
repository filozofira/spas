using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Dev;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Models;
using Spas.Sdk.Metadata.Schema;
using Spas.Sdk.Metadata.Validation;

namespace Spas.Sdk.Metadata.Generation;

public class MetadataArchiveGenerator
{
    private readonly MetadataArchiveWriter _archiveWriter;
    private readonly SchemaGenerator _schemaGenerator;
    private readonly SpasComposer _composer;
    private readonly SchemaValidator _schemaValidator;

    public MetadataArchiveGenerator(
        MetadataArchiveWriter archiveWriter,
        SchemaGenerator schemaGenerator,
        SpasComposer composer,
        SchemaValidator schemaValidator)
    {
        _archiveWriter = archiveWriter;
        _schemaGenerator = schemaGenerator;
        _composer = composer;
        _schemaValidator = schemaValidator;
    }

    public static MetadataArchiveGenerator CreateDefault()
    {
        return new MetadataArchiveGenerator(
            new MetadataArchiveWriter(),
            new SchemaGenerator(),
            new SpasComposer(),
            new SchemaValidator());
    }

    public async Task<string> GenerateAsync(
        WebApplication app,
        ServiceIdentity identity,
        string? outputDirectory = null,
        Assembly? assemblyToScan = null,
        SecurityMetadata? security = null,
        ConsistencyMetadata? consistency = null,
        NetworkMetadata? network = null,
        string? license = null,
        CancellationToken cancellationToken = default)
    {
        if (app == null)
        {
            throw new ArgumentNullException(nameof(app));
        }

        if (string.IsNullOrWhiteSpace(outputDirectory))
        {
            outputDirectory = MetadataGenerationConstants.DefaultOutputDirectoryName;
        }

        var archivePath = Path.GetFullPath(Path.Combine(outputDirectory, MetadataGenerationConstants.DefaultArchiveFileName));
        Directory.CreateDirectory(Path.GetDirectoryName(archivePath)!);

        var contracts = app.DiscoverSpasMetadata();
        var spasJson = _composer.Compose(
            identity,
            contracts,
            security: security,
            consistency: consistency,
            network: network,
            license: license);

        var validation = _schemaValidator.Validate(spasJson);
        if (!validation.IsValid)
        {
            var errorText = validation.Errors.Count > 0
                ? string.Join("; ", validation.Errors)
                : "Unknown schema validation error.";
            throw new InvalidOperationException($"Generated spas.json failed schema validation: {errorText}");
        }

        var targetAssembly = assemblyToScan ?? Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly();
        
        // Generate event schemas from assembly (attribute-based)
        var schemas = await _schemaGenerator.GenerateSchemasFromAssemblyAsync(targetAssembly);

        // Generate endpoint schemas from type mappings (T015-T017: endpoint-centric inference)
        var builder = ContractsBuilderStorage.Retrieve(app);
        if (builder != null)
        {
            await GenerateSchemasFromEndpointsAsync(builder.EndpointRequestBodyTypes, schemas);
            ContractsBuilderStorage.Remove(app);
        }

        var archiveStream = await _archiveWriter.CreateArchiveAsync(spasJson, schemas);

        await using (var fileStream = File.Create(archivePath))
        {
            archiveStream.Position = 0;
            await archiveStream.CopyToAsync(fileStream, cancellationToken);
        }

        return archivePath;
    }

    /// <summary>
    /// Generates schemas from endpoint request body types.
    /// This enables schema inference from plain DTOs without requiring [SpasCommand] on the DTO.
    /// </summary>
    private async Task GenerateSchemasFromEndpointsAsync(Dictionary<string, Type> endpointTypes, IDictionary<string, object> schemas)
    {
        var generatedTypes = new HashSet<Type>();

        foreach (var (schemaRef, bodyType) in endpointTypes)
        {
            // Skip if schema already exists (deduplication - T017)
            if (schemas.ContainsKey(schemaRef))
            {
                continue;
            }

            // Skip primitive/simple types (T016)
            if (WebApplicationDiscoveryExtensions.IsPrimitiveOrSimpleType(bodyType))
            {
                continue;
            }

            // Skip if we've already generated for this type (deduplication)
            if (!generatedTypes.Add(bodyType))
            {
                continue;
            }

            // Generate schema for the type
            var schema = await _schemaGenerator.GenerateSchemaAsync(bodyType);
            if (schema != null)
            {
                schemas[schemaRef] = schema;
            }
        }
    }
}
