using Microsoft.AspNetCore.Mvc;
using InventoryService.DTOs;
using InventoryService.Events;
using InventoryService.Models;
using InventoryService.Services;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;
using System.Linq;

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
    /// Lists current inventory levels for all items
    /// </summary>
    [HttpGet]
    [SpasQuery("ListInventory", "1.0",
        Description = "Lists current inventory levels for all items")]
    public ActionResult<IEnumerable<InventoryItem>> ListInventory()
    {
        return Ok(_store.GetAll());
    }

    /// <summary>
    /// Returns available/reserved quantity for a specific itemId
    /// </summary>
    [HttpGet("{itemId}")]
    [SpasQuery("GetInventory", "1.0",
        Description = "Returns available/reserved quantity for a specific itemId")]
    public ActionResult<InventoryItem> GetInventory(string itemId)
    {
        var item = _store.Get(itemId);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    /// <summary>
    /// Initializes inventory tracking for a new item
    /// </summary>
    [HttpPost("items")]
    [SpasCommand("AddInventoryItem", "1.0",
        Description = "Initializes inventory tracking for a new item",
        Produces = new[] { typeof(InventoryItemAddedEvent) })]
    public async Task<ActionResult> AddInventoryItem([FromBody] AddInventoryItemRequest request)
    {
        Console.WriteLine($"[inventory-service] Adding inventory item {request.ItemId}");

        var success = _store.AddItem(request.ItemId, request.InitialQuantity);

        if (!success)
        {
            return Conflict(new { error = $"Item '{request.ItemId}' already exists in inventory" });
        }

        var payload = new
        {
            itemId = request.ItemId,
            initialQuantity = request.InitialQuantity,
            timestamp = DateTime.UtcNow
        };

        try
        {
            await _publisher.PublishAsync<InventoryItemAddedEvent>(payload: payload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to publish InventoryItemAddedEvent event: {ex.Message}");
        }

        return CreatedAtAction(nameof(GetInventory), new { itemId = request.ItemId }, new
        {
            itemId = request.ItemId,
            availableQuantity = request.InitialQuantity,
            reservedQuantity = 0
        });
    }

    /// <summary>
    /// Reserves stock for a reference (order, rental, etc.) and publishes StockReserved
    /// </summary>
    [HttpPost("reserve")]
    [SpasCommand("ReserveStock", "1.0",
        Description = "Reserves stock for a reference and publishes StockReserved for successfully reserved items",
        Produces = new[] { typeof(StockReservedEvent), typeof(StockDepletedEvent) })]
    public async Task<ActionResult> ReserveStock([FromBody] ReserveStockRequest request)
    {
        Console.WriteLine($"[inventory-service] Reserving stock for reference {request.ReferenceId}");

        var reservations = new List<StockReservation>();

        foreach (var item in request.Items)
        {
            var inventoryItem = _store.Get(item.ItemId);

            if (inventoryItem == null || inventoryItem.AvailableQuantity < item.Quantity)
            {
                Console.WriteLine($"[inventory-service] Stock depleted for {item.ItemId}: requested {item.Quantity}, available {inventoryItem?.AvailableQuantity ?? 0}");
                continue;
            }

            _store.Reserve(item.ItemId, item.Quantity);

            reservations.Add(new StockReservation(
                item.ItemId,
                item.Quantity,
                DateTime.UtcNow
            ));
        }

        if (reservations.Any())
        {
            var reservedPayload = new
            {
                referenceId = request.ReferenceId,
                reservations = reservations.Select(r => new
                {
                    itemId = r.ItemId,
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

    /// <summary>
    /// Releases reserved stock back to available inventory.
    /// Used for rental returns, order cancellations, or reverse logistics.
    /// </summary>
    [HttpPost("release")]
    [SpasCommand("ReleaseStock", "1.0",
        Description = "Releases reserved stock back to available inventory and publishes StockReleased",
        Produces = new[] { typeof(StockReleasedEvent) })]
    public async Task<ActionResult> ReleaseStock([FromBody] ReleaseStockRequest request)
    {
        Console.WriteLine($"[inventory-service] Releasing stock for reference {request.ReferenceId}");

        var releases = new List<StockReleaseItem>();

        foreach (var item in request.Items)
        {
            var success = _store.Release(item.ItemId, item.Quantity);

            if (success)
            {
                releases.Add(new StockReleaseItem(
                    item.ItemId,
                    item.Quantity,
                    DateTime.UtcNow
                ));
                Console.WriteLine($"[inventory-service] Released {item.Quantity} of {item.ItemId}");
            }
            else
            {
                Console.WriteLine($"[inventory-service] Could not release {item.ItemId}: no reserved stock found");
            }
        }

        if (releases.Any())
        {
            var releasedPayload = new
            {
                referenceId = request.ReferenceId,
                releases = releases.Select(r => new
                {
                    itemId = r.ItemId,
                    quantity = r.Quantity,
                    releasedAt = r.ReleasedAt
                }).ToList(),
                timestamp = DateTime.UtcNow
            };

            try
            {
                await _publisher.PublishAsync<StockReleasedEvent>(payload: releasedPayload);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to publish StockReleased event: {ex.Message}");
            }
        }

        return Ok(new { status = "processed", releases = releases.Count });
    }
}
