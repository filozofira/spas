using Spas.Sdk.Metadata.Attributes;

namespace InventoryService.DTOs;

[SpasCommand("ReserveStock", "1.0", Description = "Payload for ReserveStock: orderId and the set of product quantities to reserve")]
public record ReserveStockRequest(Guid OrderId, List<OrderItem> Items);

public record OrderItem(string ProductId, int Quantity);
