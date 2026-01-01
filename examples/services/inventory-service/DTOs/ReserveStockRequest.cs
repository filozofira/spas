namespace InventoryService.DTOs;

/// <summary>
/// Payload for ReserveStock: referenceId (orderId, rentalId, etc.) and the set of product quantities to reserve.
/// </summary>
public record ReserveStockRequest(Guid ReferenceId, List<OrderItem> Items);

public record OrderItem(string ProductId, int Quantity);
