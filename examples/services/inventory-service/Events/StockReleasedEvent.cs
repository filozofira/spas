using Spas.Sdk.Metadata.Attributes;

namespace InventoryService.Events;

[SpasEvent("StockReleased", "1.0", Description = "Emitted when reserved stock is released back to available inventory")]
public record StockReleasedEvent(Guid ReferenceId, List<StockReleaseItem> Releases, DateTime Timestamp);

public record StockReleaseItem(string ProductId, int Quantity, DateTime ReleasedAt);
