using Microsoft.AspNetCore.Mvc;
using SubscriptionService.DTOs;
using SubscriptionService.Events;
using SubscriptionService.Models;
using SubscriptionService.Services;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;

namespace SubscriptionService.Controllers;

/// <summary>
/// Controller-based endpoints for subscription management.
/// </summary>
[Route("subscriptions")]
[ApiController]
public class SubscriptionsController : ControllerBase
{
    private readonly SubscriptionStore _store;
    private readonly EventPublisher _publisher;

    public SubscriptionsController(SubscriptionStore store, EventPublisher publisher)
    {
        _store = store;
        _publisher = publisher;
    }

    /// <summary>
    /// Lists all subscriptions with optional customerId filter
    /// </summary>
    [HttpGet]
    [SpasQuery("ListSubscriptions", "1.0",
        Description = "Lists all subscriptions with optional customerId filter")]
    public ActionResult<IEnumerable<Subscription>> ListSubscriptions([FromQuery] string? customerId = null)
    {
        var subscriptions = _store.GetAll();

        if (!string.IsNullOrWhiteSpace(customerId))
        {
            subscriptions = subscriptions.Where(s => s.CustomerId == customerId);
        }

        return Ok(subscriptions.ToList());
    }

    /// <summary>
    /// Returns a specific subscription by ID
    /// </summary>
    [HttpGet("{id}")]
    [SpasQuery("GetSubscription", "1.0",
        Description = "Returns a specific subscription by ID")]
    public ActionResult<Subscription> GetSubscription(Guid id)
    {
        var subscription = _store.Get(id);
        if (subscription == null)
            return NotFound();

        return Ok(subscription);
    }

    /// <summary>
    /// Creates a new subscription
    /// </summary>
    [HttpPost]
    [SpasCommand("CreateSubscription", "1.0",
        Description = "Creates a new subscription and publishes SubscriptionCreated",
        Produces = new[] { typeof(SubscriptionCreatedEvent) })]
    public async Task<ActionResult<CreateSubscriptionResponse>> CreateSubscription([FromBody] CreateSubscriptionRequest request)
    {
        Console.WriteLine($"[subscription-service] Creating subscription for customer {request.CustomerId}");

        var subscriptionId = Guid.NewGuid();
        var subscription = new Subscription(
            subscriptionId,
            request.CustomerId,
            request.ProductId,
            request.Quantity,
            request.Frequency,
            "pending",
            DateTime.UtcNow
        );

        _store.Add(subscription);

        var eventPayload = new
        {
            subscriptionId,
            customerId = request.CustomerId,
            productId = request.ProductId,
            quantity = request.Quantity,
            frequency = request.Frequency,
            status = "pending",
            createdAt = subscription.CreatedAt
        };

        try
        {
            await _publisher.PublishAsync<SubscriptionCreatedEvent>(payload: eventPayload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to publish SubscriptionCreated event: {ex.Message}");
        }

        return CreatedAtAction(
            nameof(GetSubscription),
            new { id = subscriptionId },
            new CreateSubscriptionResponse(subscriptionId, subscription.Status));
    }

    /// <summary>
    /// Activates a pending subscription
    /// </summary>
    [HttpPost("activate")]
    [SpasCommand("ActivateSubscription", "1.0",
        Description = "Activates a subscription after an order is confirmed (correlates via referenceId)",
        Produces = new[] { typeof(SubscriptionActivatedEvent) })]
    public ActionResult ActivateSubscription([FromBody] ActivateSubscriptionRequest request)
    {
        Console.WriteLine($"[subscription-service] Activating subscription for order {request.OrderId}, referenceId: {request.ReferenceId}");

        // Find subscription by referenceId (correlation pattern)
        Subscription? subscription = null;
        if (!string.IsNullOrEmpty(request.ReferenceId) && Guid.TryParse(request.ReferenceId, out var subscriptionId))
        {
            subscription = _store.Get(subscriptionId);
        }

        if (subscription == null)
        {
            Console.WriteLine($"[subscription-service] Subscription not found for referenceId: {request.ReferenceId}");
            return NotFound(new { error = "Subscription not found", referenceId = request.ReferenceId });
        }

        // Update subscription status to active
        var activeSubscription = subscription.WithStatus("active", $"Activated after order {request.OrderId} confirmation");
        _store.Add(activeSubscription);

        Console.WriteLine($"[subscription-service] Subscription {subscription.SubscriptionId} activated");

        return Ok(new { subscriptionId = subscription.SubscriptionId, status = "active", orderId = request.OrderId });
    }
}
