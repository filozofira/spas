namespace InventoryService.DTOs;

/// <summary>
/// Payload for ReleaseStock: reference ID (orderId, rentalId, etc.) and items to release back to available inventory.
/// </summary>
public record ReleaseStockRequest(Guid ReferenceId, List<ReleaseItem> Items);

public record ReleaseItem(string ItemId, int Quantity);
