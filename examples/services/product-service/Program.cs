using Spas.Sdk.Core.Identity;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Dev;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;
using System.Collections.Concurrent;

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
    .WithVersion("1.0.2")
    .WithBoundedContext("product")
    .WithDescription("Product catalog browsing service")
    .AddCapability("product-catalog")
    .Build();

// GET /products - List all products
app.MapGet("/products",
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

// Domain models
public record Product(string ProductId, string Name, string Category, decimal Price, string Description);

// In-memory catalog with sample data
public class ProductCatalog
{
    private readonly ConcurrentDictionary<string, Product> _products = new();

    public ProductCatalog()
    {
        // Seed with sample products
        _products["prod-001"] = new Product(
            "prod-001",
            "Laptop Pro 15",
            "Electronics",
            1299.99m,
            "High-performance laptop with 15-inch display"
        );
        
        _products["prod-002"] = new Product(
            "prod-002",
            "Wireless Mouse",
            "Electronics",
            29.99m,
            "Ergonomic wireless mouse with precision tracking"
        );
        
        _products["prod-003"] = new Product(
            "prod-003",
            "USB-C Hub",
            "Electronics",
            49.99m,
            "7-in-1 USB-C hub with HDMI and ethernet"
        );
        
        _products["prod-004"] = new Product(
            "prod-004",
            "Office Chair",
            "Furniture",
            299.99m,
            "Ergonomic office chair with lumbar support"
        );
        
        _products["prod-005"] = new Product(
            "prod-005",
            "Standing Desk",
            "Furniture",
            599.99m,
            "Electric height-adjustable standing desk"
        );
    }

    public Product? Get(string productId) => 
        _products.TryGetValue(productId, out var product) ? product : null;

    public IEnumerable<Product> GetAll() => _products.Values;
}
