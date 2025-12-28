namespace InventoryService.DTOs;

/// <summary>
/// Payload for ReserveStock: orderId and the set of product quantities to reserve.
/// </summary>
public record ReserveStockRequest(Guid OrderId, List<OrderItem> Items);

public record OrderItem(string ProductId, int Quantity);
