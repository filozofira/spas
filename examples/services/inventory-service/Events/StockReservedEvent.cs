using Spas.Sdk.Metadata.Attributes;
using InventoryService.Models;

namespace InventoryService.Events;

[SpasEvent("StockReserved", "1.0", Description = "Emitted when stock is successfully reserved for one or more items in an order")]
public record StockReservedEvent(Guid OrderId, List<StockReservation> Reservations, DateTime Timestamp);
