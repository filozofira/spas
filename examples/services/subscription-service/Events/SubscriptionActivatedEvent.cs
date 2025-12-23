using Spas.Sdk.Metadata.Attributes;

namespace SubscriptionService.Events;

[SpasEvent("SubscriptionActivated", "1.0", Description = "Emitted after a subscription transitions to active (may be disabled in some choreographies)")]
public record SubscriptionActivatedEvent(Guid SubscriptionId, Guid OrderId, string CustomerId, string ProductId, int Quantity, string Frequency, DateTime ActivatedAt);
