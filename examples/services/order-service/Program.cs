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
    (OrderStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /orders/{id} - Get specific order
app.MapGet("/orders/{id}",
    (Guid id, OrderStore store) =>
    {
        var order = store.Get(id);
        return order != null ? Results.Ok(order) : Results.NotFound();
    });

// POST /incoming - Receive events from sidecar (e.g., OrderRequested in B2B)
app.MapPost("/incoming",
    async (OrderRequestedEvent request, EventPublisher publisher, OrderStore store) =>
    {
        // B2B subscription scenario: OrderRequested → create order → publish OrderCreated
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

        // Publish OrderCreated
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

        return Results.Ok(new { orderId, status = "created" });
    });

// POST /events/stock-reserved - Receive StockReserved events from inventory-service
app.MapPost("/events/stock-reserved",
    (StockReservedEvent stockEvent, OrderStore store) =>
    {
        Console.WriteLine($"[order-service] Received StockReserved for order {stockEvent.OrderId}");
        
        var order = store.Get(stockEvent.OrderId);
        if (order == null)
        {
            Console.WriteLine($"[order-service] Order {stockEvent.OrderId} not found");
            return Results.NotFound(new { error = $"Order {stockEvent.OrderId} not found" });
        }

        // Update order status to confirmed
        var updatedOrder = order with { Status = "confirmed" };
        store.Add(updatedOrder);
        
        Console.WriteLine($"[order-service] Order {stockEvent.OrderId} status updated to 'confirmed'");
        return Results.Ok(new { orderId = stockEvent.OrderId, status = "confirmed" });
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

public record OrderItem(string ProductId, int Quantity, decimal Price);

// Domain models
public record Order(Guid OrderId, string CustomerId, List<OrderItem> Items, decimal Total, string Status, DateTime CreatedAt);

// Events
[SpasEvent("OrderCreated", "1.0", EventType = "com.ecommerce.order.created")]
public record OrderCreatedEvent(Guid OrderId, string CustomerId, List<OrderItem> Items, decimal Total, DateTime CreatedAt);

[SpasEvent("OrderRequested", "1.0", EventType = "com.b2b.order.requested")]
public record OrderRequestedEvent(string CustomerId, List<OrderItem> Items, decimal Total);

// Inbound events (subscribed)
[SpasEvent("StockReserved", "1.0", EventType = "com.inventory.stock.reserved")]
public record StockReservedEvent(Guid OrderId, List<ReservedItem> ReservedItems, DateTime ReservedAt);

public record ReservedItem(string ProductId, int Quantity);

// In-memory store
public class OrderStore
{
    private readonly ConcurrentDictionary<Guid, Order> _orders = new();

    public void Add(Order order) => _orders[order.OrderId] = order;
    public Order? Get(Guid id) => _orders.TryGetValue(id, out var order) ? order : null;
    public IEnumerable<Order> GetAll() => _orders.Values;
}
