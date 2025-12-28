namespace SubscriptionService.DTOs;

/// <summary>
/// Payload for ActivateSubscription: orderId, status, and optional referenceId for correlation.
/// </summary>
public record ActivateSubscriptionRequest(Guid OrderId, string Status, string? ReferenceId = null);
