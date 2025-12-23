using OrderService.Models;
using Spas.Sdk.Metadata.Attributes;

namespace OrderService.DTOs;

[SpasCommand("CreateOrder", "1.0", Description = "Payload for CreateOrder: customerId, items, totals, shippingAddress, and optional referenceId")]
public record CreateOrderRequest(string CustomerId, List<OrderItem> Items, decimal Total, Address ShippingAddress, string? ReferenceId = null);
