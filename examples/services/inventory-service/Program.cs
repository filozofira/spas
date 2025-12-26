using InventoryService.DTOs;
using InventoryService.Events;
using InventoryService.Models;
using InventoryService.Services;
using Spas.Sdk.Core.Identity;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Generation;
using Spas.Sdk.Observability.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register SPAS metadata services with auto-discovery
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
    options.AutoGenerateSchemaReferences = true;
});

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

static bool TryGetOutputDirectory(string[] args, out string? outputDirectory)
{
    outputDirectory = null;

    for (var i = 0; i < args.Length; i++)
    {
        if (string.Equals(args[i], MetadataGenerationConstants.OutputDirectoryArgument, StringComparison.OrdinalIgnoreCase))
        {
            if (i + 1 >= args.Length || string.IsNullOrWhiteSpace(args[i + 1]))
            {
                return false;
            }

            outputDirectory = args[i + 1];
            return true;
        }
    }

    return true;
}

if (args.Any(a => string.Equals(a, MetadataGenerationConstants.GenerateMetadataArgument, StringComparison.OrdinalIgnoreCase)))
{
    if (!TryGetOutputDirectory(args, out var outputDirectory))
    {
        Console.Error.WriteLine("Missing value for --output <path>.");
        Environment.ExitCode = 2;
        return;
    }

    var archivePath = await app.GenerateSpasMetadataArchiveAsync(
        identity,
        outputDirectory: outputDirectory,
        assemblyToScan: typeof(Program).Assembly);

    Console.WriteLine($"SPAS metadata archive generated at: {archivePath}");
    return;
}

app.Run();
