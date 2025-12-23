using Spas.Sdk.Metadata.Attributes;

namespace SubscriptionService.DTOs;

[SpasCommand("CreateSubscription", "1.0", Description = "Payload for CreateSubscription: customerId, productId, quantity, and billing frequency")]
public record CreateSubscriptionRequest(string CustomerId, string ProductId, int Quantity, string Frequency);

public record CreateSubscriptionResponse(Guid SubscriptionId, string Status);
