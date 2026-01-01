using Microsoft.AspNetCore.Builder;
using OrderService.Services;
using Spas.Sdk.Inbound.Extensions;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<OrderStore>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "order-service");
builder.Services.AddSpasHealthChecks();

// Add Controllers support (all endpoints are now controller-based)
builder.Services.AddControllers();

var app = builder.Build();

// Map SPAS health endpoints (/_spas/health/*)
app.UseSpasHealthChecks();

// Map Controllers (provides all endpoints at /orders/*)  
app.MapControllers();

// Run SPAS service (generates metadata if --generate-metadata, else starts server)
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "order-service";
    options.ServiceName = "order-service";
    options.Version = "1.0.0";
    options.BoundedContext = "order";
    options.Description = "Order lifecycle management service";
    options.AddCapability("order-management");

    options.ConfigureConsistency(c => c
        .WithCommands("ACID")
        .WithQueries("EVENTUAL"));

    options.ConfigureNetwork(n => n
        .AddRequiredEgress("localhost:6379"));

    options.ConfigureSecurity(s => s
        .WithAuthenticationType("jwt")
        .AddRequiredScope("orders.read")
        .AddRequiredScope("orders.write")
        .AddDataClassification("internal"));

    options.License = "MIT";
});

