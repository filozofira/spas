namespace OrderService.DTOs;

/// <summary>
/// Payload for UpdateShipmentStatus: shipmentId, status, and optional tracking number.
/// </summary>
public record ShipmentStatusRequest(Guid OrderId, string ShipmentId, string Status, string? TrackingNumber = null);
