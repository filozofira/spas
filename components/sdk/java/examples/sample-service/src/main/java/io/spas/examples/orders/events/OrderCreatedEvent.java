package io.spas.examples.orders.events;

import io.spas.sdk.metadata.annotations.SpasEvent;

import java.math.BigDecimal;

/**
 * Domain event published when a new order is created.
 * Annotated with @SpasEvent to generate event contract in spas.json.
 * 
 * The SDK will:
 * - Extract event type: "OrderCreated" (written as kebab-case in metadata)
 * - Auto-generate schemaRef when omitted: "schemas/events/order-created.schema.json"
 * - Include the event contract in spas.json
 */
@SpasEvent(
    type = "OrderCreated",
    version = "1.0"
)
public record OrderCreatedEvent(
    String orderId,
    String customerId,
    BigDecimal total,
    String status
) {}
