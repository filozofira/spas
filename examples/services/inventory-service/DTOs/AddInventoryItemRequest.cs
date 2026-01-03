namespace InventoryService.DTOs;

/// <summary>
/// Request to initialize inventory tracking for a new product.
/// </summary>
public record AddInventoryItemRequest(
    string ProductId,
    int InitialQuantity = 0
);
