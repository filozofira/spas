namespace OrderService.Models;

public record ShipmentStatusChange(string Status, DateTime Timestamp, string? TrackingNumber = null);
