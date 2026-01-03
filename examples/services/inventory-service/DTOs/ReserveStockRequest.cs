namespace InventoryService.DTOs;

/// <summary>
/// Payload for ReserveStock: referenceId (orderId, rentalId, etc.) and the set of item quantities to reserve.
/// </summary>
public record ReserveStockRequest(Guid ReferenceId, List<ReserveItem> Items);

public record ReserveItem(string ItemId, int Quantity);
