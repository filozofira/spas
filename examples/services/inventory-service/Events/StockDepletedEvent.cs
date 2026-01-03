using Spas.Sdk.Metadata.Attributes;

namespace InventoryService.Events;

[SpasEvent("StockDepleted", "1.0", Description = "Emitted when requested quantity exceeds available inventory for an item")]
public record StockDepletedEvent(string ItemId, Guid ReferenceId, int RequestedQuantity, int AvailableQuantity, DateTime Timestamp);
