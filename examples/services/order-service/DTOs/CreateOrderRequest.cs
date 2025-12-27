using OrderService.Models;

namespace OrderService.DTOs;

/// <summary>
/// Payload for CreateOrder: customerId, items, totals, shippingAddress, and optional referenceId.
/// </summary>
public record CreateOrderRequest(string CustomerId, List<OrderItem> Items, decimal Total, Address ShippingAddress, string? ReferenceId = null);
