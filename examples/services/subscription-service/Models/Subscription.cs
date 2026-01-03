namespace SubscriptionService.Models;

public record Subscription(
    Guid SubscriptionId, 
    string CustomerId, 
    string ProductId, 
    int Quantity, 
    string Frequency, 
    string Status, 
    DateTime CreatedAt,
    List<StatusChange>? StatusHistory = null
)
{
    public List<StatusChange> StatusHistory { get; init; } = StatusHistory ?? new();
    
    public Subscription WithStatus(string newStatus, string? reason = null)
    {
        var statusChange = new StatusChange(newStatus, DateTime.UtcNow, reason);
        var updatedHistory = new List<StatusChange>(StatusHistory) { statusChange };
        return this with { Status = newStatus, StatusHistory = updatedHistory };
    }
}
