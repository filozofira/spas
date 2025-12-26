using Microsoft.AspNetCore.Builder;
using InventoryService.DTOs;
using InventoryService.Events;
using InventoryService.Models;
using InventoryService.Services;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddSingleton<InventoryStore>();
builder.Services.AddSpasMetadata();
builder.Services.AddSpasServices(builder.Configuration, "inventory-service");

var app = builder.Build();

// GET /inventory - List all inventory items
app.MapGet("/inventory",
    [SpasQuery("ListInventory", "1.0", Description = "Lists current inventory levels for all products")]
    (InventoryStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /inventory/{productId} - Get stock for specific product
app.MapGet("/inventory/{productId}",
    [SpasQuery("GetInventory", "1.0", Description = "Returns available/reserved quantity for a specific productId")]
    (string productId, InventoryStore store) =>
    {
        var item = store.Get(productId);
        return item != null ? Results.Ok(item) : Results.NotFound();
    });

// POST /inventory/reserve - Reserve stock for order
app.MapPost("/inventory/reserve",
    [SpasCommand("ReserveStock", "1.0", Description = "Reserves stock for an order and publishes StockReserved for successfully reserved items", Produces = new[] { typeof(StockReservedEvent) })]
    async (ReserveStockRequest request, EventPublisher publisher, InventoryStore store) =>
    {
        Console.WriteLine($"[inventory-service] Reserving stock for order {request.OrderId}");
        
        // Reserve stock for each item in the order
        var reservations = new List<StockReservation>();
        
        foreach (var item in request.Items)
        {
            var inventoryItem = store.Get(item.ProductId);
            
            if (inventoryItem == null || inventoryItem.AvailableQuantity < item.Quantity)
            {
                // Stock depleted - log but don't publish event (not in choreography)
                Console.WriteLine($"[inventory-service] Stock depleted for {item.ProductId}: requested {item.Quantity}, available {inventoryItem?.AvailableQuantity ?? 0}");
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
                orderId = request.OrderId,
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

app.MapGet("/", () => "Inventory Service");
app.MapGet("/health", () => new { status = "healthy", service = "inventory-service", timestamp = DateTime.UtcNow });

// Run SPAS service (generates metadata if --generate-metadata, else starts server)
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "inventory-service";
    options.ServiceName = "inventory-service";
    options.Version = "1.0.0";
    options.BoundedContext = "inventory";
    options.Description = "Stock tracking and reservation service";
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
