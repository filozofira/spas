using System.IO.Compression;

namespace Spas.Sdk.Metadata.Tests.Helpers;

public static class ZipAssert
{
    public static IReadOnlyList<string> ReadEntryNames(string zipPath)
    {
        using var fileStream = File.OpenRead(zipPath);
        using var archive = new ZipArchive(fileStream, ZipArchiveMode.Read, leaveOpen: false);

        return archive.Entries
            .Select(e => e.FullName)
            .Order(StringComparer.Ordinal)
            .ToArray();
    }

    public static string ReadEntryContent(string zipPath, string entryName)
    {
        using var fileStream = File.OpenRead(zipPath);
        using var archive = new ZipArchive(fileStream, ZipArchiveMode.Read, leaveOpen: false);

        var entry = archive.GetEntry(entryName)
            ?? throw new InvalidOperationException($"Entry '{entryName}' not found in archive");

        using var entryStream = entry.Open();
        using var reader = new StreamReader(entryStream);
        return reader.ReadToEnd();
    }
}
