using System.Reflection;
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
        object app,
        ServiceIdentity identity,
        string? outputDirectory = null,
        Assembly? assemblyToScan = null,
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
        var spasJson = _composer.Compose(identity, contracts);

        var validation = _schemaValidator.Validate(spasJson);
        if (!validation.IsValid)
        {
            var errorText = validation.Errors.Count > 0
                ? string.Join("; ", validation.Errors)
                : "Unknown schema validation error.";
            throw new InvalidOperationException($"Generated spas.json failed schema validation: {errorText}");
        }

        var targetAssembly = assemblyToScan ?? Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly();
        var schemas = await _schemaGenerator.GenerateSchemasFromAssemblyAsync(targetAssembly);

        var archiveStream = await _archiveWriter.CreateArchiveAsync(spasJson, schemas);

        await using (var fileStream = File.Create(archivePath))
        {
            archiveStream.Position = 0;
            await archiveStream.CopyToAsync(fileStream, cancellationToken);
        }

        return archivePath;
    }
}
