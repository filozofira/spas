package io.spas.examples.orders.events;

import io.spas.sdk.metadata.annotations.SpasEvent;

import java.math.BigDecimal;

/**
 * Domain event published when a new order is created.
 * Annotated with @SpasEvent to generate event contract in spas.json.
 * 
 * The annotation processor will:
 * - Extract event name: "OrderCreated"
 * - Generate schema reference: "#/components/schemas/OrderCreatedEvent"
 * - Add to events array in spas.json
 */
@SpasEvent(
    type = "OrderCreated",
    version = "1.0",
    schemaRef = "#/components/schemas/OrderCreatedEvent"
)
public record OrderCreatedEvent(
    String orderId,
    String customerId,
    BigDecimal total,
    String status
) {}
