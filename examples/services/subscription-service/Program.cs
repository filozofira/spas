using Spas.Sdk.Core.Identity;
using Spas.Sdk.Events.Publish;
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
    [SpasCommand("CreateSubscription", "1.0")]
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
        );

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
    [SpasQuery("ListSubscriptions", "1.0")]
(SubscriptionStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /subscriptions/{id} - Get specific subscription
app.MapGet("/subscriptions/{id}",
    [SpasQuery("GetSubscription", "1.0")]
(Guid id, SubscriptionStore store) =>
    {
        var subscription = store.Get(id);
        return subscription != null ? Results.Ok(subscription) : Results.NotFound();
    });

// POST /subscriptions/process - Create order from subscription (triggered by subscription-created event in choreography)
app.MapPost("/subscriptions/process",
    [SpasCommand("CreateOrderFromSubscription", "1.0")]
async (CreateOrderFromSubscriptionRequest request, EventPublisher publisher, SubscriptionStore store) =>
    {
        Console.WriteLine($"[subscription-service] Processing subscription {request.SubscriptionId}");

        var subscription = store.Get(request.SubscriptionId);
        if (subscription == null)
        {
            Console.WriteLine($"[subscription-service] Subscription {request.SubscriptionId} not found");
            return Results.NotFound(new { error = $"Subscription {request.SubscriptionId} not found" });
        }

        // Update subscription status to processing
        var processingSubscription = subscription with { Status = "processing" };
        store.Add(processingSubscription);

        Console.WriteLine($"[subscription-service] Subscription {request.SubscriptionId} status updated to 'processing'");
        return Results.Ok(new { subscriptionId = request.SubscriptionId, status = "processing" });
    });

// POST /subscriptions/activate - Activate subscription after order confirmation
app.MapPost("/subscriptions/activate",
    [SpasCommand("ActivateSubscription", "1.0")]
async (ActivateSubscriptionRequest request, EventPublisher publisher, SubscriptionStore store) =>
    {
        Console.WriteLine($"[subscription-service] Activating subscription for order {request.OrderId}");

        // Find subscription by matching the related order
        var subscription = store.GetAll().FirstOrDefault(s => s.Status == "processing");
        if (subscription == null)
        {
            Console.WriteLine($"[subscription-service] No processing subscription found for order {request.OrderId}");
            return Results.NotFound(new { error = "No processing subscription found" });
        }

        // Update subscription status to active
        var activeSubscription = subscription with { Status = "active" };
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

        try
        {
            await publisher.PublishAsync<SubscriptionActivatedEvent>(payload: eventPayload);
            Console.WriteLine($"[subscription-service] Published subscription-activated event");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[subscription-service] Failed to publish event: {ex.Message}");
        }

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

// Request/Response types
[SpasCommand("CreateSubscription", "1.0")]
public record CreateSubscriptionRequest(string CustomerId, string ProductId, int Quantity, string Frequency);

public record CreateSubscriptionResponse(Guid SubscriptionId, string Status);

[SpasCommand("CreateOrderFromSubscription", "1.0")]
public record CreateOrderFromSubscriptionRequest(Guid SubscriptionId, string CustomerId, string ProductId, int Quantity);

[SpasCommand("ActivateSubscription", "1.0")]
public record ActivateSubscriptionRequest(Guid OrderId, string Status);

// Domain models
public record Subscription(Guid SubscriptionId, string CustomerId, string ProductId, int Quantity, string Frequency, string Status, DateTime CreatedAt);

// Events (outbound only)
[SpasEvent("SubscriptionCreated", "1.0", EventType = "com.subscription.subscription-created")]
public record SubscriptionCreatedEvent(Guid SubscriptionId, string CustomerId, string ProductId, int Quantity, string Frequency, DateTime CreatedAt);

[SpasEvent("SubscriptionActivated", "1.0", EventType = "com.subscription.subscription-activated")]
public record SubscriptionActivatedEvent(Guid SubscriptionId, Guid OrderId, string CustomerId, string ProductId, int Quantity, string Frequency, DateTime ActivatedAt);

// In-memory store
public class SubscriptionStore
{
    private readonly ConcurrentDictionary<Guid, Subscription> _subscriptions = new();

    public void Add(Subscription subscription) => _subscriptions[subscription.SubscriptionId] = subscription;
    public Subscription? Get(Guid id) => _subscriptions.TryGetValue(id, out var subscription) ? subscription : null;
    public IEnumerable<Subscription> GetAll() => _subscriptions.Values;
}
