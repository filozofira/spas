using Spas.Sdk.Metadata.Attributes;

namespace OrderService.Events;

[SpasEvent("OrderCancelled", "1.0", 
    Description = "Published when an order is cancelled")]
public record OrderCancelledEvent;
