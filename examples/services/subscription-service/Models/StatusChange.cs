namespace SubscriptionService.Models;

public record StatusChange(string Status, DateTime Timestamp, string? Reason = null);
