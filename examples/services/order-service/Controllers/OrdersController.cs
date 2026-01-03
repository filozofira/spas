using Microsoft.AspNetCore.Mvc;
using OrderService.DTOs;
using OrderService.Events;
using OrderService.Models;
using OrderService.Services;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;

namespace OrderService.Controllers;

/// <summary>
/// Controller-based endpoints for order management.
/// </summary>
[Route("orders")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly OrderStore _store;
    private readonly EventPublisher _publisher;

    public OrdersController(OrderStore store, EventPublisher publisher)
    {
        _store = store;
        _publisher = publisher;
    }

    /// <summary>
    /// Creates a new order from cart items and publishes OrderCreated
    /// </summary>
    [HttpPost]
    [SpasCommand("CreateOrder", "1.0", 
        Description = "Creates a new order from cart items and publishes OrderCreated; returns the new orderId", 
        Produces = new[] { typeof(OrderCreatedEvent) })]
    public async Task<ActionResult<CreateOrderResponse>> CreateOrder([FromBody] CreateOrderRequest request)
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

        _store.Add(order);

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
            await _publisher.PublishAsync<OrderCreatedEvent>(payload: eventPayload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to publish OrderCreated event: {ex.Message}");
        }

        return CreatedAtAction(nameof(GetOrder), new { id = orderId }, new CreateOrderResponse(orderId, order.Status));
    }

    /// <summary>
    /// Lists all orders currently known to the service
    /// </summary>
    [HttpGet]
    [SpasQuery("ListOrders", "1.0", 
        Description = "Lists all orders currently known to the service")]
    public ActionResult<IEnumerable<Order>> ListOrders()
    {
        return Ok(_store.GetAll());
    }

    /// <summary>
    /// Returns order details and status history for a given orderId
    /// </summary>
    [HttpGet("{id}")]
    [SpasQuery("GetOrder", "1.0", 
        Description = "Returns order details and status history for a given orderId")]
    public ActionResult<object> GetOrder(Guid id)
    {
        var order = _store.Get(id);
        if (order == null) 
            return NotFound();
        
        return Ok(new {
            orderId = order.OrderId,
            customerId = order.CustomerId,
            items = order.Items,
            total = order.Total,
            status = order.Status,
            createdAt = order.CreatedAt,
            referenceId = order.ReferenceId,
            shippingAddress = order.ShippingAddress,
            statusHistory = order.StatusHistory.OrderBy(h => h.Timestamp).ToList(),
            shipmentId = order.ShipmentId,
            shipmentStatus = order.ShipmentStatus,
            trackingNumber = order.TrackingNumber,
            shipmentStatusHistory = order.ShipmentStatusHistory?.OrderBy(h => h.Timestamp).ToList()
        });
    }

    /// <summary>
    /// Confirms an order after inventory reservation and publishes OrderConfirmed
    /// </summary>
    [HttpPost("confirm")]
    [SpasCommand("ConfirmOrder", "1.0", 
        Description = "Confirms an order after inventory reservation and publishes OrderConfirmed", 
        Produces = new[] { typeof(OrderConfirmedEvent) })]
    public async Task<ActionResult> ConfirmOrder([FromBody] ConfirmOrderRequest request)
    {
        Console.WriteLine($"[order-service] Confirming order {request.OrderId} with {request.ReservedItems.Count} items reserved");

        var order = _store.Get(request.OrderId);
        if (order == null)
        {
            Console.WriteLine($"[order-service] Order {request.OrderId} not found");
            return NotFound(new { error = $"Order {request.OrderId} not found" });
        }

        var confirmedOrder = order.WithStatus("confirmed", $"Confirmed with {request.ReservedItems.Count} items reserved");
        _store.Add(confirmedOrder);

        Console.WriteLine($"[order-service] Order {request.OrderId} status updated to 'confirmed'");
        
        var eventPayload = new
        {
            orderId = request.OrderId,
            customerId = order.CustomerId,
            status = "confirmed",
            reservedItems = request.ReservedItems,
            referenceId = order.ReferenceId,
            shippingAddress = order.ShippingAddress
        };

        try
        {
            await _publisher.PublishAsync<OrderConfirmedEvent>(payload: eventPayload);
            Console.WriteLine($"[order-service] Published order-confirmed event for {request.OrderId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[order-service] Failed to publish order-confirmed event: {ex.Message}");
        }

        return Ok(new { orderId = request.OrderId, status = "confirmed", reservedItems = request.ReservedItems });
    }

    /// <summary>
    /// Updates shipment/tracking information for an order
    /// </summary>
    [HttpPost("shipment-status")]
    [SpasCommand("UpdateShipmentStatus", "1.0", 
        Description = "Updates shipment/tracking information for an order based on fulfillment, such as shipment created, in-transit, delivered, etc.")]
    public ActionResult UpdateShipmentStatus([FromBody] ShipmentStatusRequest request)
    {
        Console.WriteLine($"[order-service] Updating shipment status for order {request.OrderId}");

        var order = _store.Get(request.OrderId);
        if (order == null)
        {
            Console.WriteLine($"[order-service] Order {request.OrderId} not found");
            return NotFound(new { error = $"Order {request.OrderId} not found" });
        }

        var updatedOrder = order.WithShipmentStatus(
            request.ShipmentId, 
            request.Status, 
            request.TrackingNumber
        );
        _store.Add(updatedOrder);

        Console.WriteLine($"[order-service] Order {request.OrderId} shipment updated: shipmentId={request.ShipmentId}, status={request.Status}, tracking={request.TrackingNumber ?? "none"}");

        return Ok(new { 
            orderId = request.OrderId, 
            shipmentId = request.ShipmentId,
            shipmentStatus = request.Status,
            trackingNumber = request.TrackingNumber
        });
    }

    /// <summary>
    /// Cancels an existing order
    /// </summary>
    [HttpPost("{id}/cancel")]
    [SpasCommand("CancelOrder", "1.0", 
        Description = "Cancels an existing order",
        Produces = new[] { typeof(OrderCancelledEvent) })]
    public async Task<ActionResult> CancelOrder(Guid id, [FromBody] CancelOrderRequest request)
    {
        var order = _store.Get(id);
        if (order == null) 
            return NotFound(new { error = $"Order {id} not found" });

        if (order.Status == "shipped" || order.Status == "delivered")
            return BadRequest(new { error = "Cannot cancel order that has been shipped or delivered" });

        var cancelledOrder = order.WithStatus("cancelled", request.Reason ?? "Cancelled by customer");
        _store.Add(cancelledOrder);

        var eventPayload = new
        {
            orderId = id,
            customerId = order.CustomerId,
            status = "cancelled",
            reason = request.Reason,
            cancelledAt = DateTime.UtcNow
        };

        try
        {
            await _publisher.PublishAsync<OrderCancelledEvent>(payload: eventPayload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to publish OrderCancelled event: {ex.Message}");
        }

        return Ok(new { orderId = id, status = "cancelled" });
    }
}
