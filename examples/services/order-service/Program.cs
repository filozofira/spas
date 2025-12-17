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
var serviceName = builder.Services.AddSpasServices(builder.Configuration, "order-service");

// In-memory order store
builder.Services.AddSingleton<OrderStore>();

var app = builder.Build();

app.UseSpasIdentity();

// Service identity
var identity = new ServiceIdentityBuilder()
    .WithId("order-service")
    .WithName("order-service")
    .WithVersion("1.0.0")
    .WithBoundedContext("order")
    .WithDescription("Order lifecycle management service")
    .AddCapability("order-management")
    .Build();

// POST /orders - Create new order
app.MapPost("/orders",
    [SpasCommand("CreateOrder", "1.0")]
async (CreateOrderRequest request, EventPublisher publisher, OrderStore store) =>
    {
        var orderId = Guid.NewGuid();
        var order = new Order(
            orderId,
            request.CustomerId,
            request.Items,
            request.Total,
            "created",
            DateTime.UtcNow
        );

        store.Add(order);

        // Publish OrderCreated event
        var eventPayload = new
        {
            orderId,
            customerId = request.CustomerId,
            items = request.Items,
            total = request.Total,
            createdAt = order.CreatedAt
        };

        try
        {
            await publisher.PublishAsync<OrderCreatedEvent>(payload: eventPayload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to publish OrderCreated event: {ex.Message}");
        }

        return Results.Created($"/orders/{orderId}", new CreateOrderResponse(orderId, order.Status));
    });

// GET /orders - List all orders
app.MapGet("/orders",
    [SpasQuery("ListOrders", "1.0")]
(OrderStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /orders/{id} - Get specific order
app.MapGet("/orders/{id}",
    [SpasQuery("GetOrder", "1.0")]
(Guid id, OrderStore store) =>
    {
        var order = store.Get(id);
        return order != null ? Results.Ok(order) : Results.NotFound();
    });

// POST /orders/confirm - Confirm order after stock reservation
app.MapPost("/orders/confirm",
    [SpasCommand("ConfirmOrder", "1.0")]
async (ConfirmOrderRequest request, EventPublisher publisher, OrderStore store) =>
    {
        Console.WriteLine($"[order-service] Confirming order {request.OrderId} with {request.ReservedItems.Count} items reserved");

        var order = store.Get(request.OrderId);
        if (order == null)
        {
            Console.WriteLine($"[order-service] Order {request.OrderId} not found");
            return Results.NotFound(new { error = $"Order {request.OrderId} not found" });
        }

        // Update order status to confirmed
        var confirmedOrder = order with { Status = "confirmed" };
        store.Add(confirmedOrder);

        Console.WriteLine($"[order-service] Order {request.OrderId} status updated to 'confirmed'");
        
        // Publish OrderConfirmed event
        var eventPayload = new
        {
            orderId = request.OrderId,
            status = "confirmed",
            reservedItems = request.ReservedItems
        };

        try
        {
            await publisher.PublishAsync<OrderConfirmedEvent>(payload: eventPayload);
            Console.WriteLine($"[order-service] Published order-confirmed event for {request.OrderId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[order-service] Failed to publish order-confirmed event: {ex.Message}");
        }

        return Results.Ok(new { orderId = request.OrderId, status = "confirmed", reservedItems = request.ReservedItems });
    });

// Discover contracts
var contracts = app.DiscoverSpasMetadata();

var security = new SecurityBuilder()
    .WithAuthenticationType("jwt")
    .AddRequiredScope("orders.read")
    .AddRequiredScope("orders.write")
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

app.MapGet("/", () => "Order Service");
app.MapGet("/health", () => new { status = "healthy", service = "order-service", timestamp = DateTime.UtcNow });

app.Run();

// Request/Response types
[SpasCommand("CreateOrder", "1.0")]
public record CreateOrderRequest(string CustomerId, List<OrderItem> Items, decimal Total);

public record CreateOrderResponse(Guid OrderId, string Status);

[SpasCommand("ConfirmOrder", "1.0")]
public record ConfirmOrderRequest(Guid OrderId, List<ReservedItem> ReservedItems);

public record OrderItem(string ProductId, int Quantity, decimal Price);

public record ReservedItem(string ProductId, int Quantity);

// Domain models
public record Order(Guid OrderId, string CustomerId, List<OrderItem> Items, decimal Total, string Status, DateTime CreatedAt);

// Events (outbound only)
[SpasEvent("OrderCreated", "1.0", EventType = "com.ecommerce.order.created")]
public record OrderCreatedEvent(Guid OrderId, string CustomerId, List<OrderItem> Items, decimal Total, DateTime CreatedAt);

[SpasEvent("OrderConfirmed", "1.0", EventType = "com.order.order-confirmed")]
public record OrderConfirmedEvent(Guid OrderId, string Status, List<ReservedItem> ReservedItems);

// In-memory store
public class OrderStore
{
    private readonly ConcurrentDictionary<Guid, Order> _orders = new();

    public void Add(Order order) => _orders[order.OrderId] = order;
    public Order? Get(Guid id) => _orders.TryGetValue(id, out var order) ? order : null;
    public IEnumerable<Order> GetAll() => _orders.Values;
}
