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
}
