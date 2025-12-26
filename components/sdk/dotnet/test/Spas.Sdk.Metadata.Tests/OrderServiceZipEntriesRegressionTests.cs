using System.Diagnostics;
using Spas.Sdk.Metadata.Tests.Fixtures;
using Spas.Sdk.Metadata.Tests.Helpers;

namespace Spas.Sdk.Metadata.Tests;

public sealed class OrderServiceZipEntriesRegressionTests
{
    [Fact]
    public async Task OrderService_GeneratedZipEntries_MatchReference()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "spas-metadata-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            var zipPath = Path.Combine(tempRoot, "service.metadata.zip");

            var repoRoot = GetRepoRootFromAppContext();
            var orderServiceProject = Path.Combine(repoRoot, "examples", "services", "order-service", "OrderService.csproj");

            Assert.True(File.Exists(orderServiceProject), $"Order service project not found at: {orderServiceProject}");

            var exitCode = await RunDotNetAsync(
                arguments: $"run --project \"{orderServiceProject}\" -- --generate-metadata --output \"{tempRoot}\"",
                workingDirectory: repoRoot,
                timeout: TimeSpan.FromMinutes(3));

            Assert.Equal(0, exitCode);
            Assert.True(File.Exists(zipPath), $"Expected metadata archive at: {zipPath}");

            var actualEntries = ZipAssert.ReadEntryNames(zipPath);
            var expectedEntries = ReferenceZipEntries.OrderService_1_0_0
                .Order(StringComparer.Ordinal)
                .ToArray();

            Assert.Equal(expectedEntries, actualEntries);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    private static string GetRepoRootFromAppContext()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);

        for (var i = 0; i < 10 && dir != null; i++)
        {
            if (File.Exists(Path.Combine(dir.FullName, "CODE_OF_CONDUCT.md"))
                && Directory.Exists(Path.Combine(dir.FullName, "components"))
                && Directory.Exists(Path.Combine(dir.FullName, "examples")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate repository root from test base directory.");
    }

    private static async Task<int> RunDotNetAsync(string arguments, string workingDirectory, TimeSpan timeout)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };

        startInfo.Environment["DOTNET_NOLOGO"] = "1";

        using var process = new Process { StartInfo = startInfo };
        process.Start();

        using var cts = new CancellationTokenSource(timeout);

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch
            {
                // Best-effort cleanup.
            }

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            throw new TimeoutException($"dotnet command timed out after {timeout}.\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}");
        }

        if (process.ExitCode != 0)
        {
            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            throw new InvalidOperationException($"dotnet command failed with exit code {process.ExitCode}.\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}");
        }

        return process.ExitCode;
    }
}
