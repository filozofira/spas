namespace SubscriptionService.DTOs;

/// <summary>
/// Payload for CreateSubscription: customerId, productId, quantity, and billing frequency.
/// </summary>
public record CreateSubscriptionRequest(string CustomerId, string ProductId, int Quantity, string Frequency);

public record CreateSubscriptionResponse(Guid SubscriptionId, string Status);
