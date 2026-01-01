using Spas.Sdk.Metadata.Attributes;
using InventoryService.Models;

namespace InventoryService.Events;

[SpasEvent("StockReserved", "1.0", Description = "Emitted when stock is successfully reserved for one or more items against a reference (order, rental, etc.)")]
public record StockReservedEvent(Guid ReferenceId, List<StockReservation> Reservations, DateTime Timestamp);
