namespace InventoryService.Models;

public record StockReservation(string ProductId, int Quantity, DateTime ReservedAt);
