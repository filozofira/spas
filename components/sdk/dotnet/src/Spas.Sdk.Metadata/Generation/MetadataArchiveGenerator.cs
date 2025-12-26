using System.Reflection;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Dev;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Models;
using Spas.Sdk.Metadata.Schema;

namespace Spas.Sdk.Metadata.Generation;

public class MetadataArchiveGenerator
{
    private readonly MetadataArchiveWriter _archiveWriter;
    private readonly SchemaGenerator _schemaGenerator;
    private readonly SpasComposer _composer;

    public MetadataArchiveGenerator(
        MetadataArchiveWriter archiveWriter,
        SchemaGenerator schemaGenerator,
        SpasComposer composer)
    {
        _archiveWriter = archiveWriter;
        _schemaGenerator = schemaGenerator;
        _composer = composer;
    }

    public static MetadataArchiveGenerator CreateDefault()
    {
        return new MetadataArchiveGenerator(
            new MetadataArchiveWriter(),
            new SchemaGenerator(),
            new SpasComposer());
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

        outputDirectory ??= MetadataGenerationConstants.DefaultOutputDirectoryName;
        Directory.CreateDirectory(outputDirectory);

        var archivePath = Path.Combine(outputDirectory, MetadataGenerationConstants.DefaultArchiveFileName);

        var contracts = app.DiscoverSpasMetadata();
        var spasJson = _composer.Compose(identity, contracts);

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
