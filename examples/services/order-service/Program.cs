using OrderService.DTOs;
using OrderService.Events;
using OrderService.Models;
using OrderService.Services;
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
    [SpasCommand("CreateOrder", "1.0", Description = "Creates a new order from cart items and publishes OrderCreated; returns the new orderId", Produces = new[] { typeof(OrderCreatedEvent) })]
async (CreateOrderRequest request, EventPublisher publisher, OrderStore store) =>
    {
        var orderId = Guid.NewGuid();
        var order = new Order(
            orderId,
            request.CustomerId,
            request.Items,
            request.Total,
            "created",
            DateTime.UtcNow,
            request.ReferenceId,
            ShippingAddress: request.ShippingAddress
        ).WithStatus("created", "Order created by customer");

        store.Add(order);

        // Publish OrderCreated event
        var eventPayload = new
        {
            orderId,
            customerId = request.CustomerId,
            items = request.Items,
            total = request.Total,
            createdAt = order.CreatedAt,
            referenceId = request.ReferenceId,
            shippingAddress = request.ShippingAddress
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
    [SpasQuery("ListOrders", "1.0", Description = "Lists all orders currently known to the service")]
(OrderStore store) =>
    {
        return Results.Ok(store.GetAll());
    });

// GET /orders/{id} - Get specific order
app.MapGet("/orders/{id}",
    [SpasQuery("GetOrder", "1.0", Description = "Returns order details and status history for a given orderId")]
(Guid id, OrderStore store) =>
    {
        var order = store.Get(id);
        if (order == null) return Results.NotFound();
        
        return Results.Ok(new {
            orderId = order.OrderId,
            customerId = order.CustomerId,
            items = order.Items,
            total = order.Total,
            status = order.Status,
            createdAt = order.CreatedAt,
            referenceId = order.ReferenceId,
            shippingAddress = order.ShippingAddress,
            statusHistory = order.StatusHistory.OrderBy(h => h.Timestamp).ToList(),
            // Shipment tracking
            shipmentId = order.ShipmentId,
            shipmentStatus = order.ShipmentStatus,
            trackingNumber = order.TrackingNumber,
            shipmentStatusHistory = order.ShipmentStatusHistory?.OrderBy(h => h.Timestamp).ToList()
        });
    });

// POST /orders/confirm - Confirm order after stock reservation
app.MapPost("/orders/confirm",
    [SpasCommand("ConfirmOrder", "1.0", Description = "Confirms an order after inventory reservation and publishes OrderConfirmed", Produces = new[] { typeof(OrderConfirmedEvent) })]
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
        var confirmedOrder = order.WithStatus("confirmed", $"Confirmed with {request.ReservedItems.Count} items reserved");
        store.Add(confirmedOrder);

        Console.WriteLine($"[order-service] Order {request.OrderId} status updated to 'confirmed'");
        
        // Publish OrderConfirmed event
        var eventPayload = new
        {
            orderId = request.OrderId,
            status = "confirmed",
            reservedItems = request.ReservedItems,
            referenceId = order.ReferenceId,
            shippingAddress = order.ShippingAddress
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

// POST /orders/shipment-status - Handle shipment status updates from fulfillment service
app.MapPost("/orders/shipment-status",
    [SpasCommand("UpdateShipmentStatus", "1.0", Description = "Updates shipment/tracking information for an order based on fulfillment, such as shipment created, in-transit, delivered, etc.")]
(ShipmentStatusRequest request, OrderStore store) =>
    {
        Console.WriteLine($"[order-service] Updating shipment status for order {request.OrderId}");

        var order = store.Get(request.OrderId);
        if (order == null)
        {
            Console.WriteLine($"[order-service] Order {request.OrderId} not found");
            return Results.NotFound(new { error = $"Order {request.OrderId} not found" });
        }

        // Update order with shipment info
        var updatedOrder = order.WithShipmentStatus(
            request.ShipmentId, 
            request.Status, 
            request.TrackingNumber
        );
        store.Add(updatedOrder);

        Console.WriteLine($"[order-service] Order {request.OrderId} shipment updated: shipmentId={request.ShipmentId}, status={request.Status}, tracking={request.TrackingNumber ?? "none"}");

        return Results.Ok(new { 
            orderId = request.OrderId, 
            shipmentId = request.ShipmentId,
            shipmentStatus = request.Status,
            trackingNumber = request.TrackingNumber
        });
    });

app.MapGet("/", () => "Order Service");
app.MapGet("/health", () => new { status = "healthy", service = "order-service", timestamp = DateTime.UtcNow });

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
        Console.Error.WriteLine("Usage: dotnet run -- --generate-metadata --output <path>");
        Environment.ExitCode = 2;
        return;
    }

    Console.WriteLine("Generating SPAS metadata archive (offline; no listening ports)...");
    var archivePath = await app.GenerateSpasMetadataArchiveAsync(
        identity,
        outputDirectory: outputDirectory,
        assemblyToScan: typeof(Program).Assembly);

    Console.WriteLine($"SPAS metadata archive generated at: {archivePath}");
    return;
}

app.Run();
