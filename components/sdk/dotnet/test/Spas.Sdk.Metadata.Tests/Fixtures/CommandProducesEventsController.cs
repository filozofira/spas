using Microsoft.AspNetCore.Mvc;
using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Tests.Fixtures;

/// <summary>
/// Test fixture controller for verifying Produces property on [SpasCommand] (T024 - US4).
/// Tests that controller commands can declare which events they produce.
/// </summary>
[Route("api/event-producing-commands")]
public class CommandProducesEventsController : ControllerBase
{
    /// <summary>
    /// Command that produces a single event.
    /// </summary>
    [HttpPost("create-order")]
    [SpasCommand("CreateOrderCommand", "1.0.0", 
        Description = "Creates an order and publishes OrderCreated event",
        Produces = new[] { typeof(TestOrderCreatedEvent) })]
    public IActionResult CreateOrder([FromBody] CreateOrderPayload payload)
    {
        return Ok();
    }

    /// <summary>
    /// Command that produces multiple events.
    /// </summary>
    [HttpPost("confirm-order")]
    [SpasCommand("ConfirmOrderCommand", "1.0.0",
        Description = "Confirms order and publishes multiple events",
        Produces = new[] { typeof(TestOrderConfirmedEvent), typeof(TestInventoryReservedEvent) })]
    public IActionResult ConfirmOrder([FromBody] ConfirmOrderPayload payload)
    {
        return Ok();
    }

    /// <summary>
    /// Command without Produces - no events declared.
    /// </summary>
    [HttpPost("cancel-order")]
    [SpasCommand("CancelOrderCommand", "1.0.0",
        Description = "Cancels an order without publishing events")]
    public IActionResult CancelOrder([FromBody] CancelOrderPayload payload)
    {
        return Ok();
    }
}

/// <summary>
/// Test event type for OrderCreated event.
/// </summary>
[SpasEvent("OrderCreated", "1.0")]
public record TestOrderCreatedEvent;

/// <summary>
/// Test event type for OrderConfirmed event.
/// </summary>
[SpasEvent("OrderConfirmed", "1.0")]
public record TestOrderConfirmedEvent;

/// <summary>
/// Test event type for InventoryReserved event.
/// </summary>
[SpasEvent("InventoryReserved", "1.0")]
public record TestInventoryReservedEvent;

/// <summary>
/// Test payload types for commands.
/// </summary>
public record CreateOrderPayload(string CustomerId, decimal Total);
public record ConfirmOrderPayload(Guid OrderId);
public record CancelOrderPayload(Guid OrderId);
