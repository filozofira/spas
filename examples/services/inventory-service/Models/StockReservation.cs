namespace InventoryService.Models;

public record StockReservation(string ItemId, int Quantity, DateTime ReservedAt);
