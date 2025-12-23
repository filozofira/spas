namespace InventoryService.Models;

public record InventoryItem(string ProductId, int AvailableQuantity, int ReservedQuantity);
