using Microsoft.AspNetCore.Builder;
using SubscriptionService.Services;
using Spas.Sdk.Inbound.Extensions;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<SubscriptionStore>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "subscription-service");
builder.Services.AddSpasHealthChecks();

// Add Controllers support (all endpoints are now controller-based)
builder.Services.AddControllers();

var app = builder.Build();

// Map SPAS health endpoints (/_spas/health/*)
app.UseSpasHealthChecks();

// Map Controllers (provides all endpoints at /subscriptions/*)
app.MapControllers();

// Run SPAS service (generates metadata if --generate-metadata, else starts server)
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "subscription-service";
    options.ServiceName = "subscription-service";
    options.Version = "1.0.0";
    options.BoundedContext = "subscription";
    options.Description = "B2B subscription management service";
    options.AddCapability("subscription-management");

    options.ConfigureConsistency(c => c
        .WithCommands("ACID")
        .WithQueries("EVENTUAL"));

    options.ConfigureNetwork(n => n
        .AddRequiredEgress("localhost:6379"));

    options.ConfigureSecurity(s => s
        .WithAuthenticationType("jwt")
        .AddRequiredScope("subscriptions.read")
        .AddRequiredScope("subscriptions.write")
        .AddDataClassification("internal"));

    options.License = "MIT";
});
