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
var serviceName = builder.Services.AddSpasServices(builder.Configuration, "inventory-service");

// In-memory inventory store
builder.Services.AddSingleton<InventoryStore>();

var app = builder.Build();

app.UseSpasIdentity();

// Service identity
var identity = new ServiceIdentityBuilder()
    .WithId("inventory-service")
    .WithName("inventory-service")
    .WithVersion("1.0.0")
    .WithBoundedContext("inventory")
    .WithDescription("Stock tracking and reservation service")
    .AddCapability("inventory-tracking")
    .Build();

// GET /inventory - List all inventory items
app.MapGet("/inventory",
    (InventoryStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /inventory/{productId} - Get stock for specific product
app.MapGet("/inventory/{productId}",
    (string productId, InventoryStore store) =>
    {
        var item = store.Get(productId);
        return item != null ? Results.Ok(item) : Results.NotFound();
    });

// POST /incoming - Receive events from sidecar (OrderCreated)
app.MapPost("/incoming",
    async (OrderCreatedEvent orderEvent, EventPublisher publisher, InventoryStore store) =>
    {
        // Reserve stock for each item in the order
        var reservations = new List<StockReservation>();
        
        foreach (var item in orderEvent.Items)
        {
            var inventoryItem = store.Get(item.ProductId);
            
            if (inventoryItem == null || inventoryItem.AvailableQuantity < item.Quantity)
            {
                // Stock depleted
                var depletedPayload = new
                {
                    productId = item.ProductId,
                    orderId = orderEvent.OrderId,
                    requestedQuantity = item.Quantity,
                    availableQuantity = inventoryItem?.AvailableQuantity ?? 0,
                    timestamp = DateTime.UtcNow
                };

                try
                {
                    await publisher.PublishAsync<StockDepletedEvent>(payload: depletedPayload);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to publish StockDepleted event: {ex.Message}");
                }
                
                continue;
            }

            // Reserve stock
            store.Reserve(item.ProductId, item.Quantity);
            
            reservations.Add(new StockReservation(
                item.ProductId,
                item.Quantity,
                DateTime.UtcNow
            ));
        }

        // Publish StockReserved event if any reservations were made
        if (reservations.Any())
        {
            var reservedPayload = new
            {
                orderId = orderEvent.OrderId,
                reservations = reservations.Select(r => new
                {
                    productId = r.ProductId,
                    quantity = r.Quantity,
                    reservedAt = r.ReservedAt
                }).ToList(),
                timestamp = DateTime.UtcNow
            };

            try
            {
                await publisher.PublishAsync<StockReservedEvent>(payload: reservedPayload);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to publish StockReserved event: {ex.Message}");
            }
        }

        return Results.Ok(new { status = "processed", reservations = reservations.Count });
    });

// Discover contracts
var contracts = app.DiscoverSpasMetadata();

var security = new SecurityBuilder()
    .WithAuthenticationType("jwt")
    .AddRequiredScope("inventory.read")
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

app.MapGet("/", () => "Inventory Service");
app.MapGet("/health", () => new { status = "healthy", service = "inventory-service", timestamp = DateTime.UtcNow });

app.Run();

// Domain models
public record InventoryItem(string ProductId, int AvailableQuantity, int ReservedQuantity);
public record StockReservation(string ProductId, int Quantity, DateTime ReservedAt);
public record OrderItem(string ProductId, int Quantity, decimal Price);

// Events subscribed
[SpasEvent("OrderCreated", "1.0", EventType = "com.ecommerce.order.created")]
public record OrderCreatedEvent(Guid OrderId, string CustomerId, List<OrderItem> Items, decimal Total, DateTime CreatedAt);

// Events published
[SpasEvent("StockReserved", "1.0", EventType = "com.inventory.stock.reserved")]
public record StockReservedEvent(Guid OrderId, List<StockReservation> Reservations, DateTime Timestamp);

[SpasEvent("StockDepleted", "1.0", EventType = "com.inventory.stock.depleted")]
public record StockDepletedEvent(string ProductId, Guid OrderId, int RequestedQuantity, int AvailableQuantity, DateTime Timestamp);

// In-memory store with sample data
public class InventoryStore
{
    private readonly ConcurrentDictionary<string, InventoryItem> _inventory = new();

    public InventoryStore()
    {
        // Seed with sample products
        _inventory["prod-001"] = new InventoryItem("prod-001", 100, 0);
        _inventory["prod-002"] = new InventoryItem("prod-002", 50, 0);
        _inventory["prod-003"] = new InventoryItem("prod-003", 75, 0);
    }

    public InventoryItem? Get(string productId) => 
        _inventory.TryGetValue(productId, out var item) ? item : null;

    public IEnumerable<InventoryItem> GetAll() => _inventory.Values;

    public void Reserve(string productId, int quantity)
    {
        if (_inventory.TryGetValue(productId, out var item))
        {
            var newAvailable = item.AvailableQuantity - quantity;
            var newReserved = item.ReservedQuantity + quantity;
            _inventory[productId] = new InventoryItem(productId, newAvailable, newReserved);
        }
    }
}
