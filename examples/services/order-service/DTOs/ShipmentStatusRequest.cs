using Spas.Sdk.Metadata.Attributes;

namespace OrderService.DTOs;

[SpasCommand("UpdateShipmentStatus", "1.0", Description = "Payload for UpdateShipmentStatus: shipmentId, status, and optional tracking number")]
public record ShipmentStatusRequest(Guid OrderId, string ShipmentId, string Status, string? TrackingNumber = null);
