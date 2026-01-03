using Microsoft.AspNetCore.Builder;
using ProductService.Services;
using Spas.Sdk.Inbound.Extensions;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<ProductCatalog>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "product-service");
builder.Services.AddSpasHealthChecks();

// Add Controllers support (all endpoints are now controller-based)
builder.Services.AddControllers();

var app = builder.Build();

// Map SPAS health endpoints (/_spas/health/*)
app.UseSpasHealthChecks();

// Map Controllers (provides all endpoints at /products/*)
app.MapControllers();

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
