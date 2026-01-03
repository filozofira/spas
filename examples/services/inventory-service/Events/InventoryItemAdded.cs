using Spas.Sdk.Metadata.Attributes;

namespace InventoryService.Events;

/// <summary>
/// Event emitted when a new inventory item is successfully added.
/// </summary>
[SpasEvent("inventory-item-added", "1.0",
    Description = "Emitted when inventory tracking is initialized for a new item")]
public record InventoryItemAddedEvent(
    string ItemId,
    int InitialQuantity
);
