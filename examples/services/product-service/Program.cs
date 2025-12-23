using ProductService.Models;
using ProductService.Services;
using Spas.Sdk.Core.Identity;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Dev;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register SPAS metadata services with auto-discovery
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
    options.AutoGenerateSchemaReferences = true;
});

// Register dev metadata endpoint
builder.Services.AddMetadataEndpoint();

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

// Discover contracts
var contracts = app.DiscoverSpasMetadata();

var security = new SecurityBuilder()
    .WithAuthenticationType("jwt")
    .AddRequiredScope("products.read")
    .AddDataClassification("public")
    .Build();

var consistency = new ConsistencyBuilder()
    .WithQueries("EVENTUAL")
    .Build();

var network = new NetworkBuilder()
    .Build();

// Compose metadata
var composer = new SpasComposer();
var metadataPath = Path.Combine(AppContext.BaseDirectory, "spas.json");
composer.ComposeToFile(metadataPath, identity, contracts, security, consistency, network, "MIT");

// Map metadata endpoint
app.MapSpasMetadataEndpoint(
    metadataProvider: () => composer.Compose(identity, contracts, security, consistency, network, "MIT"));

app.MapGet("/", () => "Product Service");
app.MapGet("/health", () => new { status = "healthy", service = "product-service", timestamp = DateTime.UtcNow });

app.Run();
