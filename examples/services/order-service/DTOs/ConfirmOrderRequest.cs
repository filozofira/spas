using OrderService.Models;

namespace OrderService.DTOs;

/// <summary>
/// Payload for ConfirmOrder: orderId and the items that were reserved by inventory.
/// </summary>
public record ConfirmOrderRequest(Guid OrderId, List<ReservedItem> ReservedItems);
