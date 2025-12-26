using Microsoft.AspNetCore.Builder;
using ProductService.Models;
using ProductService.Services;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<ProductCatalog>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "product-service");

var app = builder.Build();

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

// Run SPAS service (generates metadata if --generate-metadata, else starts server)
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "product-service";
    options.ServiceName = "product-service";
    options.Version = "1.0.0";
    options.BoundedContext = "product";
    options.Description = "Product catalog browsing service";
    options.AddCapability("product-catalog");

    options.ConfigureConsistency(c => c
        .WithCommands("ACID")
        .WithQueries("EVENTUAL"));

    options.ConfigureNetwork(n => n
        .AddRequiredEgress("localhost:6379"));

    options.ConfigureSecurity(s => s
        .WithAuthenticationType("jwt")
        .AddRequiredScope("products.read")
        .AddRequiredScope("products.write")
        .AddDataClassification("internal"));

    options.License = "MIT";
});
