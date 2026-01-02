using OrderService.Models;
using Spas.Sdk.Metadata.Attributes;

namespace OrderService.Events;

[SpasEvent("OrderCreated", "1.0", Description = "Emitted after a new order is created; signals downstream services to reserve stock")]
public record OrderCreatedEvent(Guid OrderId, string CustomerId, List<OrderItem> Items, decimal Total, DateTime CreatedAt, Address? ShippingAddress = null, string? ReferenceId = null);
