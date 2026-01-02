using OrderService.Models;
using Spas.Sdk.Metadata.Attributes;

namespace OrderService.Events;

[SpasEvent("OrderConfirmed", "1.0", Description = "Emitted after inventory reservation succeeds and the order is confirmed; triggers fulfillment")]
public record OrderConfirmedEvent(Guid OrderId, string Status, List<ReservedItem> ReservedItems, Address? ShippingAddress = null, string? ReferenceId = null);
