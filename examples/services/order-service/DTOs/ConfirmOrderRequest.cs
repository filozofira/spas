using OrderService.Models;
using Spas.Sdk.Metadata.Attributes;

namespace OrderService.DTOs;

[SpasCommand("ConfirmOrder", "1.0", Description = "Payload for ConfirmOrder: orderId and the items that were reserved by inventory")]
public record ConfirmOrderRequest(Guid OrderId, List<ReservedItem> ReservedItems);
