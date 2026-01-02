using OrderService.Models;

namespace OrderService.DTOs;

/// <summary>
/// Payload for CreateOrder: customerId, items, totals, optional shippingAddress (required only when fulfillment participates), and optional referenceId.
/// </summary>
public record CreateOrderRequest(string CustomerId, List<OrderItem> Items, decimal Total, Address? ShippingAddress = null, string? ReferenceId = null);
