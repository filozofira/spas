using Microsoft.AspNetCore.Builder;
using InventoryService.Services;
using Spas.Sdk.Inbound.Extensions;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<InventoryStore>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "inventory-service");
builder.Services.AddSpasHealthChecks();

// Add Controllers support (all endpoints are now controller-based)
builder.Services.AddControllers();

var app = builder.Build();

// Map SPAS health endpoints (/_spas/health/*)
app.UseSpasHealthChecks();

// Map Controllers (provides all endpoints at /inventory/*)
app.MapControllers();

// Run SPAS service (generates metadata if --generate-metadata, else starts server)
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "inventory-service";
    options.ServiceName = "inventory-service";
    options.Version = "1.0.0";
    options.BoundedContext = "inventory";
    options.Description = "Item quantity tracking and reservation service";
    options.AddCapability("inventory-tracking");

    options.ConfigureConsistency(c => c
        .WithCommands("ACID")
        .WithQueries("EVENTUAL"));

    options.ConfigureNetwork(n => n
        .AddRequiredEgress("localhost:6379"));

    options.ConfigureSecurity(s => s
        .WithAuthenticationType("jwt")
        .AddRequiredScope("inventory.read")
        .AddDataClassification("internal"));

    options.License = "MIT";
});
