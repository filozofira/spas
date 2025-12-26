using ProductService.Models;
using ProductService.Services;
using Spas.Sdk.Core.Identity;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Generation;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register SPAS metadata services with auto-discovery
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
    options.AutoGenerateSchemaReferences = true;
});

// Configure SPAS infrastructure (event publishing, tracing)
var serviceName = builder.Services.AddSpasServices(builder.Configuration, "product-service");

// In-memory product catalog
builder.Services.AddSingleton<ProductCatalog>();

var app = builder.Build();

app.UseSpasIdentity();

// Service identity
var identity = new ServiceIdentityBuilder()
    .WithId("product-service")
    .WithName("product-service")
    .WithVersion("1.0.0")
    .WithBoundedContext("product")
    .WithDescription("Product catalog browsing service")
    .AddCapability("product-catalog")
    .Build();

// GET /products - List all products
app.MapGet("/products",
    [SpasQuery("ListProducts", "1.0", Description = "Lists products in the catalog (optionally filtered by category)")]
    (ProductCatalog catalog, string? category = null) =>
    {
        var products = catalog.GetAll();
        
        if (!string.IsNullOrEmpty(category))
        {
            products = products.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }
        
        return Results.Ok(products);
    });

// GET /products/{id} - Get specific product
app.MapGet("/products/{id}",
    [SpasQuery("GetProduct", "1.0", Description = "Returns product details by productId")]
    (string id, ProductCatalog catalog) =>
    {
        var product = catalog.Get(id);
        return product != null ? Results.Ok(product) : Results.NotFound();
    });

app.MapGet("/", () => "Product Service");
app.MapGet("/health", () => new { status = "healthy", service = "product-service", timestamp = DateTime.UtcNow });

static bool TryGetOutputDirectory(string[] args, out string? outputDirectory)
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

if (args.Any(a => string.Equals(a, MetadataGenerationConstants.GenerateMetadataArgument, StringComparison.OrdinalIgnoreCase)))
{
    if (!TryGetOutputDirectory(args, out var outputDirectory))
    {
        Console.Error.WriteLine("Missing value for --output <path>.");
        Environment.ExitCode = 2;
        return;
    }

    var archivePath = await app.GenerateSpasMetadataArchiveAsync(
        identity,
        outputDirectory: outputDirectory,
        assemblyToScan: typeof(Program).Assembly);

    Console.WriteLine($"SPAS metadata archive generated at: {archivePath}");
    return;
}

app.Run();
