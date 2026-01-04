namespace InventoryService.Models;

public record InventoryItem(string ItemId, int AvailableQuantity, int ReservedQuantity);
