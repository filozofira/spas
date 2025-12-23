using Spas.Sdk.Metadata.Attributes;

namespace SubscriptionService.Events;

[SpasEvent("SubscriptionCreated", "1.0", Description = "Emitted after a subscription is created; indicates subscription is pending activation")]
public record SubscriptionCreatedEvent(Guid SubscriptionId, string CustomerId, string ProductId, int Quantity, string Frequency, DateTime CreatedAt);
