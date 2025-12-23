namespace OrderService.Models;

public record Order(
    Guid OrderId, 
    string CustomerId, 
    List<OrderItem> Items, 
    decimal Total, 
    string Status, 
    DateTime CreatedAt, 
    string? ReferenceId = null,
    Address? ShippingAddress = null,
    List<StatusChange> StatusHistory = null,
    // Shipment tracking fields
    string? ShipmentId = null,
    string? ShipmentStatus = null,
    string? TrackingNumber = null,
    List<ShipmentStatusChange>? ShipmentStatusHistory = null
)
{
    public List<StatusChange> StatusHistory { get; init; } = StatusHistory ?? new();
    public List<ShipmentStatusChange> ShipmentStatusHistory { get; init; } = ShipmentStatusHistory ?? new();
    
    public Order WithStatus(string newStatus, string? reason = null)
    {
        var statusChange = new StatusChange(newStatus, DateTime.UtcNow, reason);
        var updatedHistory = new List<StatusChange>(StatusHistory) { statusChange };
        return this with { Status = newStatus, StatusHistory = updatedHistory };
    }
    
    public Order WithShipmentStatus(string shipmentId, string shipmentStatus, string? trackingNumber = null)
    {
        var statusChange = new ShipmentStatusChange(shipmentStatus, DateTime.UtcNow, trackingNumber);
        var updatedHistory = new List<ShipmentStatusChange>(ShipmentStatusHistory) { statusChange };
        return this with { 
            ShipmentId = shipmentId, 
            ShipmentStatus = shipmentStatus, 
            TrackingNumber = trackingNumber ?? TrackingNumber,
            ShipmentStatusHistory = updatedHistory 
        };
    }
}
