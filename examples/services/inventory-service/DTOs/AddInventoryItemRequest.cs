namespace InventoryService.DTOs;

/// <summary>
/// Request to initialize inventory tracking for a new item.
/// </summary>
public record AddInventoryItemRequest(
    string ItemId,
    int InitialQuantity = 0
);
