using Microsoft.AspNetCore.Mvc;
using InventoryService.DTOs;
using InventoryService.Events;
using InventoryService.Models;
using InventoryService.Services;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;

namespace InventoryService.Controllers;

/// <summary>
/// Controller-based endpoints for inventory management.
/// </summary>
[Route("inventory")]
[ApiController]
public class InventoryController : ControllerBase
{
    private readonly InventoryStore _store;
    private readonly EventPublisher _publisher;

    public InventoryController(InventoryStore store, EventPublisher publisher)
    {
        _store = store;
        _publisher = publisher;
    }

    /// <summary>
    /// Lists current inventory levels for all products
    /// </summary>
    [HttpGet]
    [SpasQuery("ListInventory", "1.0",
        Description = "Lists current inventory levels for all products")]
    public ActionResult<IEnumerable<InventoryItem>> ListInventory()
    {
        return Ok(_store.GetAll());
    }

    /// <summary>
    /// Returns available/reserved quantity for a specific productId
    /// </summary>
    [HttpGet("{productId}")]
    [SpasQuery("GetInventory", "1.0",
        Description = "Returns available/reserved quantity for a specific productId")]
    public ActionResult<InventoryItem> GetInventory(string productId)
    {
        var item = _store.Get(productId);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    /// <summary>
    /// Reserves stock for an order and publishes StockReserved
    /// </summary>
    [HttpPost("reserve")]
    [SpasCommand("ReserveStock", "1.0",
        Description = "Reserves stock for an order and publishes StockReserved for successfully reserved items",
        Produces = new[] { typeof(StockReservedEvent), typeof(StockDepletedEvent) })]
    public async Task<ActionResult> ReserveStock([FromBody] ReserveStockRequest request)
    {
        Console.WriteLine($"[inventory-service] Reserving stock for order {request.OrderId}");

        var reservations = new List<StockReservation>();

        foreach (var item in request.Items)
        {
            var inventoryItem = _store.Get(item.ProductId);

            if (inventoryItem == null || inventoryItem.AvailableQuantity < item.Quantity)
            {
                Console.WriteLine($"[inventory-service] Stock depleted for {item.ProductId}: requested {item.Quantity}, available {inventoryItem?.AvailableQuantity ?? 0}");
                continue;
            }

            _store.Reserve(item.ProductId, item.Quantity);

            reservations.Add(new StockReservation(
                item.ProductId,
                item.Quantity,
                DateTime.UtcNow
            ));
        }

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
                await _publisher.PublishAsync<StockReservedEvent>(payload: reservedPayload);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to publish StockReserved event: {ex.Message}");
            }
        }

        return Ok(new { status = "processed", reservations = reservations.Count });
    }
}
