using Microsoft.AspNetCore.Builder;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Configuration;
using Spas.Sdk.Metadata.Generation;
using System.Reflection;

namespace Spas.Sdk.Metadata.Extensions;

/// <summary>
/// Extension methods for WebApplication to run SPAS services.
/// </summary>
public static class WebApplicationExtensions
{
    /// <summary>
    /// Runs the SPAS service. If --generate-metadata arg is passed, generates metadata archive and exits.
    /// Otherwise, starts the web server normally.
    /// </summary>
    /// <param name="app">The WebApplication instance.</param>
    /// <param name="args">Command-line arguments to check for --generate-metadata.</param>
    /// <param name="configure">Action to configure service identity (only invoked if generating metadata).</param>
    public static async Task RunSpasServiceAsync(
        this WebApplication app,
        string[] args,
        Action<SpasServiceOptions> configure)
    {
        if (app == null)
            throw new ArgumentNullException(nameof(app));

        var isGeneratingMetadata = args.Any(a => 
            string.Equals(a, MetadataGenerationConstants.GenerateMetadataArgument, StringComparison.OrdinalIgnoreCase));

        if (isGeneratingMetadata)
        {
            // Configure options only when generating metadata
            var options = new SpasServiceOptions();
            configure(options);
            ValidateOptions(options);

            // Build service identity
            var identity = new ServiceIdentityBuilder()
                .WithId(options.ServiceId)
                .WithName(options.ServiceName)
                .WithVersion(options.Version)
                .WithBoundedContext(options.BoundedContext);

            if (!string.IsNullOrWhiteSpace(options.Description))
            {
                identity = identity.WithDescription(options.Description);
            }

            foreach (var capability in options.Capabilities)
            {
                identity = identity.AddCapability(capability);
            }

            var serviceIdentity = identity.Build();

            if (!TryGetOutputDirectory(args, out var outputDirectory))
            {
                Console.Error.WriteLine("Missing value for --output <path>.");
                Console.Error.WriteLine("Usage: dotnet run -- --generate-metadata --output <path>");
                Environment.ExitCode = 2;
                return;
            }

            Console.WriteLine("Generating SPAS metadata archive (offline; no listening ports)...");
            var archivePath = await app.GenerateSpasMetadataArchiveAsync(
                serviceIdentity,
                outputDirectory: outputDirectory,
                assemblyToScan: Assembly.GetEntryAssembly() ?? Assembly.GetCallingAssembly(),
                security: options.Security,
                consistency: options.Consistency,
                network: options.Network,
                license: options.License);

            Console.WriteLine($"SPAS metadata archive generated at: {archivePath}");
            return; // Exit without running the server
        }

        // Runtime mode: run the app normally
        await app.RunAsync();
    }

    private static void ValidateOptions(SpasServiceOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.ServiceId))
            throw new ArgumentException("ServiceId is required.", nameof(options.ServiceId));
        if (string.IsNullOrWhiteSpace(options.ServiceName))
            throw new ArgumentException("ServiceName is required.", nameof(options.ServiceName));
        if (string.IsNullOrWhiteSpace(options.Version))
            throw new ArgumentException("Version is required.", nameof(options.Version));
        if (string.IsNullOrWhiteSpace(options.BoundedContext))
            throw new ArgumentException("BoundedContext is required.", nameof(options.BoundedContext));
    }

    private static bool TryGetOutputDirectory(string[] args, out string? outputDirectory)
    {
        outputDirectory = null;

        for (var i = 0; i < args.Length; i++)
        {
            if (string.Equals(args[i], MetadataGenerationConstants.OutputDirectoryArgument, StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length || string.IsNullOrWhiteSpace(args[i + 1]))
                {
                    return false;
                }

                outputDirectory = args[i + 1];
                return true;
            }
        }

        return true;
    }
}
