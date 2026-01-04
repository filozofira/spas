using Spas.Sdk.Metadata.Attributes;
using InventoryService.Models;

namespace InventoryService.Events;

[SpasEvent("StockReserved", "1.0", Description = "Emitted when item quantities are successfully reserved against a reference (order, rental, subscription, etc.)")]
public record StockReservedEvent(Guid ReferenceId, List<StockReservation> Reservations, DateTime Timestamp);
