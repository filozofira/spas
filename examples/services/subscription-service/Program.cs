using SubscriptionService.DTOs;
using SubscriptionService.Events;
using SubscriptionService.Models;
using SubscriptionService.Services;
using Spas.Sdk.Core.Identity;
using Spas.Sdk.Events.Publish;
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
var serviceName = builder.Services.AddSpasServices(builder.Configuration, "subscription-service");

// In-memory subscription store
builder.Services.AddSingleton<SubscriptionStore>();

var app = builder.Build();

app.UseSpasIdentity();

// Service identity
var identity = new ServiceIdentityBuilder()
    .WithId("subscription-service")
    .WithName("subscription-service")
    .WithVersion("1.0.0")
    .WithBoundedContext("subscription")
    .WithDescription("B2B subscription management service")
    .AddCapability("subscription-management")
    .Build();

// POST /subscriptions - Create new subscription
app.MapPost("/subscriptions",
    [SpasCommand("CreateSubscription", "1.0", Description = "Creates a new subscription for a customer/product and publishes SubscriptionCreated", Produces = new[] { typeof(SubscriptionCreatedEvent) })]
async (CreateSubscriptionRequest request, EventPublisher publisher, SubscriptionStore store) =>
    {
        var subscriptionId = Guid.NewGuid();
        var subscription = new Subscription(
            subscriptionId,
            request.CustomerId,
            request.ProductId,
            request.Quantity,
            request.Frequency,
            "pending",
            DateTime.UtcNow
        ).WithStatus("pending", "Subscription created");

        store.Add(subscription);

        Console.WriteLine($"[subscription-service] Created subscription {subscriptionId} for customer {request.CustomerId}");

        // Publish SubscriptionCreated event
        var eventPayload = new
        {
            subscriptionId,
            customerId = request.CustomerId,
            productId = request.ProductId,
            quantity = request.Quantity,
            frequency = request.Frequency,
            createdAt = subscription.CreatedAt
        };

        try
        {
            await publisher.PublishAsync<SubscriptionCreatedEvent>(payload: eventPayload);
            Console.WriteLine($"[subscription-service] Published subscription-created event for {subscriptionId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[subscription-service] Failed to publish event: {ex.Message}");
        }

        return Results.Created($"/subscriptions/{subscriptionId}", new CreateSubscriptionResponse(subscriptionId, subscription.Status));
    });

// GET /subscriptions - List all subscriptions
app.MapGet("/subscriptions",
    [SpasQuery("ListSubscriptions", "1.0", Description = "Lists all subscriptions currently known to the service")]
(SubscriptionStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /subscriptions/{id} - Get specific subscription
app.MapGet("/subscriptions/{id}",
    [SpasQuery("GetSubscription", "1.0", Description = "Returns subscription details and status history for a given subscriptionId")]
(Guid id, SubscriptionStore store) =>
    {
        var subscription = store.Get(id);
        if (subscription == null) return Results.NotFound();
        
        return Results.Ok(new {
            subscriptionId = subscription.SubscriptionId,
            customerId = subscription.CustomerId,
            productId = subscription.ProductId,
            quantity = subscription.Quantity,
            frequency = subscription.Frequency,
            status = subscription.Status,
            createdAt = subscription.CreatedAt,
            statusHistory = subscription.StatusHistory.OrderBy(h => h.Timestamp).ToList()
        });
    });

// POST /subscriptions/activate - Activate subscription after order confirmation
app.MapPost("/subscriptions/activate",
    [SpasCommand("ActivateSubscription", "1.0", Description = "Activates a subscription after an order is confirmed (correlates via referenceId)")]
async (ActivateSubscriptionRequest request, EventPublisher publisher, SubscriptionStore store) =>
    {
        Console.WriteLine($"[subscription-service] Activating subscription for order {request.OrderId}, referenceId: {request.ReferenceId}");

        // Find subscription by referenceId (correlation pattern)
        Subscription? subscription = null;
        if (!string.IsNullOrEmpty(request.ReferenceId) && Guid.TryParse(request.ReferenceId, out var subscriptionId))
        {
            subscription = store.Get(subscriptionId);
        }
        
        if (subscription == null)
        {
            Console.WriteLine($"[subscription-service] Subscription not found for referenceId: {request.ReferenceId}");
            return Results.NotFound(new { error = "Subscription not found", referenceId = request.ReferenceId });
        }

        // Update subscription status to active
        var activeSubscription = subscription.WithStatus("active", $"Activated after order {request.OrderId} confirmation");
        store.Add(activeSubscription);

        Console.WriteLine($"[subscription-service] Subscription {subscription.SubscriptionId} activated");

        // Publish SubscriptionActivated event
        var eventPayload = new
        {
            subscriptionId = subscription.SubscriptionId,
            orderId = request.OrderId,
            customerId = subscription.CustomerId,
            productId = subscription.ProductId,
            quantity = subscription.Quantity,
            frequency = subscription.Frequency,
            activatedAt = DateTime.UtcNow
        };

        // NOTE: subscription-activated event removed - no consumers in choreography
        // Publishing it causes infinite loop if sidecar eventType filtering not working
        Console.WriteLine($"[subscription-service] Subscription {subscription.SubscriptionId} activated");

        return Results.Ok(new { subscriptionId = subscription.SubscriptionId, status = "active", orderId = request.OrderId });
    });

// Discover contracts
var contracts = app.DiscoverSpasMetadata();

var security = new SecurityBuilder()
    .WithAuthenticationType("jwt")
    .AddRequiredScope("subscriptions.read")
    .AddRequiredScope("subscriptions.write")
    .AddDataClassification("internal")
    .Build();

var consistency = new ConsistencyBuilder()
    .WithCommands("ACID")
    .WithQueries("EVENTUAL")
    .Build();

var network = new NetworkBuilder()
    .AddRequiredEgress("localhost:6379")  // Redis
    .Build();

// Compose metadata
var composer = new SpasComposer();
var metadataPath = Path.Combine(AppContext.BaseDirectory, "spas.json");
composer.ComposeToFile(metadataPath, identity, contracts, security, consistency, network, "MIT");

// Map metadata endpoint
app.MapSpasMetadataEndpoint(
    metadataProvider: () => composer.Compose(identity, contracts, security, consistency, network, "MIT"));

app.MapGet("/", () => "Subscription Service");
app.MapGet("/health", () => new { status = "healthy", service = "subscription-service", timestamp = DateTime.UtcNow });

app.Run();
