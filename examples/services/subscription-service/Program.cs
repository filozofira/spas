using Microsoft.AspNetCore.Builder;
using SubscriptionService.DTOs;
using SubscriptionService.Events;
using SubscriptionService.Models;
using SubscriptionService.Services;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<SubscriptionStore>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "subscription-service");

var app = builder.Build();

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

app.MapGet("/", () => "Subscription Service");
app.MapGet("/health", () => new { status = "healthy", service = "subscription-service", timestamp = DateTime.UtcNow });

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
