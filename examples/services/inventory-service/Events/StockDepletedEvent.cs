using Spas.Sdk.Metadata.Attributes;

namespace InventoryService.Events;

[SpasEvent("StockDepleted", "1.0", Description = "Emitted when requested quantity exceeds available inventory for a product")]
public record StockDepletedEvent(string ProductId, Guid ReferenceId, int RequestedQuantity, int AvailableQuantity, DateTime Timestamp);
