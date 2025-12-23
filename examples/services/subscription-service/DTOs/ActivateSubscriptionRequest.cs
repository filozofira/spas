using Spas.Sdk.Metadata.Attributes;

namespace SubscriptionService.DTOs;

[SpasCommand("ActivateSubscription", "1.0", Description = "Payload for ActivateSubscription: orderId, status, and optional referenceId for correlation")]
public record ActivateSubscriptionRequest(Guid OrderId, string Status, string? ReferenceId = null);
