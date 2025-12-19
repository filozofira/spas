package io.spas.examples.orders.api;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating a new order.
 * Used by the CreateOrder command endpoint.
 */
public record CreateOrderRequest(
    String customerId,
    List<OrderItem> items,
    BigDecimal total
) {
    /**
     * Represents an item in the order.
     */
    public record OrderItem(
        String productId,
        int quantity,
        BigDecimal price
    ) {}
}
