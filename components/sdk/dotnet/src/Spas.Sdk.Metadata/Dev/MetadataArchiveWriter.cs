using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace Spas.Sdk.Metadata.Dev;

/// <summary>
/// Creates ZIP archives containing spas.json and contract schemas.
/// </summary>
public class MetadataArchiveWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    /// <summary>
    /// Creates a ZIP archive containing the composed metadata and schemas.
    /// </summary>
    /// <param name="spasMetadata">The composed spas.json content.</param>
    /// <param name="schemas">Dictionary of schema paths to schema objects.</param>
    /// <returns>A memory stream containing the ZIP archive at position 0.</returns>
    public async Task<MemoryStream> CreateArchiveAsync(
        object spasMetadata,
        IDictionary<string, object> schemas)
    {
        var archiveStream = new MemoryStream();

        using (var archive = new ZipArchive(archiveStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            // Add spas.json
            await AddEntryAsync(archive, "spas.json", spasMetadata);

            // Add all schemas
            foreach (var (path, schema) in schemas)
            {
                await AddEntryAsync(archive, path, schema);
            }
        }

        // Reset position to beginning for consumption
        archiveStream.Position = 0;
        return archiveStream;
    }

    private static async Task AddEntryAsync(ZipArchive archive, string entryPath, object content)
    {
        var entry = archive.CreateEntry(entryPath, CompressionLevel.Optimal);

        using var entryStream = entry.Open();
        var json = JsonSerializer.Serialize(content, JsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        await entryStream.WriteAsync(bytes);
    }
}
